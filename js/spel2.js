const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// Canvas settings
const width = canvas.width;
const height = canvas.height;
const scaleX = width / 100;
const scaleY = height / 50;
let drawing = false;
let lastPoint = null;
let currentLine = [];
const drawnPoints = new Set();
const platformHeight = 5; // Platform height in custom coordinates
let isDragging = false;
let joystickStrength = 0; // For acceleration based on distance from click
const ballRadius = 4; // Ball radius in custom coordinates
let ballPosition = { x: -45, y: 2.6 - ballRadius }; // Starting on the left end of the permanent line
const gravity = 0.2; // Gravity strength (adjust for faster or slower fall)
const bounce = 0.2; // A small bounce effect (set to 0 for no bounce)
let ballVelocity = { x: 0, y: 0 }; // Velocity of the ball (initially at rest)
let isOnPlatform = false; // Flag to check if the ball is on the platform
const maxVelocity = 1.5;  // Max horizontal speed for the ball
const acceleration = 0.1;  // Acceleration when the arrow keys are pressed
const deceleration = 0.05;  // Deceleration when the keys are released
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = canvas.width;
offscreenCanvas.height = canvas.height;
const offscreenCtx = offscreenCanvas.getContext('2d');
const spatialGrid = new Map();

let isMovingLeft = false;
let isMovingRight = false;

window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        isMovingLeft = true;
    }
    if (event.key === 'ArrowRight') {
        isMovingRight = true;
    }
});

window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') {
        isMovingLeft = false;
    }
    if (event.key === 'ArrowRight') {
        isMovingRight = false;
    }
});

// Check if the ball sweeps through a line segment
function sweptCircleLineCollision(ballStart, ballEnd, radius, lineStart, lineEnd) {
    const lineDx = lineEnd.x - lineStart.x;
    const lineDy = lineEnd.y - lineStart.y;

    const ballDx = ballEnd.x - ballStart.x;
    const ballDy = ballEnd.y - ballStart.y;

    const A = lineDx * lineDx + lineDy * lineDy; // Line segment squared length
    const B = 2 * (ballDx * (ballStart.x - lineStart.x) + ballDy * (ballStart.y - lineStart.y));
    const C = (ballStart.x - lineStart.x) ** 2 + (ballStart.y - lineStart.y) ** 2 - radius * radius;

    const discriminant = B * B - 4 * A * C;

    // If the discriminant is negative, no collision
    if (discriminant < 0) {
        return false;
    }

    // Solve for t (time of collision along the ball's path)
    const t1 = (-B - Math.sqrt(discriminant)) / (2 * A);
    const t2 = (-B + Math.sqrt(discriminant)) / (2 * A);

    // Check if collision occurs within the range of the ball's movement
    if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
        return true;
    }

    return false;
}



// History stacks
let undoStack = [];
let redoStack = [];
let allLines = []; // Stores all drawn lines

// Helper to snap to nearest 0.5
function snapToHalf(value) {
    return Math.round(value * 2) / 2;
}

function addToSpatialGrid(line) {
    line.forEach(point => {
        const key = `${Math.floor(point.x)},${Math.floor(point.y)}`;
        if (!spatialGrid.has(key)) spatialGrid.set(key, []);
        spatialGrid.get(key).push(line);
    });
}

// On adding a new line:
addToSpatialGrid(currentLine);

// Helper to convert canvas pixels to custom coordinates
function toCustomCoords(x, y) {
    const customX = snapToHalf((x - width / 2) / scaleX);
    const customY = snapToHalf(-(y - height / 2) / scaleY);
    return { x: customX, y: customY };
}

// Helper to convert custom coordinates to canvas pixels
function toCanvasCoords(x, y) {
    const canvasX = x * scaleX + width / 2;
    const canvasY = -y * scaleY + height / 2;
    return { x: canvasX, y: canvasY };
}

// Function to draw a dot
function drawDot(x, y) {
    ctx.fillStyle = 'black';
    ctx.fillRect(x - 0.25 * scaleX, y - 0.25 * scaleY, 0.5 * scaleX, 0.5 * scaleY);
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.stroke();
}

function addLinePoint(x1, y1, x2, y2) {
    const start = toCustomCoords(x1, y1);
    const end = toCustomCoords(x2, y2);

    if (currentLine.length > 0) {
        const lastPoint = currentLine[currentLine.length - 1];
        if (lastPoint.x === end.x && lastPoint.y === end.y) {
            // Skip duplicate point
            return;
        }

        // Interpolate points between the last point and the new point
        const interpolatedPoints = interpolatePoints(lastPoint, end);
        currentLine.push(...interpolatedPoints);
    } else {
        // First point in the line
        currentLine.push(start);
    }

    currentLine.push(end);

    ctx.beginPath();
    const canvasStart = toCanvasCoords(start.x, start.y);
    const canvasEnd = toCanvasCoords(end.x, end.y);
    ctx.moveTo(canvasStart.x, canvasStart.y);
    ctx.lineTo(canvasEnd.x, canvasEnd.y);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.stroke();
}



// Function to detect and adjust vertical lines
function adjustVerticalLines() {
    allLines.forEach((line, index) => {
        let lastX = null;
        let inVerticalSegment = false;

        for (let i = 1; i < line.length; i++) {
            const currentPoint = line[i];
            const previousPoint = line[i - 1];

            // Check if the current x-value is the same as the previous x-value
            if (currentPoint.x === previousPoint.x && currentPoint.y !== previousPoint.y) {
                if (!inVerticalSegment) {
                    // Start of a new vertical line segment
                    inVerticalSegment = true;
                }
            } else {
                // End of a vertical line segment
                inVerticalSegment = false;
            }

            lastX = currentPoint.x;
        }
    });
}


// Function to save the current canvas state
function saveState() {
    undoStack.push(JSON.parse(JSON.stringify(allLines))); // deep copy
    redoStack.length = 0;
    saveToLocalStorage();
}

// Function to save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('allLines', JSON.stringify(allLines));
    localStorage.setItem('undoStack', JSON.stringify(undoStack));
    localStorage.setItem('redoStack', JSON.stringify(redoStack));
    refreshConsole();
}

// Undo function
function undo() {
    if (undoStack.length > 0) {
        redoStack.push(JSON.parse(JSON.stringify(allLines))); // Deep copy
        allLines = undoStack.pop();
        redrawCanvas();
        saveToLocalStorage();
        updateIntersectionLogs(); // Recalculate intersections
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(JSON.parse(JSON.stringify(allLines))); // Deep copy
        allLines = redoStack.pop();
        redrawCanvas();
        saveToLocalStorage();
        updateIntersectionLogs(); // Recalculate intersections
    }
}


// Reset function to clear everything
function resetCanvas() {
    allLines = []; // Clear all user-drawn lines
    undoStack = []; // Clear undo history
    redoStack = []; // Clear redo history
    drawnPoints.clear(); // Clear drawn points
    ctx.clearRect(0, 0, width, height); // Clear the entire canvas

    // Clear intersection logs
    localStorage.setItem('intersectionLogs', JSON.stringify([]));
    console.clear();
    console.log("Canvas reset. All intersections cleared.");

    drawPermanentLine(); // Redraw the permanent line
    drawBall(); // Redraw the ball
    saveToLocalStorage(); // Save the updated state
}



function drawPermanentLine() {
    const yPosition = -5; // Set the y-coordinate slightly lower than the middle
    const start = toCanvasCoords(-50, yPosition); // Start point (left edge, lower-middle)
    const end = toCanvasCoords(-40, yPosition); // End point (right edge, same height)

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5; // Thickness of 3
    ctx.stroke();
}

function drawPermanentLineOffscreen() {
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    const yPosition = -5;
    const start = toCanvasCoords(-50, yPosition);
    const end = toCanvasCoords(-40, yPosition);

    offscreenCtx.beginPath();
    offscreenCtx.moveTo(start.x, start.y);
    offscreenCtx.lineTo(end.x, end.y);
    offscreenCtx.strokeStyle = 'black';
    offscreenCtx.lineWidth = 5;
    offscreenCtx.stroke();
}


// Function to redraw the entire canvas
function redrawCanvas() {
    ctx.clearRect(0, 0, width, height); // Clear the canvas
    drawPermanentLine(); // Draw the permanent line first
    ctx.drawImage(offscreenCanvas, 0, 0); // Use pre-rendered lines
    drawBall(); // Draw the ball

    allLines.forEach(line => {
        if (line.length > 1) {
            for (let i = 1; i < line.length; i++) {
                const start = toCanvasCoords(line[i - 1].x, line[i - 1].y);
                const end = toCanvasCoords(line[i].x, line[i].y);
                drawLine(start.x, start.y, end.x, end.y);
            }
        }
    });
}

function lineIntersectsBall(x1, y1, x2, y2) {
    const ballCanvasPos = toCanvasCoords(ballPosition.x, ballPosition.y);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - ballCanvasPos.x;
    const fy = y1 - ballCanvasPos.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - (ballRadius * scaleX) ** 2;

    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
        return false; // No intersection
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2 * a);
    const t2 = (-b + sqrtDiscriminant) / (2 * a);

    // Check if either intersection point is within the segment
    if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
        return true;
    }

    return false;
}


// Refresh console output with all current lines
function refreshConsole() {
    console.clear();
    allLines.forEach((line, index) => {
        const lineString = line.map(point => `(${point.x}, ${point.y})`).join(' ');
    });
    adjustVerticalLines();
}

// Restore data from localStorage
function restoreFromLocalStorage() {
    const storedLines = JSON.parse(localStorage.getItem('allLines')) || [];
    const storedUndoStack = JSON.parse(localStorage.getItem('undoStack')) || [];
    const storedRedoStack = JSON.parse(localStorage.getItem('redoStack')) || [];

    allLines = storedLines;
    undoStack = storedUndoStack;
    redoStack = storedRedoStack;

    // Redraw the canvas with the restored lines
    redrawCanvas();

    // Recalculate intersections and update logs
    updateIntersectionLogs(); // Recalculate based on current allLines
}



canvas.addEventListener('mousedown', (event) => {
    const { offsetX, offsetY } = event;
    if (isInsideBall(offsetX, offsetY)) return; // Ignore if starting inside the ball
    lastPoint = { x: offsetX, y: offsetY };
    currentLine = [];
    drawing = true;
    saveState();
});



let lastMouseMove = 0;
canvas.addEventListener('mousemove', (event) => {
    const now = Date.now();
    if (now - lastMouseMove < 16) return; // Limit to ~60 FPS
    lastMouseMove = now;

    if (!drawing) return;

    const { offsetX, offsetY } = event;

    // Stop drawing if the line intersects with the ball's boundary
    if (lineIntersectsBall(lastPoint.x, lastPoint.y, offsetX, offsetY)) {
        drawing = false; // Stop drawing
        return;
    }

    addLinePoint(lastPoint.x, lastPoint.y, offsetX, offsetY);
    lastPoint = { x: offsetX, y: offsetY };
});

function logAllPoints() {
    console.clear(); // Clear the console for clean output
    console.log("Points on all lines:");

    allLines.forEach((line, lineIndex) => {
        console.log(`Line ${lineIndex + 1}:`);
        line.forEach((point, pointIndex) => {
            console.log(`  Point ${pointIndex + 1}: (${point.x}, ${point.y})`);
        });
    });

    console.log("End of points.");
}

function interpolatePoints(start, end, step = 0.5) {
    const points = [];
    const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    const steps = Math.ceil(distance / step);

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        points.push({
            x: start.x + t * (end.x - start.x),
            y: start.y + t * (end.y - start.y),
        });
    }

    return points;
}


canvas.addEventListener('mouseup', () => {
    if (drawing) {
        allLines.push(currentLine);
        saveToLocalStorage();
        adjustVerticalLines();

        // Check for intersections
        findAndLogIntersections();
    }

    drawing = false;
    lastPoint = null;
});





canvas.addEventListener('mouseleave', () => {
    drawing = false;
    lastPoint = null;
});

// Button event listeners
document.getElementById('undoButton').addEventListener('click', undo);
document.getElementById('redoButton').addEventListener('click', redo);
document.getElementById('resetButton').addEventListener('click', resetCanvas); // Reset button

// Restore canvas on page load
window.addEventListener('load', () => {
    restoreFromLocalStorage();
    drawPermanentLine();
    drawBall();
});

function getLineIntersection(line1, line2) {
    const [p1, p2] = line1;
    const [p3, p4] = line2;

    const s1_x = p2.x - p1.x;
    const s1_y = p2.y - p1.y;
    const s2_x = p4.x - p3.x;
    const s2_y = p4.y - p3.y;

    const denominator = (-s2_x * s1_y + s1_x * s2_y);

    // If the denominator is 0, the lines are parallel or coincident
    if (denominator === 0) return null;

    const s = (-s1_y * (p1.x - p3.x) + s1_x * (p1.y - p3.y)) / denominator;
    const t = ( s2_x * (p1.y - p3.y) - s2_y * (p1.x - p3.x)) / denominator;

    // Check if s and t are between 0 and 1 (intersection within the segments)
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Intersection point
        return {
            x: p1.x + (t * s1_x),
            y: p1.y + (t * s1_y)
        };
    }

    return null; // No valid intersection
}



// Function to draw the ball with a border
function drawBall() {
    const canvasPos = toCanvasCoords(ballPosition.x, ballPosition.y);

    // Draw the ball (filled circle)
    ctx.beginPath();
    ctx.arc(canvasPos.x, canvasPos.y, ballRadius * scaleX, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();

    // Draw the border (outline)
    ctx.lineWidth = 3; // Thickness of the border
    ctx.strokeStyle = 'black'; // Color of the border
    ctx.stroke();
}

function isInsideBall(x, y) {
    const ballCanvasPos = toCanvasCoords(ballPosition.x, ballPosition.y);
    const distance = Math.sqrt((x - ballCanvasPos.x) ** 2 + (y - ballCanvasPos.y) ** 2);
    return distance <= ballRadius * scaleX;
}

function findAndLogIntersections() {
    const intersectionLogs = JSON.parse(localStorage.getItem('intersectionLogs')) || [];

    let newLogs = [];

    // Iterate over every pair of lines
    for (let i = 0; i < allLines.length; i++) {
        const line1 = allLines[i];
        for (let j = i + 1; j < allLines.length; j++) {
            const line2 = allLines[j];

            // Check each segment of line1 against each segment of line2
            for (let k = 1; k < line1.length; k++) {
                for (let l = 1; l < line2.length; l++) {
                    const intersection = getLineIntersection(
                        [line1[k - 1], line1[k]],
                        [line2[l - 1], line2[l]]
                    );

                    if (intersection) {
                        const intersectionStr = `(${intersection.x.toFixed(2)}, ${intersection.y.toFixed(2)})`;
                        console.log(intersectionStr);
                        newLogs.push(intersectionStr);
                    }
                }
            }
        }
    }

    // Merge new logs with existing logs and save to localStorage
    const updatedLogs = [...intersectionLogs, ...newLogs];
    localStorage.setItem('intersectionLogs', JSON.stringify(updatedLogs));

    const intersections = []; // Reset intersections
    for (let i = 0; i < allLines.length; i++) {
        const line1 = allLines[i];
        for (let j = i + 1; j < allLines.length; j++) {
            const line2 = allLines[j];
            for (let k = 1; k < line1.length; k++) {
                for (let l = 1; l < line2.length; l++) {
                    const intersection = getLineIntersection(
                        [line1[k - 1], line1[k]],
                        [line2[l - 1], line2[l]]
                    );
                    if (intersection) {
                        intersections.push({
                            point: intersection,
                            lines: [line1, line2]
                        });
                    }
                }
            }
        }
    }
}




// Function to check if the ball collides with a line segment and adjust velocity
function checkLineCollision(ballPos) {
    const ballBottomY = ballPos.y - ballRadius; // Bottom of the ball
    let closestY = null;
    let closestLine = null;
    let minDistance = Infinity;
    let isVerticalCollision = false;

    // Iterate through all lines to find the closest line segment
    for (let line of allLines) {
        for (let i = 1; i < line.length; i++) {
            const start = line[i - 1];
            const end = line[i];

            // Check for vertical line segment
            if (start.x === end.x && start.y !== end.y) {
                const verticalX = start.x;

                // Calculate the height of the vertical line
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);
                const verticalHeight = maxY - minY;

                if (Math.abs(ballPos.x - verticalX) <= ballRadius &&
                    ballPos.y >= minY &&
                    ballPos.y <= maxY) {

                    if (verticalHeight < ballRadius) {
                        // Short vertical line: teleport the ball above it
                        ballPos.y = maxY + ballRadius + 0.5;
                        ballVelocity.y = 0; // Reset vertical velocity
                    } else {
                        // Taller vertical line: bounce as usual
                        isVerticalCollision = true;

                        // Reverse x-velocity for bounce effect
                        ballVelocity.x = -ballVelocity.x;

                        // Adjust ball position to avoid getting stuck
                        if (ballPos.x < verticalX) {
                            ballPos.x = verticalX - ballRadius;
                        } else {
                            ballPos.x = verticalX + ballRadius;
                        }
                    }

                    return true; // Return immediately since we handled the collision
                }
            }

            // Check if the ball's x-position is within the line segment's x-range (for non-vertical lines)
            if ((ballPos.x >= Math.min(start.x, end.x)) && (ballPos.x <= Math.max(start.x, end.x))) {
                // Calculate the y-value on the line segment for the ball's x-position
                const t = (ballPos.x - start.x) / (end.x - start.x);
                const yOnLine = start.y + t * (end.y - start.y);

                // Calculate the distance between the bottom of the ball and the y-value on the line
                const distance = Math.abs(ballBottomY - yOnLine);

                // If this is the closest line segment, update closestY and closestLine
                if (distance < minDistance) {
                    minDistance = distance;
                    closestY = yOnLine;
                    closestLine = { start, end };
                }
            }
        }
    }

    // Also check the permanent line
    const permanentStart = { x: -50, y: -5 };
    const permanentEnd = { x: -40, y: -5 };
    if ((ballPos.x >= permanentStart.x) && (ballPos.x <= permanentEnd.x)) {
        const t = (ballPos.x - permanentStart.x) / (permanentEnd.x - permanentStart.x);
        const yOnPermanentLine = permanentStart.y + t * (permanentEnd.y - permanentStart.y);
        const distance = Math.abs(ballBottomY - yOnPermanentLine);

        if (distance < minDistance) {
            minDistance = distance;
            closestY = yOnPermanentLine;
            closestLine = { start: permanentStart, end: permanentEnd };
        }
    }

    // If a closest line segment was found, align the ball and adjust velocity
    if (closestY !== null && minDistance < ballRadius) {
        ballPos.y = closestY + ballRadius - 0.5; // Align the bottom of the ball

        if (closestLine) {
            const slope = (closestLine.end.y - closestLine.start.y) / (closestLine.end.x - closestLine.start.x);
            const slopeAngle = Math.atan(slope); // Slope angle in radians

            // Adjust horizontal velocity based on slope angle
            const slopeEffectStrength = 0.05; // Tune this value for responsiveness to the slope
            const acceleration = Math.sin(slopeAngle) * slopeEffectStrength;

            // Apply acceleration from the slope
            ballVelocity.x -= acceleration;

            // Apply deceleration when no longer accelerating (e.g., flat or opposite direction)
            const deceleration = 0.0001; // Tune this value for smooth deceleration
            if (Math.abs(acceleration) < deceleration || Math.sign(acceleration) !== Math.sign(ballVelocity.x)) {
                // Gradually reduce velocity if not accelerating
                if (Math.abs(ballVelocity.x) > deceleration) {
                    ballVelocity.x -= Math.sign(ballVelocity.x) * deceleration;
                } else {
                    ballVelocity.x = 0; // Stop completely if velocity is very low
                }
            }
        }

        ballVelocity.y = 0; // Stop vertical movement
        return true;
    }

    return false;
}


// Helper function to check if a line segment intersects a circle
function lineSegmentIntersectsCircle(start, end, circle, radius) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Project circle center onto the line segment
    const t = Math.max(0, Math.min(1, ((circle.x - start.x) * dx + (circle.y - start.y) * dy) / (length * length)));
    const closestPoint = { x: start.x + t * dx, y: start.y + t * dy };

    // Check if the distance to the closest point is less than the radius
    const distX = circle.x - closestPoint.x;
    const distY = circle.y - closestPoint.y;
    return (distX * distX + distY * distY) <= radius * radius;
}

// Update the ball position with collision detection
// Define the initial respawn position
const initialBallPosition = { x: -45, y: 2.6 - ballRadius }; // Customize starting position as needed

function updateBall() {
    const substeps = 5; // Number of substeps
    const deltaTime = 1 / substeps;

    for (let i = 0; i < substeps; i++) {
        // Apply gravity
        ballVelocity.y -= gravity * deltaTime;

        // Horizontal movement
        if (isMovingLeft) {
            ballVelocity.x = Math.max(ballVelocity.x - acceleration * deltaTime, -maxVelocity);
        } else if (isMovingRight) {
            ballVelocity.x = Math.min(ballVelocity.x + acceleration * deltaTime, maxVelocity);
        } else {
            // Decelerate if no keys are pressed
            if (ballVelocity.x > 0) {
                ballVelocity.x = Math.max(0, ballVelocity.x - deceleration * deltaTime);
            } else if (ballVelocity.x < 0) {
                ballVelocity.x = Math.min(0, ballVelocity.x + deceleration * deltaTime);
            }
        }

        // Predict new position
        const newPosition = {
            x: ballPosition.x + ballVelocity.x * deltaTime,
            y: ballPosition.y + ballVelocity.y * deltaTime,
        };

        // Check for collision
        if (checkLineCollision(newPosition)) {
            ballVelocity.y = 0; // Stop downward movement
            newPosition.y += gravity * deltaTime; // Adjust position above the line
        }

        // Wrap around the horizontal edges if above the bottom
        if (newPosition.y + ballRadius > -25) { // Assuming -25 is the bottom boundary in custom coords
            if (newPosition.x > 50) { // Right boundary in custom coords
                newPosition.x = -50; // Wrap to the left
            } else if (newPosition.x < -50) { // Left boundary in custom coords
                newPosition.x = 50; // Wrap to the right
            }
        }
        

        // Update the ball's position
        ballPosition = newPosition;
    }

    // Check if the ball hits the bottom of the canvas
    const ballCanvasPos = toCanvasCoords(ballPosition.x, ballPosition.y + ballRadius);
    if (ballCanvasPos.y >= height) {
        // Respawn the ball at the initial position with zero velocity
        ballPosition = { ...initialBallPosition };
        ballVelocity = { x: 0, y: 0 };
    }

    // Redraw the canvas
    redrawCanvas();

    // Continue the game loop
    requestAnimationFrame(updateBall);
}

function stopBallAtIntersection(ballPos) {
    // Iterate over every pair of lines
    for (let i = 0; i < allLines.length; i++) {
        const line1 = allLines[i];
        for (let j = i + 1; j < allLines.length; j++) {
            const line2 = allLines[j];

            // Check each segment of line1 against each segment of line2
            for (let k = 1; k < line1.length; k++) {
                for (let l = 1; l < line2.length; l++) {
                    const intersection = getLineIntersection(
                        [line1[k - 1], line1[k]],
                        [line2[l - 1], line2[l]]
                    );

                    if (intersection) {
                        const dx = intersection.x - ballPos.x;
                        const dy = intersection.y - ballPos.y;
                        const distanceToIntersection = Math.sqrt(dx ** 2 + dy ** 2);

                        // Check if the ball is close enough to the intersection point
                        if (distanceToIntersection <= ballRadius) {
                            // Calculate the direction from the ball to the intersection
                            const directionX = dx / distanceToIntersection;
                            const directionY = dy / distanceToIntersection;

                            // Position the ball so its edge touches the intersection
                            ballPos.x = intersection.x - directionX * ballRadius;
                            ballPos.y = intersection.y - directionY * ballRadius;

                            // Reduce velocity to simulate stopping, but allow a slight motion
                            ballVelocity.x *= 0; // Dampen horizontal velocity
                            ballVelocity.y *= 0; // Dampen vertical velocity

                            console.log(
                                `Ball stopped near intersection (${intersection.x.toFixed(2)}, ${intersection.y.toFixed(2)})`
                            );
                            return true; // Exit early after adjusting the ball
                        }
                    }
                }
            }
        }
    }
    return false; // No intersection detected
}


function updateIntersectionLogs() {
    console.clear();
    const newLogs = [];
    intersectionPoints = []; // Clear previous intersection points

    // Iterate over every pair of lines
    for (let i = 0; i < allLines.length; i++) {
        const line1 = allLines[i];
        for (let j = i + 1; j < allLines.length; j++) {
            const line2 = allLines[j];

            // Check each segment of line1 against each segment of line2
            for (let k = 1; k < line1.length; k++) {
                for (let l = 1; l < line2.length; l++) {
                    const intersection = getLineIntersection(
                        [line1[k - 1], line1[k]],
                        [line2[l - 1], line2[l]]
                    );

                    if (intersection) {
                        const intersectionStr = `(${intersection.x.toFixed(2)}, ${intersection.y.toFixed(2)})`;
                        console.log(intersectionStr);
                        newLogs.push(intersectionStr);
                        intersectionPoints.push({
                            x: intersection.x,
                            y: intersection.y,
                            lines: [line1, line2], // Store intersecting lines
                        });
                    }
                }
            }
        }
    }

    // Save recalculated logs to localStorage
    localStorage.setItem('intersectionLogs', JSON.stringify(newLogs));
}


function restoreConsoleState() {
    const savedLogs = JSON.parse(localStorage.getItem('intersectionLogs')) || [];
    console.clear();
    savedLogs.forEach(log => console.log(log));
}

window.addEventListener('load', () => {
    restoreFromLocalStorage();
    restoreConsoleState(); // Restore console state
    drawPermanentLine();
    drawBall();
    requestAnimationFrame(updateBall); // Start the ball update loop
});

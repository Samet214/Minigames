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
const ballRadius = 4; // Ball radius in custom coordinates
let ballPosition = { x: -45, y: 2.6 - ballRadius }; // Starting on the left end of the permanent line
const gravity = 0.1; // Gravity strength (adjust for faster or slower fall)
const bounce = 0.2; // A small bounce effect (set to 0 for no bounce)
let ballVelocity = { x: 0, y: 0 }; // Velocity of the ball (initially at rest)
let isOnPlatform = false; // Flag to check if the ball is on the platform
const maxVelocity = 0.7;  // Max horizontal speed for the ball
const acceleration = 0.3;  // Acceleration when the arrow keys are pressed
const deceleration = 0.05;  // Deceleration when the keys are released
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = canvas.width;
offscreenCanvas.height = canvas.height;
const offscreenCtx = offscreenCanvas.getContext('2d');
const spatialGrid = new Map();
let isDrawing = false;


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

function switchToIntersectionPath(ballPos) {
    for (const intersection of intersectionPoints) {
        const dx = ballPos.x - intersection.x;
        const dy = ballPos.y - intersection.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);

        if (distance <= ballRadius) {
            // Found a close intersection
            const [line1, line2] = intersection.lines;

            // Determine the next line to follow (based on a rule, e.g., closest angle)
            const currentVelocityAngle = Math.atan2(ballVelocity.y, ballVelocity.x);
            let bestLine = line1; // Default to line1
            let smallestAngleDiff = Math.PI;

            for (const line of [line1, line2]) {
                const lineAngle = Math.atan2(
                    line[1].y - line[0].y,
                    line[1].x - line[0].x
                );
                const angleDiff = Math.abs(lineAngle - currentVelocityAngle);

                if (angleDiff < smallestAngleDiff) {
                    bestLine = line;
                    smallestAngleDiff = angleDiff;
                }
            }

            // Adjust the ball's velocity to follow the chosen line
            const newDirection = {
                x: bestLine[1].x - bestLine[0].x,
                y: bestLine[1].y - bestLine[0].y,
            };
            const magnitude = Math.sqrt(newDirection.x ** 2 + newDirection.y ** 2);

            ballVelocity.x = (newDirection.x / magnitude) * maxVelocity;
            ballVelocity.y = (newDirection.y / magnitude) * maxVelocity;

            // Reposition ball on the intersection
            ballPos.x = intersection.x;
            ballPos.y = intersection.y;

            console.log(
                `Ball switched to new path at intersection (${intersection.x.toFixed(2)}, ${intersection.y.toFixed(2)})`
            );
            return true; // Stop further processing
        }
    }
    return false;
}


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
    return { x: x * scaleX + width / 2, y: height / 2 - y * scaleY };
}

function toScreenCoords(x, y) {
    return { x: (x - width / 2) / scaleX, y: (height / 2 - y) / scaleY };
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
function saveState(newLine) {
    undoStack.push(newLine); // Add the new line to the undo stack
    redoStack.length = 0;    // Clear redoStack whenever a new action occurs
    saveStacksToLocalStorage();
}

// Function to save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('allLines', JSON.stringify(allLines));
    localStorage.setItem('undoStack', JSON.stringify(undoStack));
    localStorage.setItem('redoStack', JSON.stringify(redoStack));
    localStorage.setItem('intersectionLogs', JSON.stringify(intersectionPoints.map(point => ({
        x: point.x,
        y: point.y
    }))));
    refreshConsole();
}

// Undo function
function undo() {
    if (undoStack.length > 0) {
        // Remove the last action from undoStack and add it to redoStack
        const lastLine = undoStack.pop();
        redoStack.push(lastLine);

        // Remove the last line from allLines
        allLines.pop();

        // Redraw the canvas
        redrawCanvas();
        findAndLogIntersections();

        // Save stacks and lines to localStorage
        saveStacksToLocalStorage();
    }
}



function redo() {
    if (redoStack.length > 0) {
        // Remove the last undone action from redoStack and add it back to undoStack
        const lastLine = redoStack.pop();
        undoStack.push(lastLine);

        // Add the line back to allLines
        allLines.push(lastLine);

        // Redraw the canvas
        redrawCanvas();
        findAndLogIntersections();

        // Save stacks and lines to localStorage
        saveStacksToLocalStorage();
    }
}


function clearSavedData() {
    localStorage.removeItem('intersectionLogs');
    console.log("Cleared intersection logs from localStorage.");
}

clearSavedData();

function saveStacksToLocalStorage() {
    localStorage.setItem('undoStack', JSON.stringify(undoStack));
    localStorage.setItem('redoStack', JSON.stringify(redoStack));
    localStorage.setItem('allLines', JSON.stringify(allLines));
}


// Reset function to clear everything
function resetCanvas() {
    allLines = [];
    undoStack = [];
    redoStack = [];
    ctx.clearRect(0, 0, width, height); // Clear the canvas

    // Save cleared state to localStorage
    saveStacksToLocalStorage();

    drawPermanentLine(); // Redraw the permanent line
    drawBall();          // Redraw the ball
}





function drawPermanentLine() {
    const yPosition = -9.3; // Set the y-coordinate slightly lower than the middle
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawLine();
    for (const line of allLines) {
        if (line.length > 1) {
            ctx.moveTo(...Object.values(toCanvasCoords(line[0].x, line[0].y)));
            for (let i = 1; i < line.length; i++) {
                const point = line[i];
                ctx.lineTo(...Object.values(toCanvasCoords(point.x, point.y)));
            }
        }
    }
    ctx.stroke();

    // Draw the current line being drawn
    if (currentLine.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'blue'; // Different color for the active line
        ctx.moveTo(...Object.values(toCanvasCoords(currentLine[0].x, currentLine[0].y)));
        for (let i = 1; i < currentLine.length; i++) {
            const point = currentLine[i];
            ctx.lineTo(...Object.values(toCanvasCoords(point.x, point.y)));
        }
        ctx.stroke();
    }
    drawBall();
    drawPermanentLine();
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
    allLines = JSON.parse(localStorage.getItem('allLines')) || [];
    undoStack = JSON.parse(localStorage.getItem('undoStack')) || [];
    redoStack = JSON.parse(localStorage.getItem('redoStack')) || [];

    // Redraw the canvas with restored data
    redrawCanvas();
    findAndLogIntersections();
}



canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const pos = toScreenCoords(e.offsetX, e.offsetY);
    currentLine = [{ x: pos.x, y: pos.y }];
});



let lastMouseMove = 0;
canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        const pos = toScreenCoords(e.offsetX, e.offsetY);
        currentLine.push({ x: pos.x, y: pos.y });
        redrawCanvas(); // Show the line dynamically
    }
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
    if (isDrawing) {
        isDrawing = false;
        if (currentLine.length > 1) {
            allLines.push(currentLine); // Save the current line to allLines
            saveState(currentLine);    // Save the state for undo functionality
        }
        currentLine = [];
        redrawCanvas(); // Redraw the canvas with the new line
        findAndLogIntersections(); // Detect and log intersections
    }
});


canvas.addEventListener('mouseleave', () => {
    if (isDrawing) {
        isDrawing = false;
        if (currentLine.length > 1) {
            allLines.push(currentLine); // Save the current line
        }
        currentLine = [];
        redrawCanvas();
    }
});

// Button event listeners
document.getElementById('undoButton').addEventListener('click', undo);
document.getElementById('redoButton').addEventListener('click', redo);
document.getElementById('resetButton').addEventListener('click', resetCanvas); // Reset button

// Restore canvas on page load
window.addEventListener('load', () => {
    restoreFromLocalStorage();
    restoreConsoleState(); // Restore console logs
    drawPermanentLine();
    drawBall();
    requestAnimationFrame(updateBall); // Start the ball update loop
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
    console.clear(); // Clear the console for fresh output
    const intersectionPoints = []; // Clear previous intersection pointsintersectionPoints = []; // Clear previous intersection points

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
                         // Log intersection point without altering the lines
                         intersectionPoints.push({
                            x: intersection.x,
                            y: intersection.y,
                            lines: [[line1[k - 1], line1[k]], [line2[l - 1], line2[l]]],
                        });
                        console.log(`Intersection at (${intersection.x.toFixed(2)}, ${intersection.y.toFixed(2)})`);
                    }
                }
            }
        }
    }
}

function handleIntersection(ballPos) {
    for (const intersection of intersectionPoints) {
        const dx = ballPos.x - intersection.x;
        const dy = ballPos.y - intersection.y;
        if (Math.sqrt(dx ** 2 + dy ** 2) <= ballRadius) {
            const [line1, line2] = intersection.lines;
            const bestLine = selectNextLine(ballVelocity, line1, line2); // Define a selection rule
            alignBallWithLine(ballPos, bestLine);
            return true;
        }
    }
    return false;
}

// Function to check if the ball collides with a line segment and adjust velocity
function checkLineCollision(ballPos) {
    const ballBottomY = ballPos.y - ballRadius; // Bottom of the ball
    let isCollisionDetected = false; // Flag for any collision
    let isOnLine = false; // Flag to track if the ball is on a line
    let correctionVector = { x: 0, y: 0 }; // To resolve overlapping collisions

    // Gravity settings
    const gravity = -0.05; // Strength of gravity
    const slopeEffectStrength = 0.03; // Strength of slope effect
    const deceleration = 0.0001; // Slow down on slopes

    // Iterate through all lines to detect collisions
    for (let line of allLines) {
        for (let i = 1; i < line.length; i++) {
            const start = line[i - 1];
            const end = line[i];

            // Handle vertical line segments
            // Handle vertical line segments
            if (start.x === end.x && start.y !== end.y) {
                const verticalX = start.x;
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);

                // Check if ball is near enough horizontally
                if (Math.abs(ballPos.x - verticalX) <= ballRadius) {
                    const ballCenterY = ballPos.y; // Center Y of the ball

                    if (ballCenterY < maxY) {
                        // Ball hits the vertical wall, no bounce
                        const overlapX = ballPos.x < verticalX
                            ? verticalX - ballPos.x - ballRadius
                            : verticalX - ballPos.x + ballRadius;
                        correctionVector.x += overlapX;

                        ballVelocity.x = 0; // Stop horizontal movement
                        isCollisionDetected = true;
                    } else {
                        // Ball "hops over" the vertical line
                        ballPos.y = maxY + ballRadius; // Place ball on top of the vertical line
                    }
                }
            }


            // Handle non-vertical line segments
            if (ballPos.x >= Math.min(start.x, end.x) &&
                ballPos.x <= Math.max(start.x, end.x)) {
                const t = (ballPos.x - start.x) / (end.x - start.x);
                const yOnLine = start.y + t * (end.y - start.y);
                const distance = Math.abs(ballBottomY - yOnLine);

                if (distance < ballRadius) {
                    // Collision detected with sloped or horizontal line
                    const overlapY = ballBottomY < yOnLine 
                        ? yOnLine - ballBottomY 
                        : yOnLine - ballBottomY;
                    correctionVector.y += overlapY;


                    isCollisionDetected = true;
                    isOnLine = true; // Ball is on the line

                    // Handle slope effects
                    const slope = (end.y - start.y) / (end.x - start.x);
                    const slopeAngle = Math.atan(slope);

                    // Adjust ball's horizontal velocity based on the slope
                    const slopeForce = Math.sin(slopeAngle) * slopeEffectStrength;

                    // Always move the ball downwards along the slope
                    ballVelocity.x -= slopeForce;

                    // Apply deceleration to simulate friction
                    if (Math.abs(slopeForce) < deceleration || Math.sign(slopeForce) !== Math.sign(ballVelocity.x)) {
                        if (Math.abs(ballVelocity.x) > deceleration) {
                            ballVelocity.x -= Math.sign(ballVelocity.x) * deceleration;
                        } else {
                            ballVelocity.x = 0; // Stop completely if velocity is very low
                        }
                    }

                    ballVelocity.y *= -0.5; // Simulate a bounce or reduce velocity
                }
            }
        }
    }

    // Handle collisions with the permanent line
    const permanentStart = { x: -50, y: -10 };
    const permanentEnd = { x: -40, y: -10 };
    if (ballPos.x >= permanentStart.x && ballPos.x <= permanentEnd.x) {
        const t = (ballPos.x - permanentStart.x) / (permanentEnd.x - permanentStart.x);
        const yOnPermanentLine = permanentStart.y + t * (permanentEnd.y - permanentStart.y);
        const distance = Math.abs(ballBottomY - yOnPermanentLine);

        if (distance < ballRadius) {
            const overlapY = ballBottomY < yOnPermanentLine
                ? yOnPermanentLine - ballBottomY
                : yOnPermanentLine - ballBottomY;
            correctionVector.y += overlapY;


            isCollisionDetected = true;
            isOnLine = true; // Ball is on the permanent line

            // Maintain hovering state
            ballVelocity.y *= -0.5;

          

            // Optionally adjust horizontal velocity (if permanent line is sloped)
            const slope = (permanentEnd.y - permanentStart.y) / (permanentEnd.x - permanentStart.x);
            const slopeAngle = Math.atan(slope);
            const slopeForce = Math.sin(slopeAngle) * slopeEffectStrength;

            ballVelocity.x -= slopeForce;

            // Apply deceleration to simulate friction
            if (Math.abs(slopeForce) < deceleration || Math.sign(slopeForce) !== Math.sign(ballVelocity.x)) {
                if (Math.abs(ballVelocity.x) > deceleration) {
                    ballVelocity.x -= Math.sign(ballVelocity.x) * deceleration;
                } else {
                    ballVelocity.x = 0;
                }
            }
        }
    }

    // Resolve collisions by applying the correction vector
    if (isOnLine) {
        ballPos.x += correctionVector.x;
        ballPos.y += correctionVector.y;
    }

    // Apply gravity or maintain hovering state
    ballVelocity.y += gravity; // Apply gravity when not on any line

    return isCollisionDetected; // Return whether any collision occurred
}


const initialBallPosition = { x: -45, y: 2.6 - ballRadius }; // Customize starting position as needed

function updateBall() {
    const substeps = 10; // Increase substeps for finer collision detection
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

        // Check for collisions along the path
        const collisionResolved = checkLineCollision(newPosition);

        // Prevent tunneling by resolving any predicted collisions
        if (!collisionResolved) {
            // Check if the ball tunnels through a line segment
            for (const line of allLines) {
                for (let j = 1; j < line.length; j++) {
                    const segmentStart = line[j - 1];
                    const segmentEnd = line[j];

                    if (sweptCircleLineCollision(ballPosition, newPosition, ballRadius, segmentStart, segmentEnd)) {
                        // Resolve tunneling
                        alignBallWithLine(newPosition, { start: segmentStart, end: segmentEnd });
                        break;
                    }
                }
            }
        }

        // Update the ball's position
        ballPosition = newPosition;

        // Check if the ball falls off the canvas
        if (ballPosition.y + ballRadius < -25) { // Assuming -25 is the bottom boundary in custom coords
            resetBallToInitialPosition();
            break; // No need to process further substeps
        }
    }

    // Redraw the canvas
    redrawCanvas();

    // Continue the game loop
    requestAnimationFrame(updateBall);
}

// Function to reset the ball to its initial position
function resetBallToInitialPosition() {
    ballPosition = { x: -45, y: 2.6 - ballRadius }; // Replace with your initial position
    ballVelocity = { x: 0, y: 0 }; // Reset velocity
    console.log("Ball reset to starting position.");
}


function alignBallWithLine(ballPos, line) {
    const { start, end } = line;

    // Calculate the direction of the line
    const lineVector = { x: end.x - start.x, y: end.y - start.y };
    const magnitude = Math.sqrt(lineVector.x ** 2 + lineVector.y ** 2);

    // Normalize line direction
    const normalizedLine = { x: lineVector.x / magnitude, y: lineVector.y / magnitude };

    // Project the ball's velocity onto the line
    const dotProduct = ballVelocity.x * normalizedLine.x + ballVelocity.y * normalizedLine.y;
    ballVelocity.x = normalizedLine.x * dotProduct;
    ballVelocity.y = normalizedLine.y * dotProduct;

    // Adjust the ball's position to lie directly on the line
    ballPos.x = Math.max(Math.min(ballPos.x, Math.max(start.x, end.x)), Math.min(start.x, end.x));
    ballPos.y = start.y + ((ballPos.x - start.x) / (end.x - start.x)) * (end.y - start.y) + 3;
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

    console.clear(); // Clear the console first
    savedLogs.forEach(log => {
        if (log && typeof log.x === 'number' && typeof log.y === 'number') {
            console.log(`(${log.x.toFixed(2)}, ${log.y.toFixed(2)})`);
        } else {
            console.log(log); // Warn if a log entry is malformed
        }
    });
}

redrawCanvas();

window.addEventListener('load', () => {
    restoreFromLocalStorage();
    restoreConsoleState(); // Restore console state
    drawPermanentLine();
    drawBall();
    requestAnimationFrame(updateBall); // Start the ball update loop
});

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
const gravity = 0.1; // Gravity strength (adjust for faster or slower fall)
const bounce = 0.2; // A small bounce effect (set to 0 for no bounce)
let ballVelocity = { x: 0, y: 0 }; // Velocity of the ball (initially at rest)
let isOnPlatform = false; // Flag to check if the ball is on the platform
const maxVelocity = 1.2;  // Max horizontal speed for the ball
const acceleration = 0.3;  // Acceleration when the arrow keys are pressed
const deceleration = 0.05;  // Deceleration when the keys are released

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


// History stacks
let undoStack = [];
let redoStack = [];
let allLines = []; // Stores all drawn lines

// Helper to snap to nearest 0.5
function snapToHalf(value) {
    return Math.round(value * 2) / 2;
}

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
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Function to add and draw individual points along a line
function addLinePoint(x1, y1, x2, y2) {
    const start = toCustomCoords(x1, y1);
    const end = toCustomCoords(x2, y2);

    // Add points to the current line and update in allLines to be drawn immediately
    currentLine.push(start, end);
    allLines.push(currentLine);

    // Draw on canvas
    const canvasStart = toCanvasCoords(start.x, start.y);
    const canvasEnd = toCanvasCoords(end.x, end.y);
    drawLine(canvasStart.x, canvasStart.y, canvasEnd.x, canvasEnd.y);

    // Trigger canvas redraw to display the new line segment immediately
    redrawCanvas();
}

// Function to detect and adjust vertical lines
function adjustVerticalLines() {
    allLines.forEach((line, index) => {
        let lastX = null;
        let inVerticalSegment = false;

        line.forEach((point, pointIndex) => {
            if (point.x === lastX) {
                if (!inVerticalSegment) {
                    // Start of a new vertical segment
                    inVerticalSegment = true;
                }
            } else {
                // End of a vertical segment
                inVerticalSegment = false;
            }
            lastX = point.x;
        });
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
        redoStack.push(JSON.parse(JSON.stringify(allLines))); // deep copy
        allLines = undoStack.pop();
        redrawCanvas();
        saveToLocalStorage();
    }
}

// Redo function
function redo() {
    if (redoStack.length > 0) {
        undoStack.push(JSON.parse(JSON.stringify(allLines))); // deep copy
        allLines = redoStack.pop();
        redrawCanvas();
        saveToLocalStorage();
    }
}

// Reset function to clear everything
function resetCanvas() {
    allLines = []; // Clear all user-drawn lines
    undoStack = []; // Clear undo history
    redoStack = []; // Clear redo history
    drawnPoints.clear(); // Clear drawn points
    ctx.clearRect(0, 0, width, height); // Clear the entire canvas

    console.clear();
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
    ctx.lineWidth = 3; // Thickness of 3
    ctx.stroke();
}


// Function to redraw the entire canvas
function redrawCanvas() {
    ctx.clearRect(0, 0, width, height); // Clear the canvas
    drawPermanentLine(); // Draw the permanent line first
    allLines.forEach(line => {
        if (line.length > 1) {
            for (let i = 1; i < line.length; i++) {
                const start = toCanvasCoords(line[i - 1].x, line[i - 1].y);
                const end = toCanvasCoords(line[i].x, line[i].y);
                drawLine(start.x, start.y, end.x, end.y);
            }
        }
    });
    drawBall(); // Draw the ball
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

    // Redraw the canvas with smooth lines
    redrawCanvas();
    refreshConsole();
}

// Mouse event handlers
canvas.addEventListener('mousedown', (event) => {
    const { offsetX, offsetY } = event;
    lastPoint = { x: offsetX, y: offsetY };
    currentLine = [];
    drawing = true;
    saveState();
});

canvas.addEventListener('mousemove', (event) => {
    if (!drawing) return;

    const { offsetX, offsetY } = event;
    addLinePoint(lastPoint.x, lastPoint.y, offsetX, offsetY);
    lastPoint = { x: offsetX, y: offsetY };

    // Update the ball position to reflect changes
    redrawCanvas();
});

canvas.addEventListener('mouseup', () => {
    if (drawing) {
        allLines.push(currentLine);
        saveToLocalStorage();
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

// Function to check if the ball collides with a line segment
function checkLineCollision(ballPos) {
    const ballBottomY = ballPos.y - ballRadius; // Use the bottom of the ball for collision detection
    let closestY = null;
    let minDistance = Infinity;

    // Iterate through all lines to find the closest line segment to the bottom of the ball
    for (let line of allLines) {
        for (let i = 1; i < line.length; i++) {
            const start = line[i - 1];
            const end = line[i];

            // Check if the ball's x-position is within the line segment's x-range
            if ((ballPos.x >= Math.min(start.x, end.x)) && (ballPos.x <= Math.max(start.x, end.x))) {
                // Calculate the y-value on the line segment for the ball's x-position using linear interpolation
                const t = (ballPos.x - start.x) / (end.x - start.x);
                const yOnLine = start.y + t * (end.y - start.y);

                // Calculate the distance between the bottom of the ball and the y-value on the line
                const distance = Math.abs(ballBottomY - yOnLine);

                // If this is the closest line segment, update closestY
                if (distance < minDistance) {
                    minDistance = distance;
                    closestY = yOnLine;
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
        }
    }

    // If a closest line segment was found, align the bottom of the ball to the line segment
    if (closestY !== null && minDistance < ballRadius) {
        ballPos.y = closestY + ballRadius - 0.5; // Align the bottom of the ball to the line
        ballVelocity.y = 0; // Stop downward movement
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
    // Apply gravity (downwards)
    ballVelocity.y -= gravity;

    // Horizontal movement based on key presses
    if (isMovingLeft) {
        ballVelocity.x = Math.max(ballVelocity.x - acceleration, -maxVelocity);
    } else if (isMovingRight) {
        ballVelocity.x = Math.min(ballVelocity.x + acceleration, maxVelocity);
    } else {
        // Decelerate if no keys are pressed
        if (ballVelocity.x > 0) {
            ballVelocity.x = Math.max(0, ballVelocity.x - deceleration);
        } else if (ballVelocity.x < 0) {
            ballVelocity.x = Math.min(0, ballVelocity.x + deceleration);
        }
    }

    // Update the ball's position
    ballPosition.x += ballVelocity.x;
    ballPosition.y += ballVelocity.y;

    // Check for collision with lines
    if (checkLineCollision(ballPosition)) {
        ballVelocity.y = 0; // Stop downward movement
        ballPosition.y += gravity; // Adjust position above the line
    }

    // Wrap around the horizontal edges if above the bottom
    if (ballPosition.y + ballRadius > -25) { // Assuming -25 is the bottom boundary in custom coords
        if (ballPosition.x > 50) { // Right boundary in custom coords
            ballPosition.x = -50; // Wrap to the left
        } else if (ballPosition.x < -50) { // Left boundary in custom coords
            ballPosition.x = 50; // Wrap to the right
        }
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




// Start the game loop when the page loads
window.addEventListener('load', () => {
    restoreFromLocalStorage();
    drawPermanentLine();
    drawBall();
    requestAnimationFrame(updateBall); // Start the ball update loop
});


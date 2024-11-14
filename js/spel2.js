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

    currentLine.push(start, end);

    // Draw on canvas
    const canvasStart = toCanvasCoords(start.x, start.y);
    const canvasEnd = toCanvasCoords(end.x, end.y);
    drawLine(canvasStart.x, canvasStart.y, canvasEnd.x, canvasEnd.y);
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
                    console.log(`x = ${point.x} for line ${index + 1}`);
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
        console.log(`Line ${index + 1}: ${lineString}`);
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
    const ballCanvasPos = toCanvasCoords(ballPos.x, ballPos.y);

    for (let line of allLines) {
        for (let i = 1; i < line.length; i++) {
            const start = toCanvasCoords(line[i - 1].x, line[i - 1].y);
            const end = toCanvasCoords(line[i].x, line[i].y);

            // Check if the ball intersects with this line segment
            if (lineSegmentIntersectsCircle(start, end, ballCanvasPos, ballRadius * scaleX)) {
                return true;
            }
        }
    }

    // Also check the permanent line
    const startPermanent = toCanvasCoords(-50, -5);
    const endPermanent = toCanvasCoords(-40, -5);
    if (lineSegmentIntersectsCircle(startPermanent, endPermanent, ballCanvasPos, ballRadius * scaleX)) {
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
function updateBall() {
    // Apply gravity (downwards)
    ballVelocity.y -= gravity;

    // Update the ball's position
    ballPosition.x += ballVelocity.x;
    ballPosition.y += ballVelocity.y;

    // Check for collision with lines
    if (checkLineCollision(ballPosition)) {
        ballVelocity.y = 0; // Stop the downward movement
        // Adjust the position to ensure the ball stays above the line
        ballPosition.y += gravity;
    }

    // Check if the ball hits the bottom of the canvas
    const ballCanvasPos = toCanvasCoords(ballPosition.x, ballPosition.y + ballRadius);
    if (ballCanvasPos.y >= height) {
        ballPosition.y = toCustomCoords(ballCanvasPos.x, height).y - ballRadius;
        ballVelocity.y *= -bounce; // Apply bounce effect
        ballVelocity.x *= 0.9; // Reduce horizontal velocity for friction
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


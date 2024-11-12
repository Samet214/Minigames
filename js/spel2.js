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

// Function to add and draw individual points along a line
function addLinePoint(x1, y1, x2, y2) {
    const start = toCustomCoords(x1, y1);
    const end = toCustomCoords(x2, y2);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
    const stepX = dx / steps;
    const stepY = dy / steps;
    const linePoints = [];

    for (let i = 0; i <= steps; i++) {
        const x = snapToHalf(start.x + stepX * i);
        const y = snapToHalf(start.y + stepY * i);
        const pointKey = `${x},${y}`;

        if (!drawnPoints.has(pointKey)) {
            const canvasPos = toCanvasCoords(x, y);
            drawDot(canvasPos.x, canvasPos.y);
            linePoints.push({ x, y });
            drawnPoints.add(pointKey);
        }
    }

    return linePoints;
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
    allLines = [];
    undoStack = [];
    redoStack = [];
    drawnPoints.clear();
    ctx.clearRect(0, 0, width, height);
    console.clear();
    saveToLocalStorage();
}

// Function to redraw the entire canvas
function redrawCanvas() {
    ctx.clearRect(0, 0, width, height);
    drawnPoints.clear();
    allLines.forEach(line => {
        line.forEach(point => {
            const canvasPos = toCanvasCoords(point.x, point.y);
            drawDot(canvasPos.x, canvasPos.y);
            drawnPoints.add(`${point.x},${point.y}`);
        });
    });
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

    const lastCoords = toCustomCoords(lastPoint.x, lastPoint.y);
    const currentCoords = toCustomCoords(offsetX, offsetY);

    if (lastCoords.x !== currentCoords.x || lastCoords.y !== currentCoords.y) {
        const lineSegment = addLinePoint(lastPoint.x, lastPoint.y, offsetX, offsetY);
        currentLine.push(...lineSegment);
        lastPoint = { x: offsetX, y: offsetY };
    }
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
window.addEventListener('load', restoreFromLocalStorage);

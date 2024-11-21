const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Canvas and Engine Setup
const canvas = document.getElementById('drawingCanvas');
const width = canvas.width;
const height = canvas.height;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 2; // Adjust gravity strength

let allLines = [];
let undoneLines = [];

const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: 'white',
    },
});
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Create Ball
const ballRadius = 50;
const ball = Bodies.circle(100, 100, ballRadius, {
    restitution: 0.8,
    friction: 0.01,
    render: {
        fillStyle: 'red',
    },
});
World.add(world, ball);

// Create Static Ground
const ground = Bodies.rectangle(width / 2, height - 10, width, 20, {
    isStatic: true,
    render: {
        fillStyle: 'black',
    },
});
World.add(world, ground);

// User-Drawn Lines
let lines = [];
let isDrawing = false;
let points = [];

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    points = [{ x: e.offsetX, y: e.offsetY }];
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        points.push({ x: e.offsetX, y: e.offsetY });

        // Optionally draw a visual preview of the curve
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDrawing) {
        isDrawing = false;

        const lineSegments = [];
        for (let i = 0; i < points.length - 1; i++) {
            const startPoint = points[i];
            const endPoint = points[i + 1];
            const length = Math.sqrt((endPoint.x - startPoint.x) ** 2 + (endPoint.y - startPoint.y) ** 2);
            const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

            const segment = Bodies.rectangle(
                (startPoint.x + endPoint.x) / 2,
                (startPoint.y + endPoint.y) / 2,
                length,
                5, // Thickness
                {
                    isStatic: true,
                    angle: angle,
                    render: {
                        fillStyle: 'black',
                    },
                }
            );
            World.add(world, segment);
            lineSegments.push(segment);
        }

        // Store the full line (group of segments)
        if (lineSegments.length > 0) {
            allLines.push(lineSegments);
            lines.push(...lineSegments); // Maintain compatibility with the existing logic
        }
        points = [];
        undoneLines = []; // Clear redo stack
    }
});

// Undo, Redo, Reset
document.getElementById('resetButton').addEventListener('click', () => {
    World.clear(world);
    World.add(world, [ball, ground]); // Reset to initial objects
    lines = [];
    allLines = [];
    undoneLines = [];
});

// Undo Button
document.getElementById('undoButton').addEventListener('click', () => {
    if (allLines.length > 0) {
        const lastLine = allLines.pop();
        undoneLines.push(lastLine); // Save for redo
        lastLine.forEach((segment) => World.remove(world, segment)); // Remove all segments in the group
        lines = lines.filter((line) => !lastLine.includes(line)); // Update single-segment list
    }
});

document.getElementById('redoButton').addEventListener('click', () => {
    if (undoneLines.length > 0) {
        const restoredLine = undoneLines.pop();
        allLines.push(restoredLine);
        restoredLine.forEach((segment) => World.add(world, segment)); // Add all segments back
        lines.push(...restoredLine); // Update single-segment list
    }
});

// Ball Movement
let isMovingLeft = false;
let isMovingRight = false;

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') isMovingLeft = true;
    if (e.key === 'ArrowRight') isMovingRight = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') isMovingLeft = false;
    if (e.key === 'ArrowRight') isMovingRight = false;
});

Events.on(engine, 'beforeUpdate', () => {
    const force = 0.05;
    if (isMovingLeft) Body.applyForce(ball, ball.position, { x: -force, y: 0 });
    if (isMovingRight) Body.applyForce(ball, ball.position, { x: force, y: 0 });
});

// Keep Ball in Bounds
Events.on(engine, 'afterUpdate', () => {
    if (ball.position.y > height + 100) {
        Body.setPosition(ball, { x: 100, y: 100 });
        Body.setVelocity(ball, { x: 0, y: 0 });
    }
});

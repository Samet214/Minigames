const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Canvas and Engine Setup
const canvas = document.getElementById('drawingCanvas');
const width = canvas.width;
const height = canvas.height;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 4; // Adjust gravity strength

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

        if (lineSegments.length > 0) {
            allLines.push(lineSegments);
            lines.push(...lineSegments);
            saveLines(); // Save after adding new lines
        }
        points = [];
        undoneLines = [];
    }
});

// Undo, Redo, Reset
document.getElementById('resetButton').addEventListener('click', () => {
    World.clear(world);
    World.add(world, [ball, ground]); // Reset to initial objects
    lines = [];
    allLines = [];
    undoneLines = [];
    localStorage.removeItem('savedLines'); // Clear saved lines
});

// Undo Button
document.getElementById('undoButton').addEventListener('click', () => {
    if (allLines.length > 0) {
        const lastLine = allLines.pop();
        undoneLines.push(lastLine); // Save for redo
        lastLine.forEach(segment => World.remove(world, segment));
        lines = lines.filter(line => !lastLine.includes(line));
        saveLines(); // Save after undo
    }
});

document.getElementById('redoButton').addEventListener('click', () => {
    if (undoneLines.length > 0) {
        const restoredLine = undoneLines.pop();
        allLines.push(restoredLine);
        restoredLine.forEach(segment => World.add(world, segment));
        lines.push(...restoredLine);
        saveLines(); // Save after redo
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
    let jumppower = 35   ;
    jumppower *= -1
    if (e.key === ' ' && isOnSurface) {
        // Apply upward velocity to create a bounce effect
        Body.setVelocity(ball, { x: ball.velocity.x, y: jumppower });
    }
});

Events.on(engine, 'beforeUpdate', () => {
    const force = 0.03;
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

function saveLines() {
    const savedLines = allLines.map(lineGroup =>
        lineGroup.map(line => ({
            start: { x: line.vertices[0].x, y: line.vertices[0].y },
            end: { x: line.vertices[1].x, y: line.vertices[1].y },
        }))
    );
    localStorage.setItem('savedLines', JSON.stringify(savedLines));
}

window.addEventListener('load', () => {
    const savedLines = JSON.parse(localStorage.getItem('savedLines') || '[]');
    savedLines.forEach(lineGroup => {
        const restoredLineGroup = lineGroup.map(lineData => {
            const start = lineData.start;
            const end = lineData.end;
            const length = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
            const angle = Math.atan2(end.y - start.y, end.x - start.x);

            const segment = Bodies.rectangle(
                (start.x + end.x) / 2,
                (start.y + end.y) / 2,
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
            return segment;
        });
        allLines.push(restoredLineGroup);
        lines.push(...restoredLineGroup); // Update single-segment list
    });
});

let isOnSurface = false; // Tracks if the ball is on a surface

// Detect collisions to check if the ball is on a surface
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        if (pair.bodyA === ball || pair.bodyB === ball) {
            isOnSurface = true;
        }
    });
});

Events.on(engine, 'collisionEnd', (event) => {
    event.pairs.forEach((pair) => {
        if (pair.bodyA === ball || pair.bodyB === ball) {
            isOnSurface = false;
        }
    });
});
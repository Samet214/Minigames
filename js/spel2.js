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
let isOnSurface = false; // Tracks if the ball is on a surface
let jumpAllowed = true; // Allows jump only if the ball is on a surface
const initialJumpHeight = -5; // Initial jump height
let currentJumpHeight = initialJumpHeight;
let jumpHoldTime = 0; // How long the spacebar has been held down

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

// Create Static Boundaries
const ceiling = Bodies.rectangle(width / 2, 10, width, 20, { isStatic: true, render: { fillStyle: 'black' } });
const leftWall = Bodies.rectangle(10, height / 2, 20, height, { isStatic: true, render: { fillStyle: 'black' } });
const rightWall = Bodies.rectangle(width - 10, height / 2, 20, height, { isStatic: true, render: { fillStyle: 'black' } });
World.add(world, [ceiling, leftWall, rightWall]);

// User-Drawn Lines
let lines = [];
let isDrawing = false;
let points = [];
let inactivityTimeout; // Timeout to monitor inactivity
const inactivityDuration = 100; // Duration to detect inactivity

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    points = [{ x: e.offsetX, y: e.offsetY }];
    clearTimeout(inactivityTimeout); // Clear inactivity timeout when drawing starts
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        clearTimeout(inactivityTimeout); // Reset inactivity timeout on movement

        const lastPoint = points[points.length - 1];
        const currentPoint = { x: e.offsetX, y: e.offsetY };

        const dx = currentPoint.x - lastPoint.x;
        const dy = currentPoint.y - lastPoint.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);

        if (distance > 10) {
            const angle = Math.atan2(dy, dx);
            const segment = Bodies.rectangle(
                (lastPoint.x + currentPoint.x) / 2,
                (lastPoint.y + currentPoint.y) / 2,
                distance,
                5,
                {
                    isStatic: true,
                    angle: angle,
                    render: {
                        fillStyle: 'rgba(0, 0, 255, 0.5)', // Blue with opacity
                    },
                }
            );

            // Highlight and reset the last two segments
            const highlightDuration = 100; // Highlight duration
            if (lines.length > 0) {
                const recentSegments = lines.slice(-2);
                recentSegments.forEach(segment => {
                    segment.render.fillStyle = 'rgba(0, 0, 255, 0.5)';
                    setTimeout(() => {
                        segment.render.fillStyle = 'black'; // Reset to black
                    }, highlightDuration);
                });
            }

            // Reset all other segments to black immediately
            lines.forEach(segment => {
                if (!lines.slice(-2).includes(segment)) {
                    segment.render.fillStyle = 'black';
                }
            });

            World.add(world, segment);
            lines.push(segment);
            points.push(currentPoint);
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Restart inactivity detection timeout
        inactivityTimeout = setTimeout(() => {
            lines.forEach(segment => {
                segment.render.fillStyle = 'black'; // Reset all segments to black
            });
        }, inactivityDuration);
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDrawing) {
        isDrawing = false;

        if (points.length > 1) {
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
                    5,
                    {
                        isStatic: true,
                        angle: angle,
                        render: { fillStyle: 'black' },
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
        }

        points = [];
        undoneLines = [];
        saveLines(); // Save the completed drawing
        clearTimeout(inactivityTimeout); // Clear inactivity timeout on mouse release
    }
});

// Save/Undo/Redo/Reset Functions
document.getElementById('undoButton').addEventListener('click', () => {
    if (allLines.length > 0) {
        const lastLine = allLines.pop();
        undoneLines.push(lastLine);
        lastLine.forEach(segment => World.remove(world, segment));
        lines = lines.filter(line => !lastLine.includes(line));
        saveLines();
    }
});

document.getElementById('redoButton').addEventListener('click', () => {
    if (undoneLines.length > 0) {
        const restoredLine = undoneLines.pop();
        allLines.push(restoredLine);
        restoredLine.forEach(segment => World.add(world, segment));
        lines.push(...restoredLine);
        saveLines();
    }
});

document.getElementById('resetButton').addEventListener('click', () => {
    World.clear(world);
    World.add(world, [ball, ground, ceiling, leftWall, rightWall]);
    lines = [];
    allLines = [];
    undoneLines = [];
    localStorage.removeItem('savedLines');
});


// Ball Movement
let isMovingLeft = false;
let isMovingRight = false;

let spacebarHoldInterval;

const maxJumpHeight = -40;  // Maximum jump height
const minJumpHeight = -5;   // Minimum jump height

const accelerationFactor = 1.2;  // Controls how quickly the jump accelerates (higher is faster acceleration)
const maxHoldTime = 2;  // Maximum time (in seconds) for the jump hold

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') isMovingLeft = true;
    if (e.key === 'ArrowRight') isMovingRight = true;

    if (e.key === ' ' && jumpAllowed && isOnSurface) {
        if (!spacebarHoldInterval) {
            // Start counting hold time when spacebar is first pressed
            spacebarHoldInterval = setInterval(() => {
                if (jumpHoldTime < maxHoldTime) { // Transition over 2 seconds
                    jumpHoldTime += 0.1; // Increment time by 100ms
                    // Apply an exponential growth (acceleration) to the jump height
                    // The formula (jumpHoldTime ** accelerationFactor) accelerates the height change
                    currentJumpHeight = minJumpHeight + (jumpHoldTime ** accelerationFactor) * (maxJumpHeight - minJumpHeight);
                }
            }, 100); // Update every 100ms
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') isMovingLeft = false;
    if (e.key === 'ArrowRight') isMovingRight = false;

    if (e.key === ' ') {
        // Apply jump force with current jump height when spacebar is released
        if (jumpAllowed && isOnSurface) {
            Body.setVelocity(ball, { x: ball.velocity.x, y: currentJumpHeight });
            jumpAllowed = false; // Disable jump until ball hits a surface again
        }
        
        // Reset jump variables
        clearInterval(spacebarHoldInterval);
        spacebarHoldInterval = null;
        jumpHoldTime = 0;
        currentJumpHeight = minJumpHeight; // Reset to initial height
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

// Detect collisions to check if the ball is on a surface
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        if (bodyA === ball || bodyB === ball) {
            const otherBody = bodyA === ball ? bodyB : bodyA;
            
            // Check if colliding with ground or a line (allow jump)
            if (otherBody === ground || allLines.some(lineGroup => lineGroup.includes(otherBody))) {
                isOnSurface = true;
                jumpAllowed = true;
                currentJumpHeight = initialJumpHeight; // Reset to initial height on landing
            }
            
            // Check if colliding with ceiling or walls (disable jump)
            if (otherBody === ceiling || otherBody === leftWall || otherBody === rightWall) {
                jumpAllowed = false; // Disable jump if touching ceiling or walls
            }
        }
    });
});

Events.on(engine, 'collisionEnd', (event) => {
    event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        if (bodyA === ball || bodyB === ball) {
            const otherBody = bodyA === ball ? bodyB : bodyA;

            // Only reset surface state when leaving the ground or lines
            if (otherBody === ground || allLines.some(lineGroup => lineGroup.includes(otherBody))) {
                isOnSurface = false;
            }
        }
    });
});

window.addEventListener('keyup', (e) => {
    if (e.key === ' ' && jumpAllowed && isOnSurface) {
        Body.setVelocity(ball, { x: ball.velocity.x, y: maxJumpHeight });
        jumpAllowed = false; // Disable jump until ball hits a surface again
    }
});
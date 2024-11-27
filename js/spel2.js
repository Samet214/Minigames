const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Canvas and Engine Setup
const canvas = document.getElementById('drawingCanvas');
const width = innerWidth;
const height = innerHeight;

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
const hamburger = document.getElementById('hamburger');
const buttonContainer = document.getElementById('buttonContainer');

// By default, the button container is hidden
buttonContainer.style.display = 'none';

// Toggle visibility when the hamburger button is clicked
hamburger.addEventListener('click', () => {
    if (buttonContainer.style.display === 'none') {
        buttonContainer.style.display = 'flex'; // Show the container
    } else {
        buttonContainer.style.display = 'none'; // Hide the container
    }
});

document.getElementById('menuButton').addEventListener('click', () => {
    // Switch to Starting Page
    document.getElementById('gameCanvasContainer').style.display = 'none';
    document.getElementById('startingScreen').style.display = 'flex';

    // Reset canvas and other game state if needed
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    saveCurrentMode('startingPage');
});

document.getElementById('storyModeButton').addEventListener('click', () => {
    // Reset game screen layout
    document.getElementById('startingScreen').style.display = 'none';
    document.getElementById('gameCanvasContainer').style.display = 'block';

    // Ensure canvas is updated for the current mode
    updateCanvasSize();
    localStorage.setItem('currentMode', 'storyMode');
});

// Prevent the spacebar from toggling the button
hamburger.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault(); // Stop the default space key action
    }
});


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
const ball = Bodies.circle(800, 200, ballRadius, {
    restitution: 0.3, // No bounce
    frictionAir: 0, // No air resistance
    render: {
        fillStyle: 'red',
    },
});
World.add(world, ball);

// Create Static Ground
// Ground
const ground = Bodies.rectangle(width / 2, height + 10, width, 20, { // Position shifted outside
    isStatic: true,
    restitution: 0.3, // No bounce
    render: {
        fillStyle: 'black',
    },
});
World.add(world, ground);

// Create Static Boundaries
const ceiling = Bodies.rectangle(width / 2, -10, width, 20, { // Position shifted outside
    isStatic: true,
    render: { fillStyle: 'black' },
});
const leftWall = Bodies.rectangle(-10, height / 2, 20, height, { // Position shifted outside
    isStatic: true,
    render: { fillStyle: 'black' },
});
const rightWall = Bodies.rectangle(width + 10, height / 2, 20, height, { // Position shifted outside
    isStatic: true,
    render: { fillStyle: 'black' },
});
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

            // Clear the Matter.js world and re-add all remaining elements
            World.clear(world);
            World.add(world, [ball, ground, ceiling, leftWall, rightWall]);
            allLines.forEach((lineGroup) => {
                lineGroup.forEach((segment) => {
                    World.add(world, segment);
                });
            });

            saveLines(); // Save updated state
        }
});





document.getElementById('redoButton').addEventListener('click', () => {
    if (undoneLines.length > 0) {
        // Retrieve the last undone line group
        const restoredLine = undoneLines.pop();
        allLines.push(restoredLine);

        // Add each segment back to the world
        restoredLine.forEach((segment) => World.add(world, segment));

        // Update the lines array
        lines.push(...restoredLine);

        // Clear and redraw the canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);

        // Force a full redraw of the Matter.js world
        Render.world(render);

        saveLines(); // Save the updated state
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

let spacebarPressTime = null; // Store the time when spacebar is pressed
const maxHoldTime = 0.3;  // Maximum time (in seconds) for jump hold
const minJumpHeight = -10;  // Minimum jump height
const maxJumpHeight = -35; // Maximum jump height
let auraStrength = 0; // Aura intensity

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') isMovingLeft = true;
    if (e.key === 'ArrowRight') isMovingRight = true;

    if (e.key === ' ' && jumpAllowed && isOnSurface) {
        if (!spacebarPressTime) {
            spacebarPressTime = Date.now(); // Record when the spacebar was pressed
        }
    }
    
    if (e.ctrlKey && e.key === 'x') {
        // Ctrl + X to clear the canvas
        e.preventDefault(); // Prevent default browser behavior
        World.clear(world);
        World.add(world, [ball, ground, ceiling, leftWall, rightWall]);
        lines = [];
        allLines = [];
        undoneLines = [];
        localStorage.removeItem('savedLines');
    } else if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        // Ctrl + Z to undo
        e.preventDefault(); // Prevent default browser behavior
        if (allLines.length > 0) {
            const lastLine = allLines.pop();
            undoneLines.push(lastLine);

            // Clear the Matter.js world and re-add all remaining elements
            World.clear(world);
            World.add(world, [ball, ground, ceiling, leftWall, rightWall]);
            allLines.forEach((lineGroup) => {
                lineGroup.forEach((segment) => {
                    World.add(world, segment);
                });
            });

            saveLines(); // Save updated state
        }
    } else if (e.ctrlKey && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        // Ctrl + Shift + Z to redo
        e.preventDefault(); // Prevent default browser behavior
        if (undoneLines.length > 0) {
            const restoredLine = undoneLines.pop();
            allLines.push(restoredLine);

            // Add restored segments back to the Matter.js world
            restoredLine.forEach((segment) => World.add(world, segment));

            saveLines(); // Save updated state
        }
    }
});


window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') isMovingLeft = false;
    if (e.key === 'ArrowRight') isMovingRight = false;

    if (e.key === ' ') {
        if (spacebarPressTime && isOnSurface) {
            const holdDuration = (Date.now() - spacebarPressTime) / 1000; // ms to seconds
            const clampedDuration = Math.min(holdDuration, maxHoldTime); // Cap duration
            const jumpHeight =
                minJumpHeight +
                (clampedDuration / maxHoldTime) * (maxJumpHeight - minJumpHeight);

            Body.setVelocity(ball, { x: ball.velocity.x, y: jumpHeight });
            jumpAllowed = false; // Prevent consecutive jumps
            spacebarPressTime = null; // Reset for next jump
            auraStrength = 0; // Reset aura strength
        }
    }
});


Events.on(engine, 'beforeUpdate', () => {
    const force = 0.02;
    if (isMovingLeft) Body.applyForce(ball, ball.position, { x: -force, y: 0 });
    if (isMovingRight) Body.applyForce(ball, ball.position, { x: force, y: 0 });
    if (spacebarPressTime) {
        const holdDuration = (Date.now() - spacebarPressTime) / 1000; // Get hold duration
        const clampedDuration = Math.min(holdDuration, maxHoldTime); // Cap at max hold time
        auraStrength = clampedDuration / maxHoldTime; // Normalize aura strength (0 to 1)
    } else if (auraStrength > 0) {
        auraStrength = Math.max(auraStrength - 0.05, 0); // Gradually reduce aura strength
    }

    // Multi-layer fiery aura effect
    const ctx = canvas.getContext('2d');

    // Define vibrant aura colors
    const colors = [
        `rgba(255, 255, 0, ${auraStrength * 0.8})`, // Bright yellow
        `rgba(255, 165, 0, ${auraStrength * 0.6})`, // Orange
        `rgba(255, 69, 0, ${auraStrength * 0.4})`,  // Fiery red
        `rgba(255, 0, 0, ${auraStrength * 0.2})`    // Dim red
    ];

    const auraRadius = 50 + 40 * auraStrength; // Aura size scales with strength

    // Draw the aura as a radial gradient around the ball
    const gradient = ctx.createRadialGradient(
        ball.position.x, ball.position.y, 0,
        ball.position.x, ball.position.y, auraRadius
    );

    gradient.addColorStop(0, colors[0]); // Inner yellow
    gradient.addColorStop(0.4, colors[1]); // Mid orange
    gradient.addColorStop(0.7, colors[2]); // Outer fiery red
    gradient.addColorStop(1, colors[3]); // Faint outer edge

    ctx.save(); // Save the current state of the canvas
    ctx.globalCompositeOperation = 'lighter'; // Additive blending for glow effect

    ctx.beginPath();
    ctx.arc(ball.position.x, ball.position.y, auraRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore(); // Restore the canvas state
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

function saveCurrentMode(mode) {
    localStorage.setItem('currentMode', mode);
}

function loadCurrentMode() {
    return localStorage.getItem('currentMode') || 'startingPage';
}

function updateCanvasSize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight - 3.2;

    // Update canvas dimensions
    canvas.width = newWidth - 2;
    canvas.height = newHeight - 2;

    // Update Matter.js world boundaries
    Body.setPosition(ground, { x: newWidth / 2, y: newHeight + 10 });
    Body.setVertices(ground, [
        { x: 0, y: newHeight },
        { x: newWidth, y: newHeight },
        { x: newWidth, y: newHeight + 20 },
        { x: 0, y: newHeight + 20 },
    ]);

    Body.setPosition(ceiling, { x: newWidth / 2, y: -10 });
    Body.setVertices(ceiling, [
        { x: 0, y: 0 },
        { x: newWidth, y: 0 },
        { x: newWidth, y: -20 },
        { x: 0, y: -20 },
    ]);

    Body.setPosition(leftWall, { x: -10, y: newHeight / 2 });
    Body.setVertices(leftWall, [
        { x: 0, y: 0 },
        { x: -20, y: 0 },
        { x: -20, y: newHeight },
        { x: 0, y: newHeight },
    ]);

    Body.setPosition(rightWall, { x: newWidth + 10, y: newHeight / 2 });
    Body.setVertices(rightWall, [
        { x: newWidth, y: 0 },
        { x: newWidth + 20, y: 0 },
        { x: newWidth + 20, y: newHeight },
        { x: newWidth, y: newHeight },
    ]);

    // Update render dimensions
    render.options.width = newWidth;
    render.options.height = newHeight;
}

// Initialize canvas size on load
updateCanvasSize();

// Add resize event listener
window.addEventListener('resize', updateCanvasSize);

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

    const savedMode = loadCurrentMode();

    if (savedMode === 'storyMode') {
        // Show the game canvas and hide the starting screen
        document.getElementById('startingScreen').style.display = 'none';
        document.getElementById('gameCanvasContainer').style.display = 'block';
    } else {
        // Show the starting screen and hide the game canvas
        document.getElementById('startingScreen').style.display = 'block';
        document.getElementById('gameCanvasContainer').style.display = 'none';
    }
});


// Add event listeners for buttons
document.getElementById('storyModeButton').addEventListener('click', () => {
    // Hide the starting screen and show the game canvas
    document.getElementById('startingScreen').style.display = 'none';
    document.getElementById('gameCanvasContainer').style.display = 'block';
    saveCurrentMode('storyMode');
});

const surfacesInContact = new Set();

// Detect collisions to check if the ball is on a surface
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        if (bodyA === ball || bodyB === ball) {
            const otherBody = bodyA === ball ? bodyB : bodyA;

            // Check if the other body is a valid surface
            if (otherBody === ground || allLines.some(lineGroup => lineGroup.includes(otherBody))) {
                surfacesInContact.add(otherBody); // Add to the set of surfaces
                isOnSurface = true; // Ball is on a surface
                jumpAllowed = true; // Enable jumping
            }
        }
    });
});

Events.on(engine, 'collisionEnd', (event) => {
    event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        if (bodyA === ball || bodyB === ball) {
            const otherBody = bodyA === ball ? bodyB : bodyA;

            // Check if the other body is a surface
            if (surfacesInContact.has(otherBody)) {
                surfacesInContact.delete(otherBody); // Remove from the set of surfaces

                // Update isOnSurface only if no more surfaces are in contact
                if (surfacesInContact.size === 0) {
                    isOnSurface = false;
                }
            }
        }
    });
});
const gridContainer = document.getElementById('grid-container');
const levelInfo = document.getElementById('level-info');
const timerDisplay = document.getElementById('timer');
const attemptsDisplay = document.getElementById('attempts');
const startButton = document.getElementById('start-button');

let level = 1;
let attempts = 3;
let timer = 10;
let timerInterval;
let targetBoxIndex = null;
let colorDifference = 50; // Starting difference in RGB values
let originalColors = []; // Store original colors of boxes

function generateRandomColor() {
    return {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
    };
}

function adjustColor(color, adjustment) {
    return {
        r: Math.max(0, Math.min(255, color.r + adjustment)),
        g: Math.max(0, Math.min(255, color.g + adjustment)),
        b: Math.max(0, Math.min(255, color.b + adjustment)),
    };
}

function rgbToCss(rgb) {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function createGrid() {
    gridContainer.innerHTML = '';
    originalColors = []; // Clear colors each time grid is created

    for (let i = 0; i < 16; i++) {
        const box = document.createElement('div');
        box.className = 'grid-box';
        box.addEventListener('click', () => handleBoxClick(box, i));
        gridContainer.appendChild(box);
    }
}

function startGame() {
    levelInfo.style.display = 'block';
    document.getElementById('info-container').style.display = 'block';
    startButton.style.display = 'none';

    levelInfo.textContent = `Level: ${level}`;
    attempts = 3;
    attemptsDisplay.textContent = `Attempts: ${attempts}`;
    timer = 10 + level;
    timerDisplay.textContent = `Time Left: ${timer}s`;

    const baseColor = generateRandomColor();
    const adjustment = Math.random() > 0.5 ? -colorDifference : colorDifference;
    const targetColor = adjustColor(baseColor, adjustment);

    targetBoxIndex = Math.floor(Math.random() * 16);

    const boxes = document.querySelectorAll('.grid-box');
    boxes.forEach((box, index) => {
        const color = index === targetBoxIndex ? targetColor : baseColor;
        box.style.backgroundColor = rgbToCss(color);
        originalColors[index] = rgbToCss(color); // Store each box's color
    });

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        timerDisplay.textContent = `Time Left: ${timer}s`;
        if (timer <= 0) {
            resetGame(); // Directly refresh without alert
        }
    }, 1000);
}


function handleBoxClick(box, index) {
    if (index === targetBoxIndex) {
        box.style.backgroundColor = 'green';
        box.style.transform = 'scale(1.2)';
        clearInterval(timerInterval);
        setTimeout(() => {
            level++;
            colorDifference = Math.max(5, colorDifference - 5);
            createGrid();
            startGame();
        }, 1000);
    } else {
        box.style.backgroundColor = 'red';
        box.style.transform = 'scale(1.2)';
        attempts--;
        attemptsDisplay.textContent = `Attempts: ${attempts}`;

        setTimeout(() => {
            box.style.transform = 'scale(1)';
            box.style.backgroundColor = originalColors[index]; // Revert to original color
        }, 500);

        if (attempts <= 0) {
            alert('You have lost! Restarting...');
            resetGame();
        }
    }
}

function resetGame() {
    location.reload(); // Refresh the page to restart the game
}

// Initialize grid and attach event listener to the button
createGrid();
startButton.addEventListener('click', startGame);

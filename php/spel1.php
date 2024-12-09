<!DOCTYPE html>
<html lang="en" data-page="spel1">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memory Game</title>
    <link href="../style.css" rel="stylesheet" type="text/css">
</head>
<body>
    <div class="game-container">
        <div class="level">Level: <span id="level">1</span></div>
        <div class="grid" id="grid">
            <!-- Boxes will be generated here -->
        </div>
        <div class="button-switch-container">
            <div class="switch-container" id="switch-container">
                <label class="switch">
                    <input type="checkbox" id="mode-switch">
                    <span class="slider"></span>
                </label>
            </div>
            <button id="start-button">Start</button>
        </div>
        <div class="stats">
            Total Attempts: <span id="attempts">3</span><br>
            Time Remaining: <span id="time">10</span> seconds
        </div>
    </div>

    <div class="overlay" id="overlay"></div>
    <div class="popup" id="popup">
        <button class="close-btn" id="close-popup">&times;</button>
        <h2>Game Over</h2>
        <p>Level Reached: <span id="final-level"></span></p>
        <p>Tid: <span id="total-time"></span> seconds</p>
        <p>Experience Points (XP) Gained: <span id="final-xp"></span></p>
    </div>

    <script>
        const grid = document.getElementById('grid');
        const startButton = document.getElementById('start-button');
        const levelDisplay = document.getElementById('level');
        const attemptsDisplay = document.getElementById('attempts');
        const timeDisplay = document.getElementById('time');
        const modeSwitch = document.getElementById('mode-switch');
        const popup = document.getElementById('popup');
        const overlay = document.getElementById('overlay');
        const closePopupButton = document.getElementById('close-popup');
        const finalLevel = document.getElementById('final-level');
        const finalXP = document.getElementById('final-xp');
        const totalTime = document.getElementById('total-time');
        const switchContainer = document.getElementById('switch-container');

        let sequence = [];
        let userSequence = [];
        let level = 1;
        let attempts = 3;
        let timeRemaining = 10;
        let timer;
        let canInteract = false;
        let progressiveMode = false;
        let startTime, endTime;

        // Generate the grid
        for (let i = 0; i < 9; i++) {
            const box = document.createElement('div');
            box.classList.add('box');
            box.dataset.index = i;
            grid.appendChild(box);

            box.addEventListener('click', () => {
                if (canInteract) {
                    handleUserInput(Number(box.dataset.index));
                }
            });
        }

        modeSwitch.addEventListener('change', () => {
            progressiveMode = modeSwitch.checked;
        });

        startButton.addEventListener('click', () => {
            startButton.style.display = 'none';
            switchContainer.remove(); // Remove the switch container
            startGame();
        });

        closePopupButton.addEventListener('click', closePopup);
        overlay.addEventListener('click', closePopup);

        function startGame() {
            level = 1;
            attempts = 3;
            timeRemaining = 10;
            sequence = [];
            startTime = Date.now(); // Record start time
            updateStats();
            nextLevel();
        }

        function nextLevel() {
            canInteract = false;
            userSequence = [];
            levelDisplay.textContent = level;
            timeRemaining = 10 + (level - 1) * 5; // Adjust timer for each level
            updateStats();

            if (progressiveMode) {
                sequence.push(Math.floor(Math.random() * 9));
            } else {
                sequence = Array.from({ length: level }, () => Math.floor(Math.random() * 9));
            }

            displaySequence(() => {
                // Start the timer only after the sequence is displayed
                startTimer();
            });
        }

        function displaySequence(callback) {
            let index = 0;
            const boxes = document.querySelectorAll('.box');

            const interval = setInterval(() => {
                if (index > 0) boxes[sequence[index - 1]].classList.remove('active');

                if (index < sequence.length) {
                    boxes[sequence[index]].classList.add('active');
                    index++;
                } else {
                    clearInterval(interval);
                    boxes.forEach((box) => box.classList.remove('active'));
                    canInteract = true;

                    // Invoke the callback after sequence display completes
                    if (typeof callback === 'function') callback();
                }
            }, 800);
        }

        function startTimer() {
            clearInterval(timer); // Ensure no overlapping timers
            timer = setInterval(() => {
                timeRemaining--;
                updateStats();

                if (timeRemaining <= 0) {
                    clearInterval(timer);
                    attempts--;
                    updateStats();
                    if (attempts <= 0) {
                        endGame();
                    } else {
                        nextLevel();
                    }
                }
            }, 1000);
        }

        function handleUserInput(index) {
            const boxes = document.querySelectorAll('.box');

            // Highlight user input
            if (sequence[userSequence.length] === index) {
                userSequence.push(index);
                boxes[index].classList.add('correct');
                setTimeout(() => boxes[index].classList.remove('correct'), 500);

                // Check if user completed the sequence
                if (userSequence.length === sequence.length) {
                    level++;
                    setTimeout(nextLevel, 1000);
                }
            } else {
                // Handle incorrect input
                boxes[index].classList.add('incorrect');
                setTimeout(() => boxes[index].classList.remove('incorrect'), 500);

                attempts--;
                updateStats();

                if (attempts <= 0) {
                    endGame();
                } else {
                    // Do not reset userSequence; allow continued attempts within the current level
                }
            }
        }

        function updateStats() {
            attemptsDisplay.textContent = attempts;
            timeDisplay.textContent = timeRemaining;
        }

        function endGame() {
            canInteract = false;
            clearInterval(timer); // Stop the timer
            endTime = Date.now(); // Record end time
            const totalTimeElapsed = Math.floor((endTime - startTime) / 1000); // Calculate elapsed time in seconds

            finalLevel.textContent = level;
            finalXP.textContent = level * 10; // Calculate XP
            totalTime.textContent = totalTimeElapsed; // Display total time

            popup.classList.add('visible');
            overlay.classList.add('visible');
        }

        function closePopup() {
            popup.classList.remove('visible');
            overlay.classList.remove('visible');
            location.reload(); // Reload the game
        }
    </script>
</body>
</html>

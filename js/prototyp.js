function redirect(url) {
    window.location.href = url;
}


let currentLevel = 1; // Default level
let isAnimating = false; // To prevent multiple animations at the same time
let cancelAnimation = false; // To stop long-running animations when new clicks happen

let remainingTime = 0;
let timerInterval;
let remainingTries = 3; // Default value of 3 tries
let highlightedSequence = [];
let currentTapIndex = 0; // To track the current index of user tap

// Function to update the displayed level
function setLevel(level) {
    currentLevel = level;
    document.getElementById('level-display').textContent = `Level: ${level}`;
}

// Function to update the tries display
function updateTriesDisplay() {
    const triesDisplay = document.getElementById('tries-display');
    triesDisplay.textContent = `Antal försök: ${remainingTries}`;
}

// Function to calculate the time for the current level
function calculateTimeForLevel(level) {
    if (level <= 3) {
        return 10; // 10 seconds for levels 1 to 3
    } else {
        return 10 + (level - 3) * 5; // Add 5 seconds for each level after level 3
    }
}

// Function to start the timer
function startTimer(duration) {
    remainingTime = duration;
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.textContent = `Tid kvar: ${remainingTime}s`;

    timerInterval = setInterval(() => {
        remainingTime--;
        timerDisplay.textContent = `Tid kvar: ${remainingTime}s`;

        if (remainingTime <= 0) {
            clearInterval(timerInterval); // Stop the timer when it reaches 0
            loseAllAttempts(); // Player loses all attempts if time runs out
        }
    }, 1000); // Update every second
}

// Function to highlight a box and store the sequence
function highlightBox(box) {
    return new Promise(resolve => {
        highlightedSequence.push(box); // Store this box in the sequence
        box.classList.add('highlight');
        box.classList.add('grow');
        
        setTimeout(() => {
            box.classList.remove('grow'); // Shrinking animation begins
            
            setTimeout(() => {
                box.classList.remove('highlight'); // Remove highlight after box returns to normal
                resolve();
            }, 300); // 0.4 second delay for shrinking
        }, 300); // 0.4 second for growing
    });
}

// Function to start a new level
async function startLevel() {
    const container = document.getElementById('container');
    container.classList.add('no-hover');
    isAnimating = true;
    cancelAnimation = false;

    const boxes = document.querySelectorAll('.box');
    highlightedSequence = []; // Reset the sequence for the new level

    // Highlight the sequence based on the current level
    for (let i = 0; i < currentLevel; i++) {
        if (cancelAnimation) break;
        const randomIndex = Math.floor(Math.random() * boxes.length);
        await highlightBox(boxes[randomIndex]);
    }

    container.classList.remove('no-hover');
    isAnimating = false;
    currentTapIndex = 0; // Reset tap index for this level

    // Start the timer for the new level
    const timeForLevel = calculateTimeForLevel(currentLevel);
    startTimer(timeForLevel);
}

// Function to handle when the user taps a box
function handleBoxClick(box) {
    if (remainingTries <= 0) return; // No attempts left, ignore taps
    if (currentTapIndex >= highlightedSequence.length) return; // If sequence is complete, do nothing

    const expectedBox = highlightedSequence[currentTapIndex];
    if (box === expectedBox) {
        // Correct box clicked
        box.classList.add('clicked'); // Temporarily highlight the box orange
        setTimeout(() => {
            box.classList.remove('clicked'); // Remove the clicked highlight
        }, 300);
        currentTapIndex++; // Move to the next box in the sequence

        if (currentTapIndex === highlightedSequence.length) {
            // Player has correctly tapped all the boxes, proceed to the next level
            clearInterval(timerInterval); // Stop the timer
            setTimeout(() => {
                nextLevel(); // Proceed to the next level after a short delay
            }, 500); // Small delay before starting the next level
        }
    } else {
        // Incorrect box clicked
        box.classList.add('wrong'); // Temporarily highlight the box red
        setTimeout(() => {
            box.classList.remove('wrong');
        }, 300);
        remainingTries--; // Decrease attempts
        updateTriesDisplay();

        if (remainingTries <= 0) {
            clearInterval(timerInterval); // Stop the timer if no attempts are left
            loseAllAttempts(); // Game over logic
        }
    }
}

// Function to proceed to the next level
function nextLevel() {
    currentLevel++; // Increase the level
    setLevel(currentLevel); // Update the level display
    startLevel(); // Start the next level
}

// Lose all attempts when the timer runs out or attempts are 0
function loseAllAttempts() {
    remainingTries = 0;
    updateTriesDisplay();
    document.querySelectorAll('.box').forEach(box => {
        box.classList.add('wrong'); // Highlight all boxes red as a game-over indicator
        setTimeout(() => {
            box.classList.remove('wrong');
        }, 500); // Remove the red highlight after 500ms
    });
}

// Add the click event listener to each box
document.querySelectorAll('.box').forEach(box => {
    box.addEventListener('click', function() {
        handleBoxClick(box);
    });
});

// Start the game when the "Start Game" button is clicked
document.getElementById('spelknapp').addEventListener('click', function() {
    this.style.display = 'none'; // Hide start button
    document.getElementById('level-display').style.display = 'block'; // Show level display
    document.getElementById('timer-display').style.display = 'block'; // Show level display
    document.getElementById('tries-display').style.display = 'block'; // Show level display
    updateTriesDisplay(); // Show the tries display
    startLevel(); // Start the first level
});

// Set the initial level
setLevel(1);

let bestLevel = 1; // Store the best level

// Function to show the game over popup with sliding animation
function showGameOverPopup() {
    const popup = document.getElementById('game-over-popup');
    const popupContent = document.querySelector('.popup-content');

    // Update popup content with level, exp, and best level
    document.getElementById('popup-level').textContent = currentLevel;
    document.getElementById('popup-exp').textContent = currentLevel * 10; // Example EXP calculation
    document.getElementById('popup-best-level').textContent = bestLevel;

    if (currentLevel > bestLevel) {
        bestLevel = currentLevel; // Update best level if current level is higher
    }

    // Display the popup
    popup.style.display = 'block';

    // Slide the popup content from top to center
    setTimeout(() => {
        popupContent.classList.add('active'); // Apply the 'active' class to trigger the transition
    }, 100); // Slight delay for smoother animation
}

// Close the popup if the user clicks outside of the content
window.addEventListener('click', function(event) {
    const popup = document.getElementById('game-over-popup');
    const popupContent = document.querySelector('.popup-content');
    if (event.target === popup) {
        closeGameOverPopup();
    }
});

// Modify the closeGameOverPopup function to ensure the popup hides properly
function closeGameOverPopup() {
    const popup = document.getElementById('game-over-popup');
    const popupContent = document.querySelector('.popup-content');

    // Remove 'active' class to slide the popup back up
    popupContent.classList.remove('active');

    // Hide popup after the transition ends (0.6s for sliding)
    setTimeout(() => {
        popup.style.display = 'none';

        // Refresh the game after the popup is hidden
        setTimeout(() => {
            window.location.reload();
        }, 0);
    }, 200); // Match the transition duration of the sliding animation
}


// Modify the loseAllAttempts function to show the popup
function loseAllAttempts() {
    remainingTries = 0;
    updateTriesDisplay();
    document.querySelectorAll('.box').forEach(box => {
        box.classList.add('wrong'); // Highlight all boxes red as a game-over indicator
        setTimeout(() => {
            box.classList.remove('wrong');
        }, 500); // Remove the red highlight after 500ms
    });

    // Show the game over popup slightly after the red highlight
    setTimeout(() => {
        showGameOverPopup();
    }, 200);
}

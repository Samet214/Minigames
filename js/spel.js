function redirect(url) {
    window.location.href = url;
}

function openModal(gameId) {
    const gameUrls = {
        game1: "game_display.php?gameId=game1",
        game2: "game_display.php?gameId=game2",
        game3: "game_display.php?gameId=game3",
        game4: "game_display.php?gameId=game4",
        game5: "game_display.php?gameId=game5"
    };

    if (gameUrls[gameId]) {
        window.location.href = gameUrls[gameId];
    } else {
        alert("Game not found!");
    }
}

function closeModal() {
    const overlay = document.getElementById("overlay");
    const modal = document.getElementById("modal");
    overlay.style.animation = "fadeOut 0.5s ease-out forwards";
    modal.style.animation = "modalResizeOut 1s cubic-bezier(0.25, 0.1, 0.25, 1.5) forwards";

    setTimeout(() => {
        overlay.style.display = "none";
    }, 500);
}

let currency = 0;

function gainCurrency(amount) {
    currency += amount;
    document.getElementById('currency-amount').textContent = currency;
}

// Toggle Full-Screen Mode
function toggleFullScreen(event) {
    event.stopPropagation();
    const modal = document.getElementById("modal");
    const enterIcon = document.getElementById("enter-fullscreen-icon");
    const exitIcon = document.getElementById("exit-fullscreen-icon");
    const gameIframe = document.getElementById("game-iframe");

    if (!document.fullscreenElement) {
        modal.requestFullscreen().then(() => {
            modal.classList.add("full-screen-mode");
            enterIcon.style.display = "none";
            exitIcon.style.display = "inline";
        });
    } else {
        document.exitFullscreen().then(() => {
            modal.classList.remove("full-screen-mode");
            enterIcon.style.display = "inline";
            exitIcon.style.display = "none";
        });
    }
}


function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    var toggleButton = document.getElementById("sidebar-toggle");

    sidebar.classList.toggle("open");

    if (sidebar.classList.contains("open")) {
        toggleButton.style.left = "260px";
    } else {
        toggleButton.style.left = "10px";
    }
}

function gainExp(expAmount, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "sida.php", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            var currentExp = response.current_exp;
            var nextLevelExp = response.next_level_exp;
            var level = response.level;

            console.log("Current EXP:", currentExp);
            console.log("Next Level EXP:", nextLevelExp);
            console.log("Level:", level);

            // Format numbers with appropriate units (K, M, G)
            function formatNumber(number) {
                if (number >= 1000000000) {
                    return (number / 1000000000).toFixed(1) + 'G';
                } else if (number >= 1000000) {
                    return (number / 1000000).toFixed(1) + 'M';
                } else if (number >= 1000) {
                    return (number / 1000).toFixed(1) + 'K';
                } else {
                    return number;
                }
            }

            var formattedCurrentExp = formatNumber(currentExp);
            var formattedNextLevelExp = formatNumber(nextLevelExp);

            // Update the EXP bar and text
            var progressBar = document.getElementById('expProgress');
            var expText = document.getElementById('expText');
            progressBar.style.width = (currentExp / nextLevelExp) * 100 + '%';
            expText.textContent = formattedCurrentExp + '/' + formattedNextLevelExp + ' EXP';

            // Update the user's level
            document.getElementById('level').textContent = level;

            // If callback is provided, execute it with EXP data
            if (callback) {
                callback(currentExp, nextLevelExp, level);
            }
        }
    };

    // Send the request to the server with the EXP amount
    xhr.send("add_exp=true&exp_amount=" + expAmount);
}


function toggleProfile() {
    const profileSquare = document.getElementById('profileSquare');
    const searchBox = document.getElementById('searchInput');

    document.addEventListener('click', handleOutsideClick);

    // Ensure profileSquare remains visible without re-toggling
    if (profileSquare.classList.contains('active')) {
        closeProfile();
    } else {
        profileSquare.classList.add('active');
        profileSquare.style.display = 'block';
        profileSquare.style.opacity = '1';
        profileSquare.style.transform = 'translateY(10px)';
    }
}

// Function to close the profile square
function closeProfile() {
    const profileSquare = document.getElementById('profileSquare');

    profileSquare.style.opacity = '0';
    profileSquare.style.transform = 'translateY(0px)';

    // Timeout to wait for the animation to finish before hiding
    setTimeout(() => {
        profileSquare.classList.remove('active');
        profileSquare.style.display = 'none';
    }, 300); // Match the CSS transition duration

    // Remove the event listener
    document.removeEventListener('click', handleOutsideClick);
}

function searchProfiles() {
    const searchInput = document.getElementById('searchInput').value.trim();

    if (searchInput === '') {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'sida.php?search=' + encodeURIComponent(searchInput), true);

    xhr.onload = function() {
        if (xhr.status === 200) {
            const results = JSON.parse(xhr.responseText);
            const searchResultsContainer = document.getElementById('searchResults');
            searchResultsContainer.innerHTML = '';

            if (results.message) {
                const noUserFound = document.createElement('div');
                noUserFound.classList.add('result-item');
                noUserFound.textContent = results.message;
                searchResultsContainer.appendChild(noUserFound);
            } else {
                results.forEach(function(user) {
                    const profileImage = user.Profil_bild || 'default.png';
                    const resultItem = document.createElement('div');
                    resultItem.classList.add('result-item');

                    // Set data attributes for level, exp, and exp threshold
                    resultItem.dataset.profileImage = profileImage;
                    resultItem.dataset.level = user.Levels;
                    resultItem.dataset.exp = user.EXP;
                    resultItem.dataset.expThreshold = user.EXP_GRÄNS;

                    const img = document.createElement('img');
                    img.classList.add('profile-image');
                    img.src = '../pfp/' + profileImage;

                    const username = document.createElement('span');
                    username.classList.add('username');
                    username.textContent = user.Namn;

                    resultItem.appendChild(img);
                    resultItem.appendChild(username);
                    searchResultsContainer.appendChild(resultItem);
                });
            }
        }
    };

    xhr.send();
}

function updateProfile(profileImageSrc, userName, userLevel, userExp, expThreshold) {
    const searchResultsContainer = document.getElementById('searchResults');

    // Clear previous results
    searchResultsContainer.innerHTML = '';

    // Create a new container for the selected profile
    const selectedProfileContainer = document.createElement('div');
    selectedProfileContainer.style.display = 'flex';
    selectedProfileContainer.style.alignItems = 'center';
    selectedProfileContainer.style.flexDirection = 'column';
    selectedProfileContainer.style.textAlign = 'center';

    // Add profile picture and username
    const profileCircle = document.createElement('img');
    profileCircle.src = '../pfp/' + profileImageSrc;
    profileCircle.classList.add('selected-profile-circle');

    const username = document.createElement('span');
    username.classList.add('username2');
    username.textContent = userName;

    // Create the level section with EXP details as plain text
    const levelSection = document.createElement('div');
    levelSection.classList.add('level-section2');
    levelSection.innerHTML = `
        <h4>Level <span>${userLevel}</span></h4>
        <div class="exp-bar2">
            <div class="exp-progress2" style="width: ${(userExp / expThreshold) * 100}%;"></div>
        </div>
        <p>${userExp} / ${expThreshold} EXP</p>
    `;

    // Append elements to the new profile container
    selectedProfileContainer.appendChild(profileCircle);
    selectedProfileContainer.appendChild(username);
    selectedProfileContainer.appendChild(levelSection);

    const messagebutton = document.createElement('button');
    messagebutton.classList.add('messagebutton');

    messagebutton.textContent = 'Meddelande'

    searchResultsContainer.appendChild(messagebutton);

    // Append to the search results container
    searchResultsContainer.appendChild(selectedProfileContainer);

    // Add the close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.classList.add('close-button');
    closeButton.addEventListener('click', function() {
        searchResultsContainer.innerHTML = '';
        document.getElementById('searchInput').style.display = 'block'; // Show the search box again
        searchProfiles(); // Reload the search results
    });
    selectedProfileContainer.appendChild(closeButton);
}

function openMessageContainer() {
    const searchResultsContainer = document.getElementById('searchResults');
    searchResultsContainer.innerHTML = ''; // Clear any previous content

    // Create and configure the "Close" button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.classList.add('close-button');
    closeButton.addEventListener('click', function() {
        // Return to the search input and reload search results
        document.getElementById('searchInput').style.display = 'block'; // Show the search box
        searchResultsContainer.innerHTML = ''; // Clear the message container
        searchProfiles(); // Reload the search results
    });

    // Message display area
    const messageDisplay = document.createElement('div');
    messageDisplay.classList.add('message-display');

    // Input field for composing new messages
    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.classList.add('message-input');
    messageInput.placeholder = 'Write a message...';

    // "Send" button for sending messages
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.classList.add('send-button');

    // Append elements to display the message UI
    searchResultsContainer.classList.add('message-container'); // Apply styles for the message container
    searchResultsContainer.appendChild(closeButton);
    searchResultsContainer.appendChild(messageDisplay);
    searchResultsContainer.appendChild(messageInput);
    searchResultsContainer.appendChild(sendButton);
}


// Event listener for handling profile and message interactions
document.addEventListener('click', function(event) {
    const searchResultsContainer = document.getElementById('searchResults');
    const searchBox = document.getElementById('searchInput');

    // Check if a profile item or profile image is clicked
    if (event.target.classList.contains('result-item') || event.target.classList.contains('profile-image')) {
        const clickedItem = event.target.closest('.result-item');
        const profileImageSrc = clickedItem.dataset.profileImage;
        const userName = clickedItem.querySelector('.username').textContent;
        const userLevel = clickedItem.dataset.level;
        const userExp = clickedItem.dataset.exp;
        const expThreshold = clickedItem.dataset.expThreshold;

        // Hide the search box
        searchBox.style.display = 'none';

        // Display the selected profile with its details
        updateProfile(profileImageSrc, userName, userLevel, userExp, expThreshold);
    }

    // Check if the "Meddelande" (Message) button is clicked
    if (event.target.classList.contains('messagebutton')) {
        openMessageContainer();
    }
});

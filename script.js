//Alla filer

// Get the PHP file name from the data attribute
const phpFileInfoElement = document.getElementById('php-file-info');
const currentPhpFile = phpFileInfoElement.getAttribute('data-php-file');
let currentProfile = {};  // Global object to hold the current profile data


function redirect(url) {
    window.location.href = url;
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

let currency = 0; // Default starting amount

function gainCurrency(amount) {
    // Fetch the current currency value from the server before updating
    fetch('get_currency.php')  // This PHP script returns the current user's currency value
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 'success') {
                let currency = data.value; // Get the current currency value for the logged-in user

                // Add the amount to the current value
                currency += amount;

                // Update the currency display
                document.getElementById('currency-amount').textContent = currency;

                // Send the updated value to the server to store in the database
                fetch('update_ekonomi.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `action=gain&amount=${amount}`,
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then((data) => {
                        if (data.status === 'success') {
                            console.log('Currency updated successfully.');
                        } else {
                            console.error('Error updating currency:', data.message);
                        }
                    })
                    .catch((error) => {
                        console.error('Fetch error:', error);
                    });
            } else {
                console.error('Error retrieving current currency value:', data.message);
            }
        })
        .catch((error) => {
            console.error('Fetch error:', error);
        });
}


async function updateNetworth() {
    try {
        // Fetch the networth value from the PHP script
        const response = await fetch('get_networth.php');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const value = await response.text();

        // Update the span with the networth value
        document.getElementById('currency-amount').textContent = value;
    } catch (error) {
        console.error('Error fetching networth:', error);
    }
}

// Call the function when the page loads
window.onload = updateNetworth;

function loseCurrency(amount) {
    if (currency - amount < 0) {
        console.log('Not enough currency to lose.');
        return;
    }

    currency -= amount;
    document.getElementById('currency-amount').textContent = currency;

    fetch('update_ekonomi.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=lose&amount=${amount}`,
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            if (data.status === 'success') {
                console.log('Currency updated successfully.');
            } else {
                console.error('Error updating currency:', data.message);
            }
        })
        .catch((error) => {
            console.error('Fetch error:', error);
        });
}



//Specifika filer
if (currentPhpFile === "game_display.php") {
    alert('hey');
} else if (currentPhpFile === "index.php") {
    
    function toggleSidebar() {
        var sidebar = document.getElementById("sidebar");
        var toggleButton = document.getElementById("sidebar-toggle");
    
        // Toggle the 'open' class
        sidebar.classList.toggle("open");
    
        // Adjust the width of the sidebar when open
        if (sidebar.classList.contains("open")) {
            sidebar.style.width = "250px"; // Set width when sidebar is open
            toggleButton.style.left = "260px"; // Sidebar width (250px) + 10px margin
        } else {
            sidebar.style.width = "0"; // Set width to 0 when sidebar is closed
            toggleButton.style.left = "10px"; // Reset to original position
        }
    }
    
    document.getElementById("logo").addEventListener("click", function() {
        redirect('index.php');
    });
    
    const logo = document.getElementById('logo');
    const hoverCircle = document.getElementById('hover-circle');
    
    // Smooth transition when hovering over the logo
    logo.addEventListener('mouseover', () => {
        hoverCircle.style.opacity = '1'; // Fade in
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.7), 0 0 45px rgba(0, 255, 255, 0.6)'; // Intense glow
    });
    
    logo.addEventListener('mouseout', () => {
        hoverCircle.style.opacity = '0'; // Fade out
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.6), 0 0 30px rgba(0, 255, 255, 0.5), 0 0 45px rgba(0, 255, 255, 0.4)'; // Normal glow
    });

} else if (currentPhpFile === "login.php") {
    
    document.addEventListener("DOMContentLoaded", function () {
        const infoSection = document.getElementById('login-info');
        infoSection.style.opacity = 0;
    
        setTimeout(function () {
            infoSection.style.transition = 'opacity 1.5s ease-in-out';
            infoSection.style.opacity = 1;
        }, 200);
    });
    
    document.getElementById("logo").addEventListener("click", function() {
        redirect('index.php');
    });
    
    const logo = document.getElementById('logo');
    const hoverCircle = document.getElementById('hover-circle');
    
    // Smooth transition when hovering over the logo
    logo.addEventListener('mouseover', () => {
        hoverCircle.style.opacity = '1'; // Fade in
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.7), 0 0 45px rgba(0, 255, 255, 0.6)'; // Intense glow
    });
    
    logo.addEventListener('mouseout', () => {
        hoverCircle.style.opacity = '0'; // Fade out
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.6), 0 0 30px rgba(0, 255, 255, 0.5), 0 0 45px rgba(0, 255, 255, 0.4)'; // Normal glow
    });
    
} else if (currentPhpFile === "sida.php") {

    function toggleSidebar() {
        var sidebar = document.getElementById("sidebar");
        var toggleButton = document.getElementById("sidebar-toggle");
    
        sidebar.classList.toggle("open");
    
        // Check if sidebar is open and move the button accordingly
        if (sidebar.classList.contains("open")) {
            toggleButton.style.left = "260px"; // Sidebar width (250px) + 10px margin
        } else {
            toggleButton.style.left = "10px"; // Reset to original position
        }
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
    
    // Handle clicks outside of the square
    function handleOutsideClick(event) {
        const profileSquare = document.getElementById('profileSquare');
        const searchProfileBtn = document.getElementById('searchProfileBtn');
        
        // Check if the click is outside profileSquare and not on result-item or close-button
        if (
            !profileSquare.contains(event.target) &&
            event.target !== searchProfileBtn &&
            !event.target.classList.contains('result-item') &&
            !event.target.classList.contains('close-button') &&
            !event.target.classList.contains('profile-image') &&
            event.target.id !== 'sidebar-toggle' &&
            !event.target.classList.contains('messagebutton')
        ) {
            closeProfile();
        }
    }
    
    // Assuming searchProfiles is where you create and display search results
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
    
            // Update the global profile data
            currentProfile = {
                userLevel: clickedItem.dataset.level,
                userName: userName,
                userExp: clickedItem.dataset.exp,
                expThreshold: clickedItem.dataset.expThreshold,
                profileImage: profileImageSrc,
            };
    
            // Hide the search box
            searchBox.style.display = 'none';
    
            // Display the selected profile with its details
            updateProfile(profileImageSrc, userName, currentProfile.userLevel, currentProfile.userExp, currentProfile.expThreshold);
        }
    
        // Check if the "Meddelande" (Message) button is clicked
        if (event.target.classList.contains('messagebutton')) {
            openMessageContainer();
        }
    });
      
} else if (currentPhpFile === "signup.php") {
    
    document.addEventListener("DOMContentLoaded", function () {
        const infoSection = document.getElementById('signup-info');
        infoSection.style.opacity = 0;
    
        setTimeout(function () {
            infoSection.style.transition = 'opacity 1.5s ease-in-out';
            infoSection.style.opacity = 1;
        }, 200);
    });
    
    document.getElementById("logo").addEventListener("click", function() {
        redirect('index.php');
    });
    
    const logo = document.getElementById('logo');
    const hoverCircle = document.getElementById('hover-circle');
    
    // Smooth transition when hovering over the logo
    logo.addEventListener('mouseover', () => {
        hoverCircle.style.opacity = '1'; // Fade in
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.7), 0 0 45px rgba(0, 255, 255, 0.6)'; // Intense glow
    });
    
    logo.addEventListener('mouseout', () => {
        hoverCircle.style.opacity = '0'; // Fade out
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.6), 0 0 30px rgba(0, 255, 255, 0.5), 0 0 45px rgba(0, 255, 255, 0.4)'; // Normal glow
    });
    
} else if (currentPhpFile === "spel.php") {

    document.getElementById("logo").addEventListener("click", function() {
        redirect('index.php');
    });
    
    function openModal(gameId) {
        const gameUrls = {
            game1: "game_display.php?gameId=game1",
            game2: "game_display.php?gameId=game2",
            game3: "game_display.php?gameId=game3",
            game4: "game_display.php?gameId=game4",
            game5: "game_display.php?gameId=game5",
            game6: "game_display.php?gameId=game6"
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
    
        // Check if sidebar is open and move the button accordingly
        if (sidebar.classList.contains("open")) {
            toggleButton.style.left = "260px"; // Sidebar width (250px) + 10px margin
        } else {
            toggleButton.style.left = "10px"; // Reset to original position
        }
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
    
    // Handle clicks outside of the square
    function handleOutsideClick(event) {
        const profileSquare = document.getElementById('profileSquare');
        const searchProfileBtn = document.getElementById('searchProfileBtn');
        
        // Check if the click is outside profileSquare and not on result-item or close-button
        if (
            !profileSquare.contains(event.target) &&
            event.target !== searchProfileBtn &&
            !event.target.classList.contains('result-item') &&
            !event.target.classList.contains('close-button') &&
            !event.target.classList.contains('profile-image') &&
            event.target.id !== 'sidebar-toggle' &&
            !event.target.classList.contains('messagebutton')
        ) {
            closeProfile();
        }
    }
    
    // Assuming searchProfiles is where you create and display search results
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
    
    // Dismiss messages automatically after 5 seconds
    setTimeout(() => {
        document.querySelectorAll('.message').forEach(msg => {
            msg.style.display = 'none';
        });
    }, 5000);

} else if (currentPhpFile === "spel1.php") {
    const grid = document.getElementById('grid');
    const startButton = document.getElementById('start-button');
    const levelDisplay = document.getElementById('level');
    const attemptsDisplay = document.getElementById('attempts');
    const timeDisplay = document.getElementById('time');
    const modeSwitch = document.getElementById('mode-switch');
    const switchText = document.getElementById('switch-text');
    const popup = document.getElementById('popup');
    const overlay = document.getElementById('overlay');
    const closePopupButton = document.getElementById('close-popup');
    const finalLevel = document.getElementById('final-level');
    const finalXP = document.getElementById('final-xp');
    const finalAP = document.getElementById('final-money');
    const totalTime = document.getElementById('total-time');
    const switchContainer = document.getElementById('switch-container');
    const username = phpFileInfoElement.dataset.username;

    let sequence = [];
    let userSequence = [];
    let level = 1;
    let attempts = 3;
    let timeRemaining = 10;
    let timer;
    let canInteract = false;
    let progressiveMode = false;
    let startTime, endTime;

    // Update switch text dynamically
    modeSwitch.addEventListener('change', () => {
        if (modeSwitch.checked) {
            switchText.textContent = 'Progressive ';
            progressiveMode = true;
            startButton.style.marginRight = "40%";
        } else {
            switchText.textContent = 'Random ';
            progressiveMode = false;
            startButton.style.marginRight = "35%";
        }
    });

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
        totalTime.textContent = totalTimeElapsed; // Display total time
        
    
        if (username !== 'guest') {
            fetch('http://samet-desktop.adm.huddinge.se:3000/memory')
                .then(res => res.json())
                .then(memoryResponse => {
                    let userExists = false;
    
                    for (const record of memoryResponse) {
                        if (record.username === username) {
                            userExists = true;

                            let userlevel;

                            (async () => {
                                try {
                                    // Fetch the response from the API
                                    const poangssystemResponse = await fetch('http://samet-desktop.adm.huddinge.se:3000/poangssystem');
                                    
                                    // Parse the response as JSON
                                    const poangssystemData = await poangssystemResponse.json();
                                    
                                    // Look for a match in the 'Namn' column
                                    const matchedPoangssystemUser = poangssystemData.find(user => user.Namn === username);
                                    
                                    if (matchedPoangssystemUser) {
                                        userlevel = matchedPoangssystemUser.Levels;
                                    } else {
                                        console.log("User not found in poängssystem.");
                                    }
                                } catch (error) {
                                    console.error("Error fetching data: ", error);
                                }

                                const currentGameData = {
                                    nivå: level,
                                    level: userlevel,
                                    pengar_tjanat: 2 * level * userlevel,
                                    exp_tjanat: 2 * level * userlevel,
                                    tid: totalTimeElapsed / level,
                                    netvarde: record.netvarde,
                                };

                                fetch('http://samet-desktop.adm.huddinge.se:3000/ekonomi')
                                .then(res => res.json())
                                .then(ekonomiResponse => {
                                    // Find the user in the ekonomi table based on username
                                    const matchedUser = ekonomiResponse.find(user => user.username === username);

                                    if (matchedUser) {
                                        // Add level * 10 to the existing value and networth
                                        const updatedValue = matchedUser.value + (2 * level * userlevel);
                                        const updatedNetworth = matchedUser.networth + (2 * level * userlevel);


                                        // Prepare data to send to the backend to update the user's values
                                        const updateData = {
                                            username: username,
                                            value: updatedValue,
                                            networth: updatedNetworth
                                        };

                                        

                                        // Send the updated data to the backend
                                        fetch('http://samet-desktop.adm.huddinge.se:3000/update-ekonomi', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(updateData),
                                        })
                                        .then(response => response.json())
                                        .then(result => {
                                            if (result.success) {
                                                
                                            } else {
                                                
                                            }
                                        })
                                        .catch(error => console.error('Error updating ekonomi table:', error));
                                    } else {
                                        
                                    }

                                    
                                })

                                record.netvarde += 2 * level * userlevel;

                                finalLevel.textContent = level;
                                finalXP.textContent = 2 * level * userlevel; // Calculate XP
                                finalAP.textContent = 2 * level * userlevel;
                                totalTime.textContent = totalTimeElapsed; // Display total time
        
                                // Compare and update values if needed
                                const updatedData = {
                                    username: record.username,
                                    nivå: Math.max(record.nivå, currentGameData.nivå),
                                    level: Math.max(record.level, currentGameData.level),
                                    pengar_tjanat: Math.max(record.pengar_tjanat, currentGameData.pengar_tjanat),
                                    exp_tjanat: Math.max(record.exp_tjanat, currentGameData.exp_tjanat),
                                    tid: Math.min(record.tid, currentGameData.tid), // Opposite logic for tid
                                    netvarde: Math.max(record.netvarde, currentGameData.netvarde),
                                };
        
                                // Send updated data to the backend
                                return fetch('http://samet-desktop.adm.huddinge.se:3000/update-memory', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(updatedData),
                                })
                                    .then(response => response.json())
                                    .then(result => {
                                        // Show popup after successful update
                                        popup.classList.add('visible');
                                        overlay.classList.add('visible');
                                    });
                            })();


                        }
                    }
    
                    // If the user does not exist, check poangssystem for a match
                    if (!userExists) {
                        // Make the function asynchronous
                        (async () => {
                            let userlevel;
                            let usernetworth;
                    
                            try {
                                // Fetch data from the poängssystem endpoint
                                const poangssystemResponse = await fetch('http://samet-desktop.adm.huddinge.se:3000/poangssystem');
                                const poangssystemData = await poangssystemResponse.json();
                    
                                // Look for a match in the 'Namn' column
                                const matchedPoangssystemUser = poangssystemData.find(user => user.Namn === username);
                                
                                if (matchedPoangssystemUser) {
                                    userlevel = matchedPoangssystemUser.Levels;
                                } else {
                                    console.log("User not found in poängssystem.");
                                }
                    
                                // Fetch data from the ekonomi endpoint
                                const ekonomiResponse = await fetch('http://samet-desktop.adm.huddinge.se:3000/ekonomi');
                                const ekonomiData = await ekonomiResponse.json();
                    
                                // Look for a match in the 'username' column
                                const matchedEkonomiUser = ekonomiData.find(user => user.username === username);
                                
                                if (matchedEkonomiUser) {
                                    usernetworth = matchedEkonomiUser.networth;
                                } else {
                                    console.log("User not found in ekonomi.");
                                }

                                finalLevel.textContent = level;
                                finalXP.textContent = 2 * level * userlevel; // Calculate XP
                                finalAP.textContent = 2 * level * userlevel;
                                totalTime.textContent = totalTimeElapsed; // Display total time

                                usernetworth += 2 * level * userlevel;

                    
                                // Prepare data for insertion
                                const dataToInsert = {
                                    username: username,
                                    level: level,
                                    userlevel: userlevel,
                                    usernetworth: usernetworth,
                                    pengar_tjanat: 2 * level * userlevel,
                                    exp_tjanat: 2 * level * userlevel,
                                    tid: totalTimeElapsed / level,
                                    netvarde: usernetworth, // Use the networth from ekonomi table
                                };

                                fetch('http://samet-desktop.adm.huddinge.se:3000/ekonomi')
                                .then(res => res.json())
                                .then(ekonomiResponse => {
                                    // Find the user in the ekonomi table based on username
                                    const matchedUser = ekonomiResponse.find(user => user.username === username);

                                    if (matchedUser) {
                                        // Add level * 10 to the existing value and networth
                                        const updatedValue = matchedUser.value + (2 * level * userlevel);
                                        const updatedNetworth = matchedUser.networth + (2 * level * userlevel);

                                        // Prepare data to send to the backend to update the user's values
                                        const updateData = {
                                            username: username,
                                            value: updatedValue,
                                            networth: updatedNetworth
                                        };

                                        // Send the updated data to the backend
                                        fetch('http://samet-desktop.adm.huddinge.se:3000/update-ekonomi', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(updateData),
                                        })
                                        .then(response => response.json())
                                        .then(result => {
                                            if (result.success) {
                                                
                                            } else {
                                                
                                            }
                                        })
                                        .catch(error => console.error('Error updating ekonomi table:', error));
                                    } else {
                                        
                                    }
                                })
                    
                                // Send the data to the backend to insert into the Spel database
                                const insertResponse = await fetch('http://samet-desktop.adm.huddinge.se:3000/insert-memory', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(dataToInsert),
                                });
                    
                                const insertResult = await insertResponse.json();
                    
                                if (insertResult.success) {
                                    popup.classList.add('visible');
                                    overlay.classList.add('visible');
                                } else {
                                    
                                }
                    
                                // Log the final data (for debugging purposes)
                            } catch (error) {
                                console.error('Error fetching data:', error);
                            }
                        })(); // Invoke the async function immediately
                    }
                    
                })
                .catch(error => console.error('Error:', error));
        } else {
            popup.classList.add('visible');
            overlay.classList.add('visible');
        }
    }
    
    
    function closePopup() {
        popup.classList.remove('visible');
        overlay.classList.remove('visible');
        location.reload(); // Reload the game
    }
    
} else if (currentPhpFile === "spel2.php") {
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
} else if (currentPhpFile === "spel3.php") {
    const gridContainer = document.getElementById('grid-container');
const levelInfo = document.getElementById('level-info');
const timerDisplay = document.getElementById('timer');
const attemptsDisplay = document.getElementById('attempts');
const startButton = document.getElementById('start-button');
const gameOverPopup = document.getElementById('game-over-popup');
const popupCloseButton = document.getElementById('popup-close');
const popupOverlay = document.getElementById('popup-overlay');
const username = phpFileInfoElement.dataset.username;

let level = 1;
let attempts = 3;
let timer = 10;
let timerInterval;
let startTime; // To track time played for the current level
let totalTimePlayed = 0; // Total time played across all levels
let targetBoxIndex = null;
let colorDifference = 50; // Starting difference in RGB values
let originalColors = []; // Store original colors of boxes
let gameStarted = false; // Flag to check if the game has started

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
        box.style.pointerEvents = ''; // Reset interaction
        box.classList.remove('disabled'); // Reset disabled state
        box.addEventListener('click', () => handleBoxClick(box, i));
        gridContainer.appendChild(box);
    }
}

function startGame() {
    gameStarted = true; // Game starts
    levelInfo.style.display = 'block';
    document.getElementById('info-container').style.display = 'block';
    startButton.style.display = 'none';

    levelInfo.textContent = `Level: ${level}`;
    attempts = 3;
    attemptsDisplay.textContent = `Attempts: ${attempts}`;
    timer = 10 + (level - 1) * 5;
    timerDisplay.textContent = `Time Left: ${timer}s`;

    startTime = Date.now(); // Reset start time for the current level

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
            handleGameOver();
        }
    }, 1000);
}

function handleBoxClick(box, index) {
    if (!gameStarted || box.classList.contains('clicked')) return; // Ignore clicks if game hasn't started or box is already clicked

    if (index === targetBoxIndex) {
        box.style.backgroundColor = 'green';
        box.style.transform = 'scale(1.2)';
        box.classList.add('clicked'); // Mark the box as clicked
        clearInterval(timerInterval);

        // Disable all other boxes immediately
        const boxes = document.querySelectorAll('.grid-box');
        boxes.forEach((b) => {
            b.classList.add('disabled');
            b.style.pointerEvents = 'none'; // Disable interaction
        });

        // Add the time played in the current level to totalTimePlayed
        totalTimePlayed += (Date.now() - startTime) / 1000;

        setTimeout(() => {
            level++;
            colorDifference = Math.max(5, colorDifference - 5);
            createGrid();
            startGame();
        }, 1000);
    } else {
        box.style.backgroundColor = 'red';
        box.style.transform = 'scale(1.2)';
        box.classList.add('clicked'); // Mark the box as clicked
        attempts--;
        attemptsDisplay.textContent = `Attempts: ${attempts}`;

        setTimeout(() => {
            box.style.transform = 'scale(1)';
            box.style.backgroundColor = originalColors[index]; // Revert to original color
            box.classList.remove('clicked'); // Allow the box to be clicked again if the game continues
        }, 500);

        if (attempts <= 0) {
            handleGameOver();
        }
    }
}

function handleGameOver() {
    if (username != "guest") {
        gameStarted = false; // Stop the game
        clearInterval(timerInterval);
        

        // Add the time played in the current level to totalTimePlayed
        totalTimePlayed += Math.floor(Date.now() - startTime) / 1000;

        function getUserLevel(username) {
            return fetch('http://samet-desktop.adm.huddinge.se:3000/poangssystem') // Ensure the correct URL
                .then(response => response.json()) // Convert the response to JSON
                .then(data => {
                    // Loop through the data and find the match for level
                    for (const user of data) {
                        if (user.Namn === username) {
                            return user.Levels; // Return the level when found
                        }
                    }
                    // If no match is found
                    return 'User not found';
                })
                .catch(error => {
                    console.error('Error fetching level data:', error); // Handle any errors
                    return null; // Return null in case of error
                });
        }

        function getUserNetWorth(username) {
            return fetch('http://samet-desktop.adm.huddinge.se:3000/netvarde') // Ensure the correct URL
                .then(response => response.json()) // Convert the response to JSON
                .then(data => {
                    // Loop through the data and find the match for networth
                    for (const user of data) {
                        if (user.username === username) { // Match with 'username' column
                            return user.networth; // Return the networth when found
                        }
                    }
                    // If no match is found
                    return 'Networth not found';
                })
                .catch(error => {
                    console.error('Error fetching networth data:', error); // Handle any errors
                    return null; // Return null in case of error
                });
        }

        // Function to get both user level and networth in parallel
        function getUserData(username) {
            // Fetch level and net worth in parallel using Promise.all
            Promise.all([getUserLevel(username), getUserNetWorth(username)])
                .then(([userlevel, userNetWorth]) => {
                    if (userlevel !== null && userlevel !== undefined && userNetWorth !== null && userNetWorth !== undefined) {
                        const experience = 2 * level * userlevel;
                        const money = 2 * level * userlevel;
                        let averagetime = totalTimePlayed / level; // Use totalTimePlayed for average time calculation
        
                        document.getElementById('popup-level').textContent = `Level: ${level}`;
                        document.getElementById('popup-time').textContent = `Total Time Played: ${totalTimePlayed}s`; // Display total time played
                        document.getElementById('popup-exp').textContent = `Experience Gained: ${experience}`;
                        document.getElementById('popup-money').textContent = `Money Gained: ${money}`;
                        document.getElementById('popup-networth').textContent = `Networth: ${userNetWorth}`; // Display net worth
        
                        // Update user stats in the API
                        fetch('http://samet-desktop.adm.huddinge.se:3000/updateUserStats', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                username,
                                level,
                                userlevel,
                                averagetime,
                                money,
                                experience,
                                userNetWorth
                            })
                        })
                            .then(response => response.json())
                            .then(data => console.log('User stats updated:', data))
                            .catch(error => console.error('Error updating user stats:', error));
        
                        // Update ekonomi database
                        fetch('http://samet-desktop.adm.huddinge.se:3000/updateEkonomi', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                username,
                                moneyToAdd: money,
                                netWorthToAdd: money // Assuming net worth increases by the same money value
                            })
                        })
                            .then(response => response.json())
                            .then(data => console.log('Ekonomi updated:', data))
                            .catch(error => console.error('Error updating ekonomi:', error));
        
                        // Update användarinformation database
                        console.log(experience);
                        fetch('http://samet-desktop.adm.huddinge.se:3000/updateAnvandarinformation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                username,
                                expToAdd: experience
                            })
                        })
                            .then(response => response.json())
                            .then(data => console.log('Experience updated:', data))
                            .catch(error => console.error('Error updating experience:', error));
                    }
                })
                .catch(error => {
                    console.error('Error getting user data:', error);
                });
        }
        

        // Example usage
        getUserData(username);

        // Show the popup
        popupOverlay.style.display = 'block';

        // Add a slight delay before setting the animation state for smoothness
        setTimeout(() => {
            gameOverPopup.style.opacity = '1';
            gameOverPopup.style.animation = 'fall-down 1s cubic-bezier(0.25, 1, 0.5, 1)';
        }, 100);
    } else if (username == "guest") {
        gameStarted = false; // Stop the game
        clearInterval(timerInterval);

        // Add the time played in the current level to totalTimePlayed
        totalTimePlayed += Math.floor((Date.now() - startTime) / 1000);

        // Update popup content
        document.getElementById('popup-level').textContent = `Level: ${level}`;
        document.getElementById('popup-time').textContent = `Total Time Played: ${totalTimePlayed}s`; // Display total time played

        // Show the popup
        popupOverlay.style.display = 'block';

        // Add a slight delay before setting the animation state for smoothness
        setTimeout(() => {
            gameOverPopup.style.opacity = '1';
            gameOverPopup.style.animation = 'fall-down 1s cubic-bezier(0.25, 1, 0.5, 1)';
        }, 100);
    }
}

// Close the popup
function closePopup() {
    popupOverlay.style.display = 'none';
    location.reload(); // Refresh the page to restart the game
}

// Initialize grid and attach event listeners
createGrid();
startButton.addEventListener('click', startGame);
popupCloseButton.addEventListener('click', closePopup);
popupOverlay.addEventListener('click', (e) => {
    if (e.target === popupOverlay) closePopup(); // Close popup on outside click
});


    } else if (currentPhpFile === "spel4.php") {
        class MazeBuilder {

            // Original JavaScript code by Chirp Internet: www.chirpinternet.eu
            // Please acknowledge use of this code by including this header.
        
            constructor(width, height) {
        
            this.width = width;
            this.height = height;
        
            this.cols = 2 * this.width + 1;
            this.rows = 2 * this.height + 1;
        
            this.maze = this.initArray([]);
        
            /* place initial walls */
        
            this.maze.forEach((row, r) => {
                row.forEach((cell, c) => {
                switch(r)
                {
                    case 0:
                    case this.rows - 1:
                    this.maze[r][c] = ["wall"];
                    break;
        
                    default:
                    if((r % 2) == 1) {
                        if((c == 0) || (c == this.cols - 1)) {
                        this.maze[r][c] = ["wall"];
                        }
                    } else if(c % 2 == 0) {
                        this.maze[r][c] = ["wall"];
                    }
        
                }
                });
        
                if(r == 0) {
                /* place exit in top row */
                let doorPos = this.posToSpace(this.rand(1, this.width));
                this.maze[r][doorPos] = ["door", "exit"];
                }
        
                if(r == this.rows - 1) {
                /* place entrance in bottom row */
                let doorPos = this.posToSpace(this.rand(1, this.width));
                this.maze[r][doorPos] = ["door", "entrance"];
                }
        
            });
        
            /* start partitioning */
        
            this.partition(1, this.height - 1, 1, this.width - 1);
        
            }
        
            initArray(value) {
            return new Array(this.rows).fill().map(() => new Array(this.cols).fill(value));
            }
        
            rand(min, max) {
            return min + Math.floor(Math.random() * (1 + max - min));
            }
        
            posToSpace(x) {
            return 2 * (x-1) + 1;
            }
        
            posToWall(x) {
            return 2 * x;
            }
        
            inBounds(r, c) {
            if((typeof this.maze[r] == "undefined") || (typeof this.maze[r][c] == "undefined")) {
                return false; /* out of bounds */
            }
            return true;
            }
        
            shuffle(array) {
            /* sauce: https://stackoverflow.com/a/12646864 */
            for(let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
            }
        
            partition(r1, r2, c1, c2) {
                /* create partition walls
                   ref: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method */
            
                let horiz, vert, x, y, start, end;
            
                if ((r2 < r1) || (c2 < c1)) {
                    return false;
                }
            
                if (r1 == r2) {
                    horiz = r1;
                } else {
                    x = r1 + 1;
                    y = r2 - 1;
                    start = Math.round(x + (y - x) / 4);
                    end = Math.round(x + 3 * (y - x) / 4);
                    horiz = this.rand(start, end);
                }
            
                if (c1 == c2) {
                    vert = c1;
                } else {
                    x = c1 + 1;
                    y = c2 - 1;
                    start = Math.round(x + (y - x) / 3);
                    end = Math.round(x + 2 * (y - x) / 3);
                    vert = this.rand(start, end);
                }
            
                for (let i = this.posToWall(r1) - 1; i <= this.posToWall(r2) + 1; i++) {
                    for (let j = this.posToWall(c1) - 1; j <= this.posToWall(c2) + 1; j++) {
                        if ((i == this.posToWall(horiz)) || (j == this.posToWall(vert))) {
                            this.maze[i][j] = ["wall"];
                        }
                    }
                }
            
                // Create gaps in the partition walls to allow multiple paths
                let primaryGaps = this.shuffle([true, true, true, false]); // Ensure one primary gap per partition
                let extraGaps = this.shuffle([true, false, false, false]); // Additional gaps to create more paths
            
                const createGap = (row, col) => {
                    if (this.inBounds(row, col) && this.maze[row][col].includes("wall")) {
                        this.maze[row][col] = []; // Remove the wall to create a path
                    }
                };
            
                if (primaryGaps[0]) createGap(this.posToWall(horiz), this.posToSpace(this.rand(c1, vert)));
                if (primaryGaps[1]) createGap(this.posToWall(horiz), this.posToSpace(this.rand(vert + 1, c2 + 1)));
                if (primaryGaps[2]) createGap(this.posToSpace(this.rand(r1, horiz)), this.posToWall(vert));
                if (primaryGaps[3]) createGap(this.posToSpace(this.rand(horiz + 1, r2 + 1)), this.posToWall(vert));
            
                if (extraGaps[0]) createGap(this.posToWall(horiz), this.posToSpace(this.rand(c1, vert)));
                if (extraGaps[1]) createGap(this.posToWall(horiz), this.posToSpace(this.rand(vert + 1, c2 + 1)));
                if (extraGaps[2]) createGap(this.posToSpace(this.rand(r1, horiz)), this.posToWall(vert));
                if (extraGaps[3]) createGap(this.posToSpace(this.rand(horiz + 1, r2 + 1)), this.posToWall(vert));
            
                // Recursively partition newly created chambers
                this.partition(r1, horiz - 1, c1, vert - 1);
                this.partition(horiz + 1, r2, c1, vert - 1);
                this.partition(r1, horiz - 1, vert + 1, c2);
                this.partition(horiz + 1, r2, vert + 1, c2);
            }
        
            isGap(...cells) {
            return cells.every((array) => {
                let row, col;
                [row, col] = array;
                if(this.maze[row][col].length > 0) {
                if(!this.maze[row][col].includes("door")) {
                    return false;
                }
                }
                return true;
            });
            }
        
            countSteps(array, r, c, val, stop) {
        
            if(!this.inBounds(r, c)) {
                return false; /* out of bounds */
            }
        
            if(array[r][c] <= val) {
                return false; /* shorter route already mapped */
            }
        
            if(!this.isGap([r, c])) {
                return false; /* not traversable */
            }
        
            array[r][c] = val;
        
            if(this.maze[r][c].includes(stop)) {
                return true; /* reached destination */
            }
        
            this.countSteps(array, r-1, c, val+1, stop);
            this.countSteps(array, r, c+1, val+1, stop);
            this.countSteps(array, r+1, c, val+1, stop);
            this.countSteps(array, r, c-1, val+1, stop);
        
            }
        
            getKeyLocation() {
        
            let fromEntrance = this.initArray();
            let fromExit = this.initArray();
        
            this.totalSteps = -1;
        
            for(let j = 1; j < this.cols-1; j++) {
                if(this.maze[this.rows-1][j].includes("entrance")) {
                this.countSteps(fromEntrance, this.rows-1, j, 0, "exit");
                }
                if(this.maze[0][j].includes("exit")) {
                this.countSteps(fromExit, 0, j, 0, "entrance");
                }
            }
        
            let fc = -1, fr = -1;
        
            this.maze.forEach((row, r) => {
                row.forEach((cell, c) => {
                if(typeof fromEntrance[r][c] == "undefined") {
                    return;
                }
                let stepCount = fromEntrance[r][c] + fromExit[r][c];
                if(stepCount > this.totalSteps) {
                    fr = r;
                    fc = c;
                    this.totalSteps = stepCount;
                }
                });
            });
        
            return [fr, fc];
            }
        
            placeKey() {
        
            let fr, fc;
            [fr, fc] = this.getKeyLocation();
        
            this.maze[fr][fc] = ["key"];
        
            }
        
            display(id) {
        
            this.parentDiv = document.getElementById(id);
        
            if(!this.parentDiv) {
                alert("Cannot initialise maze - no element found with id \"" + id + "\"");
                return false;
            }
        
            while(this.parentDiv.firstChild) {
                this.parentDiv.removeChild(this.parentDiv.firstChild);
            }
        
            const container = document.createElement("div");
            container.id = "maze";
            container.dataset.steps = this.totalSteps;
        
            this.maze.forEach((row) => {
                let rowDiv = document.createElement("div");
                row.forEach((cell) => {
                let cellDiv = document.createElement("div");
                if(cell) {
                    cellDiv.className = cell.join(" ");
                }
                rowDiv.appendChild(cellDiv);
                });
                container.appendChild(rowDiv);
            });
        
            this.parentDiv.appendChild(container);
        
            return true;
            }
        
        }
        
        class Player {
            constructor(maze) {
                this.maze = maze;
                this.position = { row: maze.rows - 2, col: maze.cols - 2 }; // Start near the entrance
                this.hasKey = false;
            }
        
            init() {
                document.addEventListener("keydown", (e) => this.move(e));
                this.updatePlayerPosition();
            }
        
            move(event) {
                let { row, col } = this.position;
        
                switch (event.key) {
                    case "ArrowUp":
                        row -= 1;
                        break;
                    case "ArrowDown":
                        row += 1;
                        break;
                    case "ArrowLeft":
                        col -= 1;
                        break;
                    case "ArrowRight":
                        col += 1;
                        break;
                    default:
                        return;
                }
        
                if (this.canMoveTo(row, col)) {
                    this.position = { row, col };
                    this.checkInteraction();
                    this.updatePlayerPosition();
                }
            }
        
            canMoveTo(row, col) {
                return (
                    row >= 0 &&
                    row < this.maze.rows &&
                    col >= 0 &&
                    col < this.maze.cols &&
                    !this.maze.maze[row][col].includes("wall")
                );
            }
        
            generateNewMaze() {
                let width = 40; // Random width (min: 4)
                let height = 24; // Random height (min: 4)
                const newMaze = new MazeBuilder(width, height); // Create a new maze
                newMaze.placeKey(); // Place the key in the new maze
                newMaze.display("maze_container"); // Display the new maze
            
                this.maze = newMaze; // Update the player's maze reference
                this.position = { row: newMaze.rows - 2, col: newMaze.cols - 2 }; // Reset player position
                this.hasKey = false; // Reset the key
                this.updatePlayerPosition(); // Update the player position in the UI
            
                // Reinitialize the monster with the new maze
                monster.maze = newMaze; // Update the monster's maze reference
                monster.position = { row: 1, col: 1 }; // Reset monster position (example starting point)
                monster.startMovement(); // Restart the monster's movement behavior
            }
            
        
            checkInteraction() {
                const cell = this.maze.maze[this.position.row][this.position.col];
                if (cell.includes("key")) {
                    this.pickUpKey();
                } else if (cell.includes("exit") && this.hasKey) {
                    this.generateNewMaze(); // Call a method to create a new maze
                }
            }
            
        
            pickUpKey() {
                this.hasKey = true;
        
                // Remove key from maze data
                this.maze.maze[this.position.row][this.position.col] = [];
        
                // Update the DOM
                const currentCell = document
                    .getElementById("maze")
                    .children[this.position.row]
                    .children[this.position.col];
                currentCell.classList.remove("key");
        
                // Update UI for key possession
                document.getElementById("maze_score").classList.add("has-key");
                alert("You picked up the key!");
            }
        
            updatePlayerPosition() {
                document.querySelectorAll(".hero").forEach((el) => el.classList.remove("hero"));
                const currentCell = document
                    .getElementById("maze")
                    .children[this.position.row]
                    .children[this.position.col];
                currentCell.classList.add("hero");
            }
        }

        class Monster {
            constructor(maze) {
                this.maze = maze;
                this.position = { row: 1, col: 1 }; // Start near the entrance
            }
        
            init() {
                this.updateMonsterPosition();
                this.startHunting();
            }
        
            canMoveTo(row, col) {
                return (
                    row >= 0 &&
                    row < this.maze.rows &&
                    col >= 0 &&
                    col < this.maze.cols &&
                    !this.maze.maze[row][col].includes("wall")
                );
            }
        
            findShortestPath(targetRow, targetCol) {
                const directions = [
                    { row: -1, col: 0 }, // Up
                    { row: 1, col: 0 },  // Down
                    { row: 0, col: -1 }, // Left
                    { row: 0, col: 1 },  // Right
                ];
        
                const queue = [{ row: this.position.row, col: this.position.col, path: [] }];
                const visited = Array.from({ length: this.maze.rows }, () => Array(this.maze.cols).fill(false));
                visited[this.position.row][this.position.col] = true;
        
                while (queue.length > 0) {
                    const { row, col, path } = queue.shift();
        
                    if (row === targetRow && col === targetCol) {
                        return path;
                    }
        
                    for (const direction of directions) {
                        const newRow = row + direction.row;
                        const newCol = col + direction.col;
        
                        if (this.canMoveTo(newRow, newCol) && !visited[newRow][newCol]) {
                            visited[newRow][newCol] = true;
                            queue.push({ row: newRow, col: newCol, path: [...path, direction] });
                        }
                    }
                }
        
                return []; // No path found
            }
        
            moveTowardsPlayer() {
                const path = this.findShortestPath(player.position.row, player.position.col);
                if (path.length > 0) {
                    const nextMove = path[0];
                    this.position.row += nextMove.row;
                    this.position.col += nextMove.col;
                    this.updateMonsterPosition();
                    this.checkCollision();
                }
            }
        
            startHunting() {
                setInterval(() => this.moveTowardsPlayer(), 500); // Move every 0.5 seconds
            }
        
            updateMonsterPosition() {
                document.querySelectorAll(".monster").forEach((el) => el.classList.remove("monster"));
                const currentCell = document
                    .getElementById("maze")
                    .children[this.position.row]
                    .children[this.position.col];
                currentCell.classList.add("monster");
            }
        
            checkCollision() {
                const { row, col } = this.position;
                if (row === player.position.row && col === player.position.col) {
                    alert("You were caught by the monster! Generating a new maze...");
                    this.restartGame();
                }
            }
        
            restartGame() {
                player.generateNewMaze();
                this.position = { row: 1, col: 1 }; // Reset monster position
                this.updateMonsterPosition();
            }
        }

        let Maze = new MazeBuilder(40,24);
        Maze.placeKey();
        Maze.display("maze_container");

        // Initialize the player
        let player = new Player(Maze);
        player.init();

        let monster = new Monster(Maze);
        monster.init();

        document.addEventListener("DOMContentLoaded", () => {
        const startButton = document.getElementById("start_button");
        const menuButton = document.getElementById("menu_button");
        const startPage = document.getElementById("start_page");
        const mazeContainer = document.getElementById("maze_container");

        // Restore state from localStoragez
        const currentState = localStorage.getItem("currentState");

        if (currentState === "maze") {
            startPage.style.display = "none";
            mazeContainer.style.display = "block";
        } else {
            startPage.style.display = "block";
            mazeContainer.style.display = "none";
            startPage.style.display = "flex";
            startPage.style.justifyContent = "center";
            startPage.style.alignItems = "center";
            startPage.style.height = "100vh"; // Ensure full viewport height
        }

        // Start button event
        startButton.addEventListener("click", () => {
            startPage.style.display = "none";
            mazeContainer.style.display = "block";
            localStorage.setItem("currentState", "maze"); // Save the current state
        });

        // Menu button event
        menuButton.addEventListener("click", () => {
            startPage.style.display = "block";
            mazeContainer.style.display = "none";
            startPage.style.display = "flex";
            startPage.style.justifyContent = "center";
            startPage.style.alignItems = "center";
            startPage.style.height = "100vh"; // Ensure full viewport height
            localStorage.setItem("currentState", "start"); // Save the current state
        });
    });

        
} else if (currentPhpFile === "topplista.php") {
    document.addEventListener("DOMContentLoaded", function () {
        const modes = [
            { text: "Memory - Topplista", tileTexts: ["Nivå", "Level", "Tid/Level", "Pengar tjänat i spel", "EXP tjänat i spel", "Netvärde"] },
            { text: "Squigglegolf - Topplista", tileTexts: ["Mängden slag", "Level", "Total tid", "Pengar tjänat i spel", "EXP tjänat i spel", "Netvärde"] },
            { text: "Colourvision - Topplista", tileTexts: ["Nivå", "Level", "Tid/Level", "Pengar tjänat i spel", "EXP tjänat i spel", "Netvärde"] },
            { text: "Maze Runner - Topplista", tileTexts: ["Maze 1", "Maze 2", "Maze 3", "Maze 4", "Maze 5", "Maze 6"] },
            { text: "Biljard - Topplista", tileTexts: ["Biljard 1", "Biljard 2", "Biljard 3", "Biljard 4", "Biljard 5", "Biljard 6"] },
        ];
    
        let currentMode = 0;
        const leftButton = document.getElementById("left-button");
        const rightButton = document.getElementById("right-button");
        const leaderboardText = document.getElementById("leaderboard-text");
        const tiles = document.querySelectorAll(".leaderboard-tile");
        
    
        function updateMode(userCounts, memoryData, levelsData, tidData, pengarData, expData, netvardeData) {
            leaderboardText.textContent = modes[currentMode].text;
    
            tiles.forEach((tile, index) => {
                tile.innerHTML = "";  // Clear previous content
    
                const container = document.createElement("div");
                container.style.display = "flex";
                container.style.flexDirection = "column";
                container.style.alignItems = "center";
                container.style.height = "100%";
                container.style.width = "100%";
    
                const outerText = document.createElement("div");
                outerText.textContent = modes[currentMode].tileTexts[index];
                outerText.style.textAlign = "center";
                outerText.style.marginBottom = "10px";
                outerText.style.fontWeight = "bold";
                container.appendChild(outerText);
    
                const innerTile = document.createElement("div");
                innerTile.classList.add("inner-tile");
                innerTile.style.backgroundColor = "rgba(22, 20, 20, 0.7)";
                innerTile.style.color = "white";
                innerTile.style.padding = "10px";
                innerTile.style.height = "85%";
                innerTile.style.width = "90%";
                innerTile.style.overflowY = "auto";
                innerTile.style.maxHeight = "100%";
                innerTile.style.borderRadius = "5px";
                innerTile.style.display = "flex";
                innerTile.style.flexDirection = "column";
                innerTile.style.justifyContent = "flex-start";
    
                if (index === 0 && modes[currentMode].text === "Memory - Topplista") {
                    // Display the Memory - Topplista in the first tile (memoryData)
                    innerTile.innerHTML = "";
                    memoryData.sort((a, b) => b.nivå - a.nivå).forEach((row, rank) => {
                        const div = document.createElement("div");
                        div.style.display = "flex";
                        div.style.justifyContent = "space-between";
                        div.style.margin = "5px 0";
                        div.style.padding = "10px";
                        div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        div.style.borderRadius = "3px";
                
                        const leftSpan = document.createElement("span");
                        leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                        leftSpan.style.flex = "1";
                        leftSpan.style.textAlign = "left";
                
                        const rightSpan = document.createElement("span");
                        rightSpan.textContent = `${row.nivå}`;
                        rightSpan.style.flex = "0";
                        rightSpan.style.textAlign = "right";
                
                        div.appendChild(leftSpan);
                        div.appendChild(rightSpan);
                        innerTile.appendChild(div);
                    });
                }
                
                  else if (index === 1 && modes[currentMode].text === "Memory - Topplista") {
                    // Display Memory levels in the second tile (levelsData)
                    innerTile.innerHTML = "";
                    levelsData.sort((a, b) => b.level - a.level).forEach((row, rank) => {
                        const div = document.createElement("div");
                        div.style.display = "flex";
                        div.style.justifyContent = "space-between";
                        div.style.margin = "5px 0";
                        div.style.padding = "10px";
                        div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        div.style.borderRadius = "3px";
    
                        const leftSpan = document.createElement("span");
                        leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                        leftSpan.style.flex = "1";
                        leftSpan.style.textAlign = "left";
    
                        const rightSpan = document.createElement("span");
                        rightSpan.textContent = `${row.level}`;
                        rightSpan.style.flex = "0";
                        rightSpan.style.textAlign = "right";
    
                        div.appendChild(leftSpan);
                        div.appendChild(rightSpan);
                        innerTile.appendChild(div);
                    });
                } else if (index === 2 && modes[currentMode].text === "Memory - Topplista") {
                    // Display Memory time (Tid) in the third tile (tidData)
                    innerTile.innerHTML = "";
                    tidData.sort((a, b) => a.tid - b.tid).forEach((row, rank) => {
                        const div = document.createElement("div");
                        div.style.display = "flex";
                        div.style.justifyContent = "space-between";
                        div.style.margin = "5px 0";
                        div.style.padding = "10px";
                        div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        div.style.borderRadius = "3px";
    
                        const leftSpan = document.createElement("span");
                        leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                        leftSpan.style.flex = "1";
                        leftSpan.style.textAlign = "left";
    
                        const rightSpan = document.createElement("span");
                        rightSpan.textContent = `${row.tid}`;
                        rightSpan.style.flex = "0";
                        rightSpan.style.textAlign = "right";
    
                        div.appendChild(leftSpan);
                        div.appendChild(rightSpan);
                        innerTile.appendChild(div);
                    });
                } else if (index === 3 && modes[currentMode].text === "Memory - Topplista") {
                    // Display Pengar (Money) in the fourth tile (pengarData)
                    innerTile.innerHTML = "";
                    pengarData.sort((a, b) => b.pengar_tjanat - a.pengar_tjanat).forEach((row, rank) => {
                        const div = document.createElement("div");
                        div.style.display = "flex";
                        div.style.justifyContent = "space-between";
                        div.style.margin = "5px 0";
                        div.style.padding = "10px";
                        div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        div.style.borderRadius = "3px";
    
                        const leftSpan = document.createElement("span");
                        leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                        leftSpan.style.flex = "1";
                        leftSpan.style.textAlign = "left";
    
                        const rightSpan = document.createElement("span");
                        rightSpan.textContent = `${row.pengar_tjanat}`;
                        rightSpan.style.flex = "0";
                        rightSpan.style.textAlign = "right";
    
                        div.appendChild(leftSpan);
                        div.appendChild(rightSpan);
                        innerTile.appendChild(div);
                    });
                } else if (index === 4 && modes[currentMode].text === "Memory - Topplista") {
                    // Display EXP in the fifth tile (expData)
                    innerTile.innerHTML = "";
                    expData.sort((a, b) => b.exp_tjanat - a.exp_tjanat).forEach((row, rank) => {
                        const div = document.createElement("div");
                        div.style.display = "flex";
                        div.style.justifyContent = "space-between";
                        div.style.margin = "5px 0";
                        div.style.padding = "10px";
                        div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        div.style.borderRadius = "3px";
    
                        const leftSpan = document.createElement("span");
                        leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                        leftSpan.style.flex = "1";
                        leftSpan.style.textAlign = "left";
    
                        const rightSpan = document.createElement("span");
                        rightSpan.textContent = `${row.exp_tjanat}`;
                        rightSpan.style.flex = "0";
                        rightSpan.style.textAlign = "right";
    
                        div.appendChild(leftSpan);
                        div.appendChild(rightSpan);
                        innerTile.appendChild(div);
                    });
                } else if (index === 5 && modes[currentMode].text === "Memory - Topplista") {
                    // Display Netvärde in the sixth tile (netvardeData)
                    innerTile.innerHTML = "";
                    netvardeData.sort((a, b) => b.netvarde - a.netvarde).forEach((row, rank) => {
                        const div = document.createElement("div");
                        div.style.display = "flex";
                        div.style.justifyContent = "space-between";
                        div.style.margin = "5px 0";
                        div.style.padding = "10px";
                        div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        div.style.borderRadius = "3px";
    
                        const leftSpan = document.createElement("span");
                        leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                        leftSpan.style.flex = "1";
                        leftSpan.style.textAlign = "left";
    
                        const rightSpan = document.createElement("span");
                        rightSpan.textContent = `${row.netvarde}`;
                        rightSpan.style.flex = "0";
                        rightSpan.style.textAlign = "right";
    
                        div.appendChild(leftSpan);
                        div.appendChild(rightSpan);
                        innerTile.appendChild(div);
                    });
                } else if (modes[currentMode].text === "Squigglegolf - Topplista") {
                    const endpoint = "http://samet-desktop.adm.huddinge.se:3000/squigglegolf";
                
                    fetch(endpoint)
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error("Failed to fetch squigglegolf data");
                            }
                            return response.json();
                        })
                        .then((squigglegolfData) => {
                            tiles.forEach((tile, index) => {
                                tile.innerHTML = ""; // Clear previous content
                                
                                const container = document.createElement("div");
                                container.style.display = "flex";
                                container.style.flexDirection = "column";
                                container.style.alignItems = "center";
                                container.style.height = "100%";
                                container.style.width = "100%";
                
                                const outerText = document.createElement("div");
                                outerText.textContent = modes[currentMode].tileTexts[index];
                                outerText.style.textAlign = "center";
                                outerText.style.marginBottom = "10px";
                                outerText.style.fontWeight = "bold";
                                container.appendChild(outerText);
                
                                const innerTile = document.createElement("div");
                                innerTile.classList.add("inner-tile");
                                innerTile.style.backgroundColor = "rgba(22, 20, 20, 0.7)";
                                innerTile.style.color = "white";
                                innerTile.style.padding = "10px";
                                innerTile.style.height = "85%";
                                innerTile.style.width = "90%";
                                innerTile.style.overflowY = "auto";
                                innerTile.style.maxHeight = "100%";
                                innerTile.style.borderRadius = "5px";
                                innerTile.style.display = "flex";
                                innerTile.style.flexDirection = "column";
                                innerTile.style.justifyContent = "flex-start";
                
                                // Sort and rank based on the current column
                                const columnKeys = ["slag", "level", "tid", "pengar_tjanat", "exp_tjanat", "netvarde"];
                                const columnKey = columnKeys[index];
                
                                // Adjust sorting order: Ascending for tile 1 (index 0) and tile 3 (index 2), Descending for others
                                const isAscending = index === 0 || index === 2; // Ascending for index 0 and 2
                                squigglegolfData.sort((a, b) => {
                                    return isAscending
                                        ? a[columnKey] - b[columnKey] // Ascending order
                                        : b[columnKey] - a[columnKey]; // Descending order
                                }).forEach((row, rank) => {
                                    const div = document.createElement("div");
                                    div.style.display = "flex";
                                    div.style.justifyContent = "space-between";
                                    div.style.margin = "5px 0";
                                    div.style.padding = "10px";
                                    div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                                    div.style.borderRadius = "3px";
                
                                    const leftSpan = document.createElement("span");
                                    leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                                    leftSpan.style.flex = "1";
                                    leftSpan.style.textAlign = "left";
                
                                    const rightSpan = document.createElement("span");
                                    rightSpan.textContent = `${row[columnKey]}`;
                                    rightSpan.style.flex = "0";
                                    rightSpan.style.textAlign = "right";
                
                                    div.appendChild(leftSpan);
                                    div.appendChild(rightSpan);
                                    innerTile.appendChild(div);
                                });
                
                                container.appendChild(innerTile);
                                tile.appendChild(container);
                            });
                        })
                        .catch((error) => {
                            console.error("Error fetching Squigglegolf data:", error);
                        });
                } else if (modes[currentMode].text === "Colourvision - Topplista") {
                    const endpoint = "http://samet-desktop.adm.huddinge.se:3000/colourvision";
                
                    fetch(endpoint)
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error("Failed to fetch Colourvision data");
                            }
                            return response.json();
                        })
                        .then((colourvisionData) => {
                            tiles.forEach((tile, index) => {
                                tile.innerHTML = ""; // Clear previous content
                                
                                const container = document.createElement("div");
                                container.style.display = "flex";
                                container.style.flexDirection = "column";
                                container.style.alignItems = "center";
                                container.style.height = "100%";
                                container.style.width = "100%";
                
                                const outerText = document.createElement("div");
                                outerText.textContent = modes[currentMode].tileTexts[index];
                                outerText.style.textAlign = "center";
                                outerText.style.marginBottom = "10px";
                                outerText.style.fontWeight = "bold";
                                container.appendChild(outerText);
                
                                const innerTile = document.createElement("div");
                                innerTile.classList.add("inner-tile");
                                innerTile.style.backgroundColor = "rgba(22, 20, 20, 0.7)";
                                innerTile.style.color = "white";
                                innerTile.style.padding = "10px";
                                innerTile.style.height = "85%";
                                innerTile.style.width = "90%";
                                innerTile.style.overflowY = "auto";
                                innerTile.style.maxHeight = "100%";
                                innerTile.style.borderRadius = "5px";
                                innerTile.style.display = "flex";
                                innerTile.style.flexDirection = "column";
                                innerTile.style.justifyContent = "flex-start";
                
                                // Sort and rank based on the current column
                                const columnKeys = ["nivå", "level", "tid", "pengar_tjanat", "exp_tjanat", "netvarde"];
                                const columnKey = columnKeys[index];
                
                                // Adjust sorting order: Ascending for tile 3 (index 2), Descending for others
                                const isAscending = index === 2; // Ascending for "tid"
                                colourvisionData
                                    .sort((a, b) => {
                                        return isAscending
                                            ? a[columnKey] - b[columnKey] // Ascending order
                                            : b[columnKey] - a[columnKey]; // Descending order
                                    })
                                    .forEach((row, rank) => {
                                        const div = document.createElement("div");
                                        div.style.display = "flex";
                                        div.style.justifyContent = "space-between";
                                        div.style.margin = "5px 0";
                                        div.style.padding = "10px";
                                        div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                                        div.style.borderRadius = "3px";
                
                                        const leftSpan = document.createElement("span");
                                        leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                                        leftSpan.style.flex = "1";
                                        leftSpan.style.textAlign = "left";
                
                                        const rightSpan = document.createElement("span");
                                        rightSpan.textContent = `${row[columnKey]}`;
                                        rightSpan.style.flex = "0";
                                        rightSpan.style.textAlign = "right";
                
                                        div.appendChild(leftSpan);
                                        div.appendChild(rightSpan);
                                        innerTile.appendChild(div);
                                    });
                
                                container.appendChild(innerTile);
                                tile.appendChild(container);
                            });
                        })
                        .catch((error) => {
                            console.error("Error fetching Colourvision data:", error);
                        });
                } else {
                    const numberOfDivs = userCounts[modes[currentMode].text.toLowerCase().split(" - ")[0]] || 0;
                    for (let i = 1; i <= numberOfDivs; i++) {
                        const div = document.createElement("div");
                        div.textContent = `Tile ${i}`;
                        div.style.textAlign = "center";
                        div.style.margin = "5px 0";
                        div.style.padding = "10px";
                        div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        div.style.borderRadius = "3px";
                        innerTile.appendChild(div);
                    }
                }
    
                container.appendChild(innerTile);
                tile.appendChild(container);
            });
    
            leftButton.disabled = currentMode === 0;
            rightButton.disabled = currentMode === modes.length - 1;
        }
    
        function fetchLeaderboardData() {
            Promise.all([
                fetch("http://samet-desktop.adm.huddinge.se:3000/user-counts").then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch user counts");
                    }
                    return response.json();
                }),
                fetch("http://samet-desktop.adm.huddinge.se:3000/memory/niva").then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch memory levels");
                    }
                    return response.json();
                }),
                fetch("http://samet-desktop.adm.huddinge.se:3000/memory/levels").then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch memory levels");
                    }
                    return response.json();
                }),
                fetch("http://samet-desktop.adm.huddinge.se:3000/memory/tid").then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch memory time");
                    }
                    return response.json();
                }),
                fetch("http://samet-desktop.adm.huddinge.se:3000/memory/pengar").then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch memory money data");
                    }
                    return response.json();
                }),
                fetch("http://samet-desktop.adm.huddinge.se:3000/memory/exp").then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch memory EXP data");
                    }
                    return response.json();
                }),
                
                fetch("http://samet-desktop.adm.huddinge.se:3000/memory/netvarde").then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch memory net worth data");
                    }
                    return response.json();
                })
                
            ])
            .then(([userCounts, memoryData, levelsData, tidData, pengarData, expData, netvardeData]) => {
                updateMode(userCounts, memoryData, levelsData, tidData, pengarData, expData, netvardeData);
            })
            .catch((error) => {
                console.error("Error fetching leaderboard data:", error);
            });
        }
    
        leftButton.addEventListener("click", () => {
            if (currentMode > 0) {
                currentMode--;
                fetchLeaderboardData();
            }
        });
    
        rightButton.addEventListener("click", () => {
            if (currentMode < modes.length - 1) {
                currentMode++;
                fetchLeaderboardData();
            }
        });
    
        fetchLeaderboardData();
    
        document.getElementById("logo").addEventListener("click", function () {
            redirect("index.php");
        });
    });
    
}
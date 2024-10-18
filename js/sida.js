function redirect(url) {
    window.location.href = url;
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

function gainExp(expAmount) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "sida.php", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            var currentExp = response.current_exp;
            var nextLevelExp = response.next_level_exp;
            var level = response.level;

            console.log(currentExp);
            console.log(nextLevelExp);
            console.log(level);

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
        }
    };

    // Send the request to the server with the EXP amount
    xhr.send("add_exp=true&exp_amount=" + expAmount);
}

function toggleProfile() {
    const profileSquare = document.getElementById('profileSquare');
    
    // Toggle the active class to show or hide the square
    if (profileSquare.classList.contains('active')) {
        closeProfile();
    } else {
        profileSquare.classList.add('active');
        profileSquare.style.display = 'block';
        
        // Timeout to allow animation to complete
        setTimeout(() => {
            profileSquare.style.opacity = '1';
            profileSquare.style.transform = 'translateY(10px)';
        }, 10);

        // Add event listener to detect clicks outside the square
        document.addEventListener('click', handleOutsideClick);
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
    
    if (!profileSquare.contains(event.target) && event.target !== searchProfileBtn) {
        closeProfile();
    }
}

function searchProfiles() {
    const searchInput = document.getElementById('searchInput').value.trim();

    // Clear the results if input is empty
    if (searchInput === '') {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }

    // Create an AJAX request
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'sida.php?search=' + encodeURIComponent(searchInput), true);

    xhr.onload = function() {
        if (xhr.status === 200) {
            const results = JSON.parse(xhr.responseText);
            const searchResultsContainer = document.getElementById('searchResults');

            // Clear previous results
            searchResultsContainer.innerHTML = '';

            if (results.length > 0) {
                results.forEach(function(username) {
                    const resultItem = document.createElement('div');
                    resultItem.classList.add('result-item');
                    resultItem.textContent = username;
                    searchResultsContainer.appendChild(resultItem);
                });
            } else {
                const noUserFound = document.createElement('div');
                noUserFound.classList.add('result-item');
                noUserFound.textContent = 'Inga användare';
                searchResultsContainer.appendChild(noUserFound);
            }
        }
    };

    xhr.send();
}
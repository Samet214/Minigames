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

document.getElementById('profilePic').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

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

function profile() {
    alert('Profile!');
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

alert('hey');

function searchProfiles() {
    const query = document.getElementById('searchInput').value;

    if (query.length > 0) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'search_profiles.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            if (this.status === 200) {
                document.getElementById('searchResults').innerHTML = this.responseText;
            }
        };
        xhr.send('query=' + encodeURIComponent(query));
    } else {
        document.getElementById('searchResults').innerHTML = ''; // Clear results when input is empty
    }
}

const profileImg = document.getElementById('profile-img');
const fileInput = document.getElementById('file-input');

profileImg.addEventListener('click', () => {
  fileInput.click(); // Simulate a click on the hidden file input
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      profileImg.src = e.target.result; // Update the profile picture

      // To ensure the image is cropped to fit the circle, make sure CSS `object-fit: cover` is applied
    };

    reader.readAsDataURL(file);
  }
});

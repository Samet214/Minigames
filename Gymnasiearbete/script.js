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

// Reusable function to add EXP
function gainExp(expAmount) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "sida.php", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            var currentExp = response.current_exp;
            var nextLevelExp = response.next_level_exp;
            var progressBar = document.getElementById('expProgress');
            var expText = document.getElementById('expText');
            
            // Update the EXP bar width
            progressBar.style.width = (currentExp / nextLevelExp) * 100 + '%';

            // Update the EXP text based on thresholds (K, M, G)

            if (nextLevelExp < 1000) {

            } else if (nextLevelExp > 1000 && nextLevelExp < 1000000) {
                nextLevelExp /= 1000;
                nextLevelExp += 'K';
            } else if (nextLevelExp > 1000000 && nextLevelExp < 1000000000) {
                nextLevelExp /= 1000000;
                nextLevelExp += 'M';
            } else if (nextLevelExp > 1000000000) {
                nextLevelExp /= 1000000000;
                nextLevelExp += 'G';
            }
            
            if (currentExp >= 1000 && currentExp < 1000000) {
                expText.textContent = (currentExp / 1000).toFixed(1) + 'K/' + nextLevelExp + ' EXP';
            } else if (currentExp >= 1000000 && currentExp < 1000000000) {
                expText.textContent = (currentExp / 1000000).toFixed(1) + 'M/' + nextLevelExp + ' EXP';
            } else if (currentExp >= 1000000000) {
                expText.textContent = (currentExp / 1000000000).toFixed(1) + 'G/' + nextLevelExp + ' EXP';
            } else if (currentExp < 1000) {
                expText.textContent = currentExp + '/' + nextLevelExp + ' EXP';
            }



            // Update the user's level
            document.getElementById('level').textContent = response.level;
        }
    };

    // Send the request to the server with the desired EXP amount
    xhr.send("add_exp=true&exp_amount=" + expAmount);
}

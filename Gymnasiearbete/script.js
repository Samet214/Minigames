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
            // Update the EXP bar and text with new values
            document.getElementById('expProgress').style.width = (response.current_exp / response.next_level_exp) * 100 + '%';
            document.getElementById('expText').textContent = response.current_exp + '/' + response.next_level_exp + ' EXP';
            document.getElementById('level').textContent = response.level;
        }
    };

    // Send the request to the server with the desired EXP amount
    xhr.send("add_exp=true&exp_amount=" + expAmount);
}
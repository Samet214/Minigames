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
function redirect(url) {
    window.location.href = url;
}

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

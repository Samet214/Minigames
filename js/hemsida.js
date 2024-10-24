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

document.getElementById("logo").addEventListener("click", function() {
    redirect('hemsida.php');
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

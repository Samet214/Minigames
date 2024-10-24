function redirect(url) {
    window.location.href = url;
}

document.addEventListener("DOMContentLoaded", function () {
    const infoSection = document.getElementById('signup-info');
    infoSection.style.opacity = 0;

    setTimeout(function () {
        infoSection.style.transition = 'opacity 1.5s ease-in-out';
        infoSection.style.opacity = 1;
    }, 200);
});

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

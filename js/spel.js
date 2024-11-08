function redirect(url) {
    window.location.href = url;
}

function openModal() {
    const overlay = document.getElementById("overlay");
    const modal = document.getElementById("modal");
    overlay.style.display = "block"; 
    overlay.style.animation = "fadeIn 1.5s ease-out forwards"; 
    modal.style.animation = "modalResizeIn 1s cubic-bezier(0.25, 0.1, 0.25, 1.5) forwards"; 
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
            gameIframe.style.width = "100vw";
            gameIframe.style.height = "100vh";
        });
    } else {
        document.exitFullscreen().then(() => {
            modal.classList.remove("full-screen-mode");
            enterIcon.style.display = "inline";
            exitIcon.style.display = "none";
            gameIframe.style.width = "100%";
            gameIframe.style.height = "500px";  // Reset to original height when exiting fullscreen
        });
    }
}


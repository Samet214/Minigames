<?php
session_start(); // Starta sessionen (om den inte redan är startad)

// Kontrollera om användaren är inloggad och sätt variabeln $username
if (isset($_SESSION['username'])) {
    $username = $_SESSION['username']; // Antar att användarnamnet lagras i sessionen
} else {
    $username = null; // Sätt till null om användaren inte är inloggad
}
?>

<!DOCTYPE html>
<html data-page="spel4">
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="../style.css" type="text/css">
    </head>
    <body>
    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>" <?php if ($username) echo 'data-username="' . htmlspecialchars($username, ENT_QUOTES, 'UTF-8') . '"'; ?>></div>

    <div id="menu_button_container">
        <button id="menu_button">Meny</button>
    </div>

    <div id="start_page">
        <button id="start_button">Start!</button> 
    </div>

    <!-- Spel-HUD (initialt dolt) -->
    <div id="game_hud" style="display: none;">
        <div id="hud_container">
            <p>Nivå: <span id="level_counter">1</span></p>
            <p>Tid: <span id="time_counter">0</span> sek</p>
            <p>Försök: <span id="attempts_counter">0</span></p>
        </div>
    </div>

    <div id="popup-overlay" class="hidden">
        <div id="popup">
            <button id="close-popup">&times;</button>
            <h2>Nivå: <span id="popup-level"></span></h2>
            <p>Tid: <span id="popup-tid"></span></p>
            <p>Pengar tjänade: <span id="popup-pengar"></span></p>
            <p>Exp tjänat: <span id="popup-exp"></span></p>
        </div>
    </div>

    <div id="maze_container" style="display: none;"></div>

    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>"></div>
    <script src="../script.js"></script>
    </body>
</html>

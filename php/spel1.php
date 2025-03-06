<?php
session_start();

//  Kontrollera om användaren är inloggad
if (isset($_SESSION['username'])) {
    $username = $_SESSION['username'];
} else {
    $username = 'guest';
}
?>

<!DOCTYPE html>
<html lang="en" data-page="spel1">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memory Game</title>
    <link href="../style.css" rel="stylesheet" type="text/css">
    <style>
          /* Anpassad stil för knappen "Köp försök" */
        #buy-attempts-button {
            padding: 10px 20px;
            font-size: 14px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
        }
        #buy-attempts-button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>" data-username="<?php echo htmlspecialchars($username, ENT_QUOTES, 'UTF-8'); ?>"></div>
    <div class="game-container">
        <div class="level">Level: <span id="level">1</span></div>
        <div class="grid" id="grid">
             <!-- Rutor genereras här -->
        </div>
        <div class="button-switch-container">
            <div class="switch-container" id="switch-container">
                <span id="switch-text">Slumpmässig</span> <!-- Standardtext -->
                <label class="switch">
                    <input type="checkbox" id="mode-switch">
                    <span class="slider"></span>
                </label>
            </div>
            <button id="start-button">Start</button>
        </div>
        <div class="stats">
            Total Attempts: <span id="attempts">3</span><br>
            Time Remaining: <span id="time">10</span> seconds
        </div>
    </div>

    <!-- Popup för "Game Over" -->
    <div class="overlay" id="overlay"></div>
    <div class="popup" id="popup">
        <button class="close-btn" id="close-popup">&times;</button>
        <h2>Game Over</h2>
        <p>Level Reached: <span id="final-level"></span></p>
        <p>Tid: <span id="total-time"></span> seconds</p>
        <p>Experience Points (XP) Gained: <span id="final-xp"></span></p>
        <p>Arcade Point Coins (AP) Gained: <span id="final-money"></span></p>
        <button id="buy-attempts-button" style="display: none;">Buy 3 Attempts (Cost: 10 AP)</button>
    </div>

    <script src="../script.js"></script>
</body>
</html>
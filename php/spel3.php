
<?php
session_start();

// Kontrollera om användaren är inloggad
if (isset($_SESSION['username'])) {
    $username = $_SESSION['username'];
} else {
    $username = 'guest';
}
?>

<!DOCTYPE html>
<html lang="en" data-page="spel3">
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
     <!-- Ny wrapper-div för att hålla nivåtexten ovanför spelcontainern -->
    <div id="game-wrapper">
        <h2 id="level-info" style="display: none;">Level: 1</h2>
        <div id="game-container">
            <div id="grid-container"></div>
            <div id="info-container" style="display: none;">
                <p id="timer">Time Left: 10s</p>
                <p id="attempts">Attempts: 3</p>
            </div>
            <button id="start-button">Start Game</button>
        </div>
    </div>

     <!-- Nytt popup-fönster -->
    <div id="new-popup-overlay">
        <div id="new-game-over-popup">
            <button id="new-popup-close">X</button>
            <h2>Game Over</h2>
            <p id="new-popup-level"></p>
            <p id="new-popup-time"></p>
            <p id="new-popup-exp"></p>
            <p id="new-popup-money"></p>
            <button id="new-buy-attempts-button">Buy 3 Attempts (Cost: 50 AP)</button>
        </div>
    </div>

    <script src="../script.js"></script>
</body>
</html>
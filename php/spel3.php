<?php
session_start();

if (isset($_SESSION['username'])) {
    $username = $_SESSION['username'];
} else {
    $username = 'guest';
}

?>

<!DOCTYPE html>
<html data-page="spel3">
<head>
    <meta charset="utf-8">
    <link href="../style.css" rel="stylesheet" type="text/css">
    <title>Color Game</title>
</head>
<body>
    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>" data-username="<?php echo htmlspecialchars($username, ENT_QUOTES, 'UTF-8'); ?>"></div>
    <!-- New wrapper div to keep level text above the game container -->
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

    <div id="popup-overlay">
        <div id="game-over-popup">
            <button id="popup-close">X</button>
            <h2>Game Over</h2>
            <p id="popup-level"></p>
            <p id="popup-time"></p>
            <p id="popup-exp"></p>
            <p id="popup-money"></p>
            <p id="popup-networth"></p>
        </div>
    </div>

    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>"></div>
    <script src="../script.js"></script>
</body>
</html>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <link href="../css/spel3.css" rel="stylesheet" type="text/css">
    <title>Color Game</title>
</head>
<body>
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
    <script src="../js/spel3.js"></script>
</body>
</html>

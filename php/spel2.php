<!DOCTYPE html>
<html lang="en" data-page="spel2">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boll Spel!</title>
    <link href="../style.css" rel="stylesheet" type="text/css">
</head>
<body>
    <!-- Starting Screen -->
    <div id="startingScreen">
        <h1>Boll Spel!</h1>
        <button id="storyModeButton">Story Mode</button>
        <button id="multiplayerModeButton">Multiplayer Mode</button>
    </div>

    <!-- Game Screen -->
    <div id="gameCanvasContainer" style="display: none;">
        <canvas id="drawingCanvas"></canvas>
        <button id="hamburger">☰</button>
        <button id="menuButton">Menu</button>
        <div id="buttonContainer">
            <button id="undoButton">←</button>
            <button id="redoButton">→</button>
            <button id="resetButton">X</button>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>"></div>
    <script src="../script.js"></script>
</body>
</html>

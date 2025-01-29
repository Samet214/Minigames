<!DOCTYPE html>
<html data-page="spel4">
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="../style.css" type="text/css">
    </head>
    <body>

    <div id="menu_button_container">
        <button id="menu_button">Meny</button>
    </div>

    <div id="start_page">
        <button id="start_button">Start!</button> 
    </div>

    <!-- Game HUD (Initially hidden) -->
    <div id="game_hud" style="display: none;">
        <div id="hud_container">
            <p>Level: <span id="level_counter">1</span></p>
            <p>Time: <span id="time_counter">0</span> sec</p>
            <p>Attempts: <span id="attempts_counter">0</span></p>
        </div>
    </div>

    <div id="maze_container" style="display: none;"></div>

    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>"></div>
    <script src="../script.js"></script>
    </body>
</html>

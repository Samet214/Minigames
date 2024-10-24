<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Box Highlight Game</title>
        <link href="../css/prototyp.css" rel="stylesheet" type="text/css">
    </head>
    <body>
        <h1 id="level-display"></h1>

        <div id="container">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
            <div id="box3" class="box"></div>
            <div id="box4" class="box"></div>
            <div id="box5" class="box"></div>
            <div id="box6" class="box"></div>
            <div id="box7" class="box"></div>
            <div id="box8" class="box"></div>
            <div id="box9" class="box"></div>
        </div>

        <button id="spelknapp">Börja spela!</button>

        <div id="timer-display">Tid kvar: 0s</div>
        <div id="tries-display">Antal försök: 3</div>

        <div id="game-over-popup" class="popup">
        <div class="popup-content">
            <span class="close-btn" onclick="closeGameOverPopup()">&times;</span>
            <h2>Game Over!</h2>
            <p>Level: <span id="popup-level"></span></p>
            <p>Leaderboard Position: <span id="popup-leaderboard">0</span></p>
            <p>Leaderboard Best Position: <span id="popup-leaderboard-best">0</span></p>
            <p>EXP Gained: <span id="popup-exp"></span></p>
            <p>Best Level: <span id="popup-best-level"></span></p>
        </div>
    </div>

    </body>
    <script src="../js/prototyp.js"></script>
</html>

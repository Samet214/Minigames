<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="../css/spel4.css" type="text/css">
    </head>
    <body>

    <div id="maze_container"><!-- --></div>

    <script src="../js/spel4.js"></script>
    <script>

    let Maze = new MazeBuilder(Math.floor(Math.random() * 20) + 4, Math.floor(Math.random() * 20) + 4);
    Maze.placeKey();
    Maze.display("maze_container");

    // Initialize the player
    let player = new Player(Maze);
    player.init();

    </script>
    </body>
</html>

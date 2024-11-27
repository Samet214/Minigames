<?php
$gameId = isset($_GET['gameId']) ? $_GET['gameId'] : null;

$gameUrls = [
    "game1" => "../php/spel1.php",
    "game2" => "../php/spel2.php",
    "game3" => "../php/spel3.php",
    "game4" => "../php/spel4.php",
    "game5" => "../biljard/dist"
];

$gameUrl = isset($gameUrls[$gameId]) ? $gameUrls[$gameId] : null;
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Play Game</title>
    <style>
        body {
            margin: 0;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #222;
            color: #fff;
            height: 100vh;
        }
        iframe {
            width: 90%;
            height: 80%;
            border: none;
            background: #000;
        }
        header {
            width: 100%;
            text-align: center;
            background: #333;
            padding: 10px;
        }
        header a {
            color: #fff;
            text-decoration: none;
            font-size: 1.2rem;
        }
    </style>
</head>
<body>
    <header>
        <a href="spel.php">&larr; Back to Games</a>
    </header>
    <?php if ($gameUrl): ?>
        <iframe src="<?php echo htmlspecialchars($gameUrl); ?>"></iframe>
    <?php else: ?>
        <p>Game not found. Please return to the games list.</p>
    <?php endif; ?>
</body>
</html>

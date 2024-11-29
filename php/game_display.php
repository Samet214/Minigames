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
<html data-page="game_display">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Play Game</title>
    <link href="../style.css" rel="stylesheet" type="text/css">
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

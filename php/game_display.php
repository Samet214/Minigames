<?php
// Hämtar gameId från URL:en, eller sätter den till null om den saknas
$gameId = isset($_GET['gameId']) ? $_GET['gameId'] : null;

// Definierar en lista med spel och deras motsvarande URL:er
$gameUrls = [
    "game1" => "../php/spel1.php",
    "game2" => "../squigglegolf",
    "game3" => "../php/spel3.php",
    "game4" => "../php/spel4.php",
    "game5" => "../biljard/dist",
];

// Kollar om gameId finns i listan, annars sätts $gameUrl till null
$gameUrl = isset($gameUrls[$gameId]) ? $gameUrls[$gameId] : null;
?>

<!DOCTYPE html>
<html data-page="game_display">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spela spel</title>
    <link href="../style.css" rel="stylesheet" type="text/css">
</head>
<body>
    <header>
        <!-- Länk tillbaka till spellistan -->
        <a href="spel.php">&larr; Tillbaka till spel</a>
    </header>
    
    <?php if ($gameUrl): ?>
        <!-- Om spelet finns i listan laddas det i en iframe -->
        <iframe src="<?php echo htmlspecialchars($gameUrl); ?>"></iframe>
    <?php else: ?>
        <!-- Om spelet inte hittas visas ett felmeddelande -->
        <p>Spelet hittades inte. Vänligen gå tillbaka till spellistan.</p>
    <?php endif; ?>
</body>
</html>

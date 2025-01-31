<?php
session_start();

ini_set('display_errors', 0);

include 'db.php';

$username = 'Guest';
$profile_picture = 'default.png'; // Replace with actual profile picture logic
$level = 1;
$current_exp = 0;
$next_level_exp = 100;

?>



<!DOCTYPE html>
<html lang="sv" data-page="topplista">
<head>
    <title>Topplista</title>
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="../style.css">
</head>
<body>
    <header id="header">
        <?php include 'sidebar.php'; ?>
        <div id="circle-container" style="position: relative; display: inline-block;">
            <img id="logo" src="../bilder/Logotyp.png" alt="Logo" style="width: 80px; height: auto;">
            <div id="hover-circle"></div> <!-- This will be the neon circle -->
        </div>
        <div id="container1">
            <div id="logo-title">
                <h1>Arcade Point</h1>
            </div>
            <nav>
                <ul>
                    <li><a href="spel.php">Spel</a></li>
                    <li><a href="topplista.php">Topplista</a></li>
                </ul>
            </nav>
            <div class="buttons">
                <button id="signin" onclick="redirect('signup.php')">Registrera</button>
                <button id="hemsida" onclick="redirect('../index.php')">Hemsida</button>
            </div>
        </div>
        <div id="currency-bar">
            <span id="currency-amount">0</span>
            <img src="../bilder/mynt.png" id="currency-icon" alt="Coin Icon">
        </div>
    </header>

    <main id="leaderboard-container">
        <section id="leaderboard-grid">
            <div id="leaderboard-navigation">
                <button id="left-button" disabled>Previous</button>
                <div id="leaderboard-text">Welcome to the Leaderboard</div>
                <button id="right-button">Next</button>
            </div>
            <div class="leaderboard-tile"></div>
            <div class="leaderboard-tile"></div>
            <div class="leaderboard-tile"></div>
            <div class="leaderboard-tile"></div>
            <div class="leaderboard-tile"></div>
            <div class="leaderboard-tile"></div>
        </section>
    </main>

    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>"></div>


    <script src="../script.js"></script>
</body>
</html>

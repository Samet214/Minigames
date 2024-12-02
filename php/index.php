<?php
session_start();
?>

<!DOCTYPE html>
<html lang="sv" data-page="index">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="../style.css" type="text/css" rel="stylesheet">
    <title>Arcade Point</title>
</head>
<body>
    <header id="header">
        <div id="circle-container" style="position: relative; display: inline-block;">
            <img id="logo" src="../bilder/Logotyp.png" alt="Logo" style="width: 80px; height: auto;"> <!-- Replace with your logo image -->
            <div id="hover-circle"></div> <!-- This will be the neon circle -->
        </div>
        <div id="container1">
            <div id="logo-title">
                <h1>Arcade Point</h1>
            </div>
            <nav>
                <ul>
                    <li><a href="spel.php">Spel</a></li>
                    <li><a href="ledartavlor.php">Ledartavla</a></li>
                    <li><a href="info.php">Info</a></li>
                    <li><a href="#" id="a-tag4">Profil</a></li>
                </ul>
            </nav>
            <div class="buttons">
                <?php if (!isset($_SESSION['username'])): ?>
                    <button id="signin" onclick="redirect('signup.php')">Registrera</button>
                    <button id="login" onclick="redirect('login.php')">Logga in</button>
                <?php endif; ?>
            </div>
        </div>
        <div id="currency-bar">
            <button id="add-currency" onclick="gainCurrency(10)">+</button>
            <span id="currency-amount">0</span>
            <img src="../bilder/mynt.png" id="currency-icon" alt="Coin Icon">
        </div>
    </header>

    <!-- Main Content Section -->
    <main>
        <section class="rectangle-container">
            <div class="rectangle-1">
                <div><b>POPULÄRA KATEGORIER</b></div>
                <div id="category-1">
                    <img src="https://www.coolmathgames.com/themes/custom/coolmath/assets/svg/categories/Timing.svg">
                    <b>Tid<br>Spel</b>
                    <div id="arrow">→</div>
                </div>
                <div id="category-2"></div>
                <div id="category-3"></div>
                <div id="category-4"></div>
                <div id="category-5"></div>
                <div id="category-6"></div>
            </div>
            <div class="rectangle-2"></div>
            <div class="rectangle-3"></div>
            <div class="rectangle-4"></div>
            <div class="rectangle-5"></div>
            <div class="rectangle-6"></div>
        </section>
    </main>
    <footer>
        <p>Kontakta oss</p>
        <p>Email: kontakt@arcadepoint.com</p>
        <p>Tel: +46 123456789</p>
        <p>Senast uppdaterad: 2024-10-08</p>
    </footer>
</body>
<div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>"></div>
<script src="../script.js"></script>
</html>

<?php
session_start();
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="../css/spel.css" type="text/css" rel="stylesheet">
    <title>Spel</title>
</head>
<body>
    <header id="header">
        <div id="circle-container" style="position: relative; display: inline-block;">
            <img id="logo" src="../bilder/Logotyp.png" alt="Logo" style="width: 80px; height: auto;">
            <div id="hover-circle"></div>
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
                    <li><a href="profile.php" id="a-tag4">Profil</a></li>
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

    <!-- Game containers section -->
    <main class="game-section">
        <div class="game-container">
            <img src="../bilder/game1.jpg" alt="">
            <h2>Memory spel!</h2>
            <p>Testa hur mycket du kan komma ihåg och tävla mot andra</p>
            <button class="open-modal-button" onclick="openModal('game1')">Spela Nu</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game2.jpg" alt="">
            <h2>Boll spel!</h2>
            <p>Ha roligt med boll fysik, specialla drag och hopp funktion med enga rita linjer</p>
            <button class="open-modal-button" onclick="openModal('game2')">Spela Nu</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game3.jpg" alt="">
            <h2>Färg spel!</h2>
            <p>Testa om du kan se nyanser av färger eller om du är färg blind!</p>
            <button class="open-modal-button" onclick="openModal('game3')">Spela Nu</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game4.jpg" alt="">
            <h2>Maze runner!</h2>
            <p>Klura dig igenom svåra labyrint och hitta den väg rätt!</p>
            <button class="open-modal-button" onclick="openModal('game4')">Spela Nu</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game5.jpg" alt="">
            <h2>Biljard!</h2>
            <p>Ha roligt med att spela biljard!</p>
            <button class="open-modal-button" onclick="openModal('game5')">Spela Nu</button>
        </div>
    </main>

    <!-- Overlay and Modal -->
    <div id="overlay" onclick="closeModal()">
        <div id="modal" onclick="event.stopPropagation()">
            <button id="full-screen-button" onclick="toggleFullScreen(event)">
                <svg class="icon icon-fullscreen icon-lg" width="28" height="32" viewBox="0 0 28 32" aria-hidden="true"><path d="M0 11.25V3.5C0 2.669.669 2 1.5 2h7.75c.412 0 .75.337.75.75v2.5c0 .412-.338.75-.75.75H4v5.25c0 .412-.337.75-.75.75H.75a.753.753 0 0 1-.75-.75zm18-8.5v2.5c0 .412.337.75.75.75H24v5.25c0 .412.337.75.75.75h2.5c.413 0 .75-.338.75-.75V3.5c0-.831-.669-1.5-1.5-1.5h-7.75a.752.752 0 0 0-.75.75zM27.25 20h-2.5a.752.752 0 0 0-.75.75V26h-5.25a.752.752 0 0 0-.75.75v2.5c0 .413.337.75.75.75h7.75c.831 0 1.5-.669 1.5-1.5v-7.75a.752.752 0 0 0-.75-.75zM10 29.25v-2.5a.752.752 0 0 0-.75-.75H4v-5.25a.752.752 0 0 0-.75-.75H.75a.752.752 0 0 0-.75.75v7.75c0 .831.669 1.5 1.5 1.5h7.75c.412 0 .75-.337.75-.75z"></path></svg>
                <svg id="exit-fullscreen-icon" width="28" height="32" viewBox="0 0 28 32" style="display: none;">
                    <rect x="5" y="8" width="18" height="3" fill="currentColor" />
                    <rect x="5" y="16" width="18" height="3" fill="currentColor" />
                </svg>
            </button>
            <div id="modal-content">
                <iframe src="spel1.php" id="game-iframe" width="100%" height="500px" style="border: none;"></iframe>
            </div>
        </div>
    </div>

    <script src="../js/spel.js"></script>
</body>
</html>

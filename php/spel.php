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
            <img src="../bilder/game1.jpg" alt="Game 1">
            <h2>Game 1</h2>
            <p>Memory spel</p>
            <button class="open-modal-button" onclick="openModal('game1')">Play Now</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game2.jpg" alt="Game 2">
            <h2>Game 2</h2>
            <p>Rädda krokodilen!</p>
            <button class="open-modal-button" onclick="openModal('game2')">Play Now</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game3.jpg" alt="Game 3">
            <h2>Game 3</h2>
            <p>Färg spel</p>
            <button class="open-modal-button" onclick="openModal('game3')">Play Now</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game4.jpg" alt="Game 4">
            <h2>Game 4</h2>
            <p>Join the adventure and level up your skills!</p>
            <button class="open-modal-button" onclick="openModal('game4')">Play Now</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game5.jpg" alt="Game 5">
            <h2>Game 5</h2>
            <p>Join the adventure and level up your skills!</p>
            <button class="open-modal-button" onclick="openModal('game5')">Play Now</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game6.jpg" alt="Game 6">
            <h2>Game 6</h2>
            <p>Join the adventure and level up your skills!</p>
            <button class="open-modal-button" onclick="openModal('game6')">Play Now</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game7.jpg" alt="Game 7">
            <h2>Game 7</h2>
            <p>Memory spel</p>
            <button class="open-modal-button" onclick="openModal('game7')">Play Now</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game8.jpg" alt="Game 8">
            <h2>Game 8</h2>
            <p>Rädda krokodilen!</p>
            <button class="open-modal-button" onclick="openModal('game8')">Play Now</button>
        </div>
        <div class="game-container">
            <img src="../bilder/game9.jpg" alt="Game 9">
            <h2>Game 9</h2>
            <p>Färg spel</p>
            <button class="open-modal-button" onclick="openModal('game9')">Play Now</button>
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

<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="../css/hemsida.css" type="text/css" rel="stylesheet">
    <script src="../js/hemsida.js"></script>
    <title>Play Point</title>
</head>
<body>
    <!-- Header Section -->
    <header id="header">
        <img src="../bilder/Logotyp.png" id="logo">
        <nav>
            <ul>
                <li><a href="#">Spel</a></li>
                <li><a href="#">Ledartavla</a></li>
                <li><a href="#">Info</a></li>
                <li><a href="#">Profil</a></li>
            </ul>
        </nav>
        <div class="buttons">
            <button class="register" onclick="redirect('signup.php')">Registrera</button>
            <button class="login" onclick="redirect('login.php')">Log In</button>
        </div>
    </header>

    <!-- Sidebar -->
    <div id="sidebar-toggle" onclick="toggleSidebar()">☰</div>
    <div id="sidebar" class="sidebar">
        <!-- Profile Picture Section -->
        <div class="profile-section">
            <div class="username">
            <div class="profile-circle" style="background-image: url('../pfp/default.png')"></div>
            <h3>Gäst</h3>
        </div>
    </div>
    </div>

    <!-- Main Content Section -->
    <main>
        <section class="games">
            <h2>Nya Spel</h2>
            <p>Slumpmässig text här</p>
            <p>Slumpmässig text här</p>
            <p>Slumpmässig text här</p>
        </section>

        <section class="top-games">
            <h2>Top Spel</h2>
            <p>Slumpmässig text här</p>
            <p>Slumpmässig text här</p>
            <p>Slumpmässig text här</p>
        </section>

        <section class="leaderboard">
            <h2>Ledartavla</h2>
            <p>Slumpmässig text här</p>
            <p>Slumpmässig text här</p>
            <p>Slumpmässig text här</p>
        </section>
    </main>

    <!-- Footer Section -->
    <footer>
        <p>Kontakta oss</p>
        <p>Email: kontakt@playpoint.com</p>
        <p>Tel: +46 123456789</p>
        <p>Senast uppdaterad: 2024-10-08</p>
    </footer>
</body>
</html>

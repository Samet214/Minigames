<?php
// Starta sessionen för att hantera inloggning
session_start();

// Aktivera felrapportering för att identifiera problem under utveckling
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Om användaren redan är inloggad, omdirigera till spel.php
if (isset($_SESSION['username'])) {
    header("Location: spel.php");
    exit();
}

// Standardvärden för en gästanvändare
$username = 'Guest'; // Standardanvändarnamn
$profile_picture = 'default.png'; // Standardprofilbild
$level = 1; // Standardnivå
$current_exp = 0; // Nuvarande erfarenhetspoäng
$next_level_exp = 100; // Erfarenhetspoäng som krävs för nästa nivå

// Inkludera filen för databasanslutning
include 'db.php';

// Kontrollera om inloggningsformuläret skickats
if (isset($_POST['submit'])) {
    $conn = Anvandarinformation(); // Anslut till databasen

    // Rensa användarnamn och lösenord från blanksteg och gör dem små bokstäver
    $username = strtolower(trim($_POST['username']));
    $password = strtolower(trim($_POST['password']));

    // Funktion för att hasha lösenordet med SHA-256
    function hashString($input) {
        return hash('sha256', $input, false);
    }

    $hashedCode = hashString($password); // Hasha användarens lösenord

    // Hämta lösenordet från databasen för det angivna användarnamnet
    $sql = "SELECT Lösenord FROM användare WHERE Namn = ?";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->store_result();

        // Kontrollera om användaren finns
        if ($stmt->num_rows > 0) {
            $stmt->bind_result($dbHashedPassword);
            $stmt->fetch();

            // Jämför det hashade lösenordet från databasen med användarens inmatning
            if ($dbHashedPassword === $hashedCode) {
                // Sätt sessionsvariabler
                $_SESSION['username'] = $username;
                
                // Omdirigera till spel.php efter lyckad inloggning
                header("Location: spel.php");
                exit();
            } else {
                $errorMessage = "Fel användarnamn eller lösenord.";
            }
        } else {
            $errorMessage = "Användaren finns inte.";
        }

        $stmt->close(); // Stäng databasfrågan
    } else {
        $errorMessage = "Ett fel inträffade vid verifiering.";
    }

    $conn->close(); // Stäng databasanslutningen
}
?>

<!DOCTYPE html>
<html lang="sv" data-page="login">
<head>
    <title>Login - Arcade Point</title>
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="../style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                <li><a href="topplista.php">Topplista</a></li>
            </ul>
        </nav>
        <div class="buttons">
            <button id="signin" onclick="redirect('signup.php')">Registrera</button>
            <button id="hemsida" onclick="redirect('../index.php')">Hemsida</button>
        </div>
    </div>
</header>

<!-- Sidopanel för användarprofil och erfarenhetspoäng -->
<div id="sidebar-toggle" onclick="toggleSidebar()">☰</div>
<div id="sidebar" class="sidebar">
    <div class="profile-section">
        <div class="username">
            <div class="profile-circle" style="background-image: url('../pfp/<?php echo htmlspecialchars($profile_picture); ?>');" onclick="document.getElementById('profilePictureInput').click();"></div>
            <h3><?php echo htmlspecialchars(ucfirst($username)); ?></h3>
        </div>
        <form id="profilePictureForm" method="POST" enctype="multipart/form-data" style="display: none;">
            <input type="file" name="profile_picture" id="profilePictureInput" accept="image/*" onchange="document.getElementById('profilePictureForm').submit();">
        </form>
    </div>

    <div class="level-section">
        <h4>Level <span id="level"><?php echo $level; ?></span></h4>
        <div class="exp-bar">
            <div class="exp-progress" style="width: <?php echo ($current_exp / $next_level_exp) * 100; ?>%;" id="expProgress"></div>
        </div>
        <p id="expText">
            <?php
            function formatNumber($number) {
                if ($number >= 1000000000) {
                    return round($number / 1000000000, 1) . 'G';
                } elseif ($number >= 1000000) {
                    return round($number / 1000000, 1) . 'M';
                } elseif ($number >= 1000) {
                    return round($number / 1000, 1) . 'K';
                } else {
                    return $number;
                }
            }
            $formattedCurrentExp = formatNumber($current_exp);
            $formattedNextLevelExp = formatNumber($next_level_exp);
            echo $formattedCurrentExp . '/' . $formattedNextLevelExp . ' EXP';
            ?>
        </p>
    </div>
</div>

<!-- Inloggningsformulär -->
<h2>Logga in</h2>
<form action="" method="post">
    <input type="text" name="username" placeholder="Lägg in användarnamn" required />
    <input type="password" name="password" placeholder="Lägg in lösenord" required />
    <input type="submit" name="submit" value="Logga in" />
</form>

<h2 id="text-register">Har du inget konto? <a href="signup.php" id="register-button">Registrera</a></h2>

<?php
if (isset($errorMessage)) {
    echo '<p id="error-message" style="color: red;">' . $errorMessage . '</p>';
}
?>

<div id="login-info">
    <h3>Välkommen till Arcade Point!</h3>
    <p>
        Gå in i arkadens värld där spel, utmaningar och belöningar väntar! Skapa ett konto för att låsa upp exklusiva funktioner, följ din utveckling och tävla mot andra spelare. Vad väntar du på? Låt spelen börja!
        När du registrerar dig på Arcade Point får du tillgång till unika erbjudanden, personliga spelstatistik och specialevenemang som bara är tillgängliga för registrerade användare. Utmana dina vänner, sätt nya rekord, och samla poäng för att klättra på våra topplistor.
        Missa inte chansen att bli en del av vår växande spelgemenskap. Registrera dig nu och upptäck en värld av oändligt spelande. Oavsett om du är en nybörjare eller en erfaren spelare, finns det något här för alla.
        Är du redo för ditt nästa äventyr? Skapa ett konto och lås upp spelets alla hemligheter!
    </p>
</div>

<div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>" data-username="<?php echo htmlspecialchars($username); ?>"></div>
<script src="../script.js"></script>
</body>
</html>

<?php
$username = 'Guest';
$profile_picture = 'default.png'; // Replace with actual profile picture logic
$level = 1;
$current_exp = 0;
$next_level_exp = 100;
?>

<?php
session_start();

ini_set('display_errors', 0);

include 'db.php';

if (isset($_SESSION['username'])) {
    header("Location: spel.php");
    exit();
}

// Define status messages
$status = '';
if (isset($_GET['status']) && $_GET['status'] === 'exists') {
    $status = 'exists';
}

// Handle form submission
if (isset($_POST['submit'])) {
    // Establish connection
    $conn = Anvandarinformation();

    // Lowercase username and password
    $username = strtolower($_POST['username']);
    $password = strtolower($_POST['password']);

    // Check if username already exists
    $sql_check = "SELECT Namn FROM användare WHERE Namn = ?";
    if ($stmt = $conn->prepare($sql_check)) {
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            // Redirect with status: user already exists
            header("Location: " . $_SERVER['PHP_SELF'] . "?status=exists");
            exit();
        } else {
            // Hash the password
            function hashString($input) {
                return hash('sha256', $input, false);
            }

            $hashedCode = hashString($password);

            // Insert new user
            $sql = "INSERT INTO användare (Namn, Lösenord, time) VALUES (?, ?, NOW())";
            if ($stmt = $conn->prepare($sql)) {
                $stmt->bind_param("ss", $username, $hashedCode);
                if ($stmt->execute()) {
                    // Add user to ekonomi table
                    $sql_ekonomi = "INSERT INTO ekonomi.ekonomi (username, value, spent, networth) VALUES (?, 0, 0, 0)";
                    if ($stmt_ekonomi = $conn->prepare($sql_ekonomi)) {
                        $stmt_ekonomi->bind_param("s", $username);
                        $stmt_ekonomi->execute();
                        $stmt_ekonomi->close();
                    }

                    // Add user to poängssystem table
                    $sql_poang = "INSERT INTO poängssystem (Namn, Levels, EXP, EXP_GRÄNS) VALUES (?, 1, 0, 50)";
                    if ($stmt_poang = $conn->prepare($sql_poang)) {
                        $stmt_poang->bind_param("s", $username);
                        $stmt_poang->execute();
                        $stmt_poang->close();
                    }

                    // Automatically log in the user
                    $_SESSION['username'] = $username;

                    // Redirect directly to spel.php
                    header("Location: spel.php");
                    exit();
                }
                $stmt->close();
            }

        }
        $stmt->close();
    }

    // Close connection
    $conn->close();
}
?>


<!DOCTYPE html>
<html lang="sv" data-page="signup">
<head>
    <title>Minigames</title>
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="../style.css">
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
                <button id="signin" onclick="redirect('login.php')">Logga in</button>
                <button id="hemsida" onclick="redirect('../index.php')">Hemsida</button>
            </div>
        </div>
    </header>


    <div id="sidebar-toggle" onclick="toggleSidebar()">☰</div>
    <div id="sidebar" class="sidebar">
        <!-- Profile Picture Section -->
        <div class="profile-section">
            <div class="username">
            <div class="profile-circle" style="background-image: url('../pfp/<?php echo htmlspecialchars($profile_picture); ?>');" onclick="document.getElementById('profilePictureInput').click();"></div>
            <h3><?php echo htmlspecialchars(ucfirst($username)); ?></h3>
        </div>
        <!-- File input for profile picture upload -->
        <form id="profilePictureForm" method="POST" enctype="multipart/form-data" style="display: none;">
            <input type="file" name="profile_picture" id="profilePictureInput" accept="image/*" onchange="document.getElementById('profilePictureForm').submit();">
        </form>
    </div>

        <!-- Level and EXP bar -->
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

    <h2>Registrera</h2>
    <form action="" method="post">
        <input type="text" name="username" placeholder="Lägg in användernamn" required/>
        <input type="password" name="password" placeholder="Lägg in lösenord" required/>
        <input type="submit" name="submit" value="Registrera" />
    </form>

    <h2 id="text-register">Har du en konto? <a href="login.php" id="register-button">Logga in</a></h2>

    <?php if ($status === 'created'): ?>
        <p id="success-message" style="display: block;">Användarkonto skapat!</p>
    <?php elseif ($status === 'exists'): ?>
        <p id="error-message" style="display: block;">Användarnamnet finns redan!</p>
    <?php endif; ?>

    <div id="signup-info">
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

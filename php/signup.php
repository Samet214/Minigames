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

// Redirect if already logged in
if (isset($_SESSION['username'])) {
    header("Location: spel.php");
    exit();
}

// Define status messages
$status = '';
if (isset($_GET['status'])) {
    $status = $_GET['status'];
}

// Handle form submission
if (isset($_POST['submit'])) {
    // Establish connection
    $conn = Användarinformation();

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


                    // Redirect with status: account created
                    header("Location: " . $_SERVER['PHP_SELF'] . "?status=created");
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
        <?php include 'sidebar.php'; ?>
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
                <button id="hemsida" onclick="redirect('index.php')">Hemsida</button>
            </div>
        </div>
        <div id="currency-bar">
            <span id="currency-amount">0</span>
            <img src="../bilder/mynt.png" id="currency-icon" alt="Coin Icon">
        </div>
    </header>
    <h2>Registrera</h2>
    <form action="" method="post">
        <input type="text" name="username" placeholder="Lägg in användernamn" required/>
        <input type="password" name="password" placeholder="Lägg in lösenord" required/>
        <input type="submit" name="submit" value="Registrera" />
    </form>

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
    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>"></div>
    <script src="../script.js"></script>
</body>
</html>

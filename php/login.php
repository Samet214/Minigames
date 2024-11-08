<?php
session_start();

ini_set('display_errors', 0);

// Redirect to sida.php if the user is already logged in
if (isset($_SESSION['username'])) {
    header("Location: sida.php");
    exit();
}

include 'db.php';
?>

<!DOCTYPE html>
<html lang="sv">
<head>
    <title>Login - Play Point</title>
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="../css/login.css">
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
            <div class="buttons">
                <button id="signin" onclick="redirect('signup.php')">Registrera</button>
                <button id="hemsida" onclick="redirect('index.php')">Hemsida</button>
            </div>
        </div>
        <div id="currency-bar">
            <button id="add-currency" onclick="gainCurrency(10)">+</button>
            <span id="currency-amount">0</span>
            <img src="../bilder/mynt.png" id="currency-icon" alt="Coin Icon">
        </div>
    </header>
    <h2>Logga in</h2>
    <form action="" method="post">
        <input type="text" name="username" placeholder="Lägg in användarnamn" required />
        <input type="password" name="password" placeholder="Lägg in lösenord" required />
        <input type="submit" name="submit" value="Logga in"/>
    </form>

    <p id="error-message" style="display: none;">Fel användarnamn eller lösenord</p>
    <p id="error-message" style="display: none;">Användarkonto ej skapat</p>

    <div id="login-info">
        <h3>Välkommen till Arcade Point!</h3>
        <p>
            Gå in i arkadens värld där spel, utmaningar och belöningar väntar! Skapa ett konto för att låsa upp exklusiva funktioner, följ din utveckling och tävla mot andra spelare. Vad väntar du på? Låt spelen börja!
            När du registrerar dig på Play Point får du tillgång till unika erbjudanden, personliga spelstatistik och specialevenemang som bara är tillgängliga för registrerade användare. Utmana dina vänner, sätt nya rekord, och samla poäng för att klättra på våra topplistor.
            Missa inte chansen att bli en del av vår växande spelgemenskap. Registrera dig nu och upptäck en värld av oändligt spelande. Oavsett om du är en nybörjare eller en erfaren spelare, finns det något här för alla.
            Är du redo för ditt nästa äventyr? Skapa ett konto och lås upp spelets alla hemligheter!
        </p>
    </div>


    <?php
    ini_set('display_errors', 0);
    if (isset($_POST['submit'])) {
        $conn = Användarinformation();

        $username = strtolower($_POST['username']);
        $password = strtolower($_POST['password']);

        function hashString($input) {
            return hash('sha256', $input, false);
        }

        $hashedCode = hashString($password);

        $sql = "SELECT Lösenord FROM användare WHERE Namn = ?";
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows > 0) {
                $stmt->bind_result($dbHashedPassword);
                $stmt->fetch();

                if ($dbHashedPassword === $hashedCode) {
                    $_SESSION['username'] = $username;
                    $_SESSION['password'] = $password;
                    header("Location: sida.php");
                    exit();
                } else {
                    echo '<p id="error-message" style="display: block;">Fel användarnamn eller lösenord</p>';
                }
            } else {
                echo '<p id="error-message" style="display: block;">Användarkonto ej skapat</p>';
            }

            $stmt->close();
        } else {
           
        }

        $conn->close();
    }
    ?>
</body>
<script src="../js/login.js"></script>
</html>

<?php
    // Börjar PHP-kodsektionen
    session_start();
    // Startar sessionen för att möjliggöra sessionshantering

    if (isset($_SESSION['username'])) {
        // Om sessionsvariabeln 'username' är satt, dvs om användaren redan är inloggad
        header("Location: forum.php");
        // Skickar användaren till forum.php om de redan är inloggade
        exit();
        // Avslutar skriptet för att förhindra att index.php laddas
    }

    $servername = "localhost";
    // Servernamnet för databasen
    $dbUsername = "samet";
    // Mitt användarnamn i phpMyAdmin
    $dbPassword = "samet";
    // Mitt lösenord i phpMyAdmin
    $dbname = "forum";
    // Databasens namn
    $conn = new mysqli($servername, $dbUsername, $dbPassword, $dbname);
    // Skapar en anslutning till databasen

    if ($conn->connect_error) {
        // Om det uppstår ett anslutningsfel    
        die("Koppling misslyckad: " . $conn->connect_error);
        // Då avslutas skriptet och meddelandet skrivs ut
    }

    function hashString($input) {
        // Skapar en funktion för att hasha en sträng som tas som input
        return hash('sha256', $input, false);
        // Returnerar en SHA-256 hash av input-strängen
    }
    if (isset($_POST['login_submit'])) {
        // Om login-knappen trycks
        $login_username = strtolower($_POST['login_username']);
        // Sätter login_username till värdet i textfältet och gör det till små bokstäver
        $login_password = strtolower($_POST['login_password']);
        // Sätter login_password till värdet i textfältet och gör det till små bokstäver
        $hashedLoginPassword = hashString($login_password);
        // Hashar lösenordet och sparar det i variabeln $hashedLoginPassword
    
        $sql = "SELECT passwords FROM user WHERE username = ?";
        // Skapar en SQL-sats för att hämta det hashade lösenordet för användaren från databasen
        if ($stmt = $conn->prepare($sql)) {
            // Förbereder SQL-satsen
            $stmt->bind_param("s", $login_username);
            // Binder användarnamnet till SQL-satsen
    
            $stmt->execute();
            // Kör SQL-satsen
            $stmt->store_result();
            // Lagrar resultatet från frågan
    
            if ($stmt->num_rows > 0) {
                // Om det finns en användare med det angivna användarnamnet
                $stmt->bind_result($dbHashedPassword);
                // Binder resultatet från frågan till variabeln $dbHashedPassword
                $stmt->fetch();
                // Hämtar resultatet
    
                if ($dbHashedPassword === $hashedLoginPassword) {
                    // Om det hashade lösenordet matchar
                    $_SESSION['username'] = $login_username;
                    // Sätter användarnamnet i sessionen
                    header("Location: forum.php");
                    // Skickar användaren till forum.php
                    exit();
                    // Avslutar skriptet
                } else {
                    // Om lösenordet inte matchar
                    echo "<br>Fel användarnamn eller lösenord";
                    // Skriver ut ett felmeddelande
                }
            } else {
                // Om inget användarkonto hittas
                echo "<br>Användarkonto ej skapat";
                // Skriver ut ett felmeddelande
            }
    
            $stmt->close();
            // Stänger SQL-satsen
        } else {
            echo "<br>Kunde inte förbereda SQL: " . $conn->error;
            // Felmeddelande om SQL-satsen inte kan förberedas
        }
    }
    
    $conn->close();
    // Stänger anslutningen till databasen
?>

<!DOCTYPE html>
<html lang="sv">
    <head>
        <meta charset="utf-8">
        <title>Logga in</title>
        <link href="style.css?v=1.1" rel="stylesheet" type="text/css">
        <script src="script.js"></script>
    </head>
    <body>
    <div id="container1">
        <button id="signin" onclick="redirect('index.php')"><b>Registrera<b></button>
    </div>
    <h2>Logga in</h2>
    <!--Skapar en h2 med logga in-->
        <!-- Formulär för inloggning -->
        <form action="" method="post">
    <!--Form-->
            <input type="text" name="login_username" placeholder="Lägg in användernamn" required/>
    <!--Skapar en textbox som required ha något i sig-->
            <input type="password" name="login_password" placeholder="Lägg in lösenord" required/>
    <!--Skapar en textbox som required ha något i sig-->
            <input type="submit" name="login_submit" value="Logga in" />
    <!--Skapar en logga in knapp-->
        </form>
    <!--Avslutar form-tag-->
    </body>
</html>
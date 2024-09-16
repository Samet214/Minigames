<?php
// Börjar PHP-kodsektionen
session_start();
// Startar sessionen för att möjliggöra sessionshantering

if (isset($_SESSION['username'])) {
    // Om sessionsvariabeln 'username' är satt, dvs om användaren redan är inloggad
    header("Location: sida.php");
    // Skickar användaren till sida.php om de redan är inloggade
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

if (isset($_POST['register_submit'])) {
    // Om registreringsknappen trycks
    $register_username = strtolower($_POST['register_username']);
    // Sätter register_username till värdet i textfältet och gör det till små bokstäver
    $register_password = strtolower($_POST['register_password']);
    // Sätter register_password till värdet i textfältet och gör det till små bokstäver
    $register_email = strtolower($_POST['register_email']);
    // Sätter register_email till värdet i textfältet och gör det till små bokstäver
    $register_name = strtolower($_POST['register_name']);
    // Sätter register_name till värdet i textfältet och gör det till små bokstäver
    $hashedPassword = hashString($register_password);
    // Hashar lösenordet och sparar det i variabeln $hashedPassword

    $sql = "INSERT INTO user (username, names, emails, passwords) VALUES (?, ?, ?, ?)";
    // Skapar en SQL-sats för att lägga till användaruppgifter i databasen
    if ($stmt = $conn->prepare($sql)) {
        // Förbereder SQL-satsen
        $stmt->bind_param("ssss", $register_username, $register_name, $register_email, $hashedPassword);
        // Binder användarens uppgifter till SQL-satsen

        if ($stmt->execute()) {
            // Om inmatningen lyckas
            echo "<br>Användarkonto skapat!";
            // Skriver ut ett meddelande att kontot har skapats
        } else {
            // Om inmatningen misslyckas
            echo "<br>Fel vid inmatning: " . $stmt->error;
            // Skriver ut ett felmeddelande
        }

        $stmt->close();
        // Stänger SQL-satsen
    } else {
        echo "<br>Kunde inte förbereda SQL: " . $conn->error;
        // Felmeddelande om SQL-satsen inte kan förberedas
    }
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
                header("Location: sida.php");
                // Skickar användaren till sida.php
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
<!--Deklerar html fil-->
<html lang="sv">
<!--Html-tag med språk svenska-->
<head>
<!--Skapar en head-tag-->
    <title>Registrera och Logga in</title>
<!--Skapar en titel Registrera och Logga in-->
    <meta charset="utf-8">
<!--Göra en meta charset utf-8-->
    <link rel="stylesheet" type="text/css" href="style.css?v=1.1">
<!--Länkar css fil-->
    <!-- Inkluderar extern CSS-fil -->
</head>
<!--Avslutar head-tagen-->
<body>
<!--Avslutar body-tagen-->
    <h2>Registrera</h2>
<!--Skapar en h2 med texten Registrera-->
    <!-- Formulär för registrering -->
    <form action="" method="post">
<!--Form-->
        <input type="text" name="register_username" placeholder="Lägg in användernamn" required/>
        <!--textbox med required så man behöver lägga in något-->
        <input type="password" name="register_password" placeholder="Lägg in lösenord" required/>
        <!--textbox med required så man behöver lägga in något-->
        <input type="e-post" name="register_email" placeholder="Lägg in e-post" required/>
        <!--textbox med required så man behöver lägga in något-->
        <input type="text" name="register_name" placeholder="Lägg in namn" required/>
        <!--textbox med required så man behöver lägga in något-->
        <input type="submit" name="register_submit" value="Skapa konto" />
<!--Skapar en registering knapp-->
    </form>
<!--Avslutar form-->

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
<!--Avslutar body-tag-->
</html>
<!--Avslutar html-tag-->

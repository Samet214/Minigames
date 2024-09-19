<?php
// Startar PHP-kodsektionen
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

    // Först kolla om användarnamn eller e-post redan existerar
    $sql_check = "SELECT username, emails FROM user WHERE username = ? OR emails = ?";
    if ($stmt = $conn->prepare($sql_check)) {
        $stmt->bind_param("ss", $register_username, $register_email);
        // Binder inmatade användarnamn och e-post för att kolla
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            // Om något resultat hittades
            $stmt->bind_result($existing_username, $existing_email);
            $stmt->fetch();

            if ($existing_username == $register_username && $existing_email == $register_email) {
                echo "<br>Användaren finns redan";
            } elseif ($existing_username == $register_username) {
                echo "<br>Användaren finns redan";
            } elseif ($existing_email == $register_email) {
                echo "<br>Användaren finns redan";
            }
        } else {
            // Om varken användarnamn eller email finns, skapa kontot
            $sql = "INSERT INTO user (username, names, emails, passwords) VALUES (?, ?, ?, ?)";
            if ($stmt_insert = $conn->prepare($sql)) {
                $stmt_insert->bind_param("ssss", $register_username, $register_name, $register_email, $hashedPassword);
                // Binder användarens uppgifter till SQL-satsen

                if ($stmt_insert->execute()) {
                    // Om inmatningen lyckas
                    echo "<br>Användarkonto skapat!";
                } else {
                    // Om inmatningen misslyckas
                    echo "<br>Fel vid inmatning: " . $stmt_insert->error;
                }

                $stmt_insert->close();
                // Stänger SQL-satsen
            } else {
                echo "<br>Kunde inte förbereda SQL: " . $conn->error;
            }
        }

        $stmt->close();
    } else {
        echo "<br>Kunde inte förbereda SQL: " . $conn->error;
    }
}

$conn->close();
// Stänger anslutningen till databasen
?>


<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Logga in</title>
        <link href="style.css?v=1.1" rel="stylesheet" type="text/css">
        <script src="script.js"></script>
    </head>
    <body>
        <div id="container1">
            <button id="login" onclick="redirect('login.php')"><b>Logga in<b></button>
        </div>
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
    </body>
</html>
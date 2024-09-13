<?php
session_start();

// Redirect logged-in users to sida.php
if (isset($_SESSION['username'])) {
    header("Location: sida.php");
    exit();
}

$servername = "localhost";
$dbUsername = "samet";
$dbPassword = "samet";
$dbname = "forum";

// Establish connection
$conn = new mysqli($servername, $dbUsername, $dbPassword, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Koppling misslyckad: " . $conn->connect_error);
}

// Hashing function
function hashString($input) {
    return hash('sha256', $input, false);
}

// Registration logic
if (isset($_POST['register_submit'])) {
    $register_username = strtolower($_POST['register_username']);
    $register_password = strtolower($_POST['register_password']);
    $register_email = strtolower($_POST['register_email']);
    $register_name = strtolower($_POST['register_name']);
    $hashedPassword = hashString($register_password);

    // Prepare SQL statement for registration
    $sql = "INSERT INTO user (username, names, emails, passwords) VALUES (?, ?, ?, ?)";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("ssss", $register_username, $register_name, $register_email, $hashedPassword);

        if ($stmt->execute()) {
            echo "<br>Användarkonto skapat!";
        } else {
            echo "<br>Fel vid inmatning: " . $stmt->error;
        }

        $stmt->close();
    } else {
        echo "<br>Kunde inte förbereda SQL: " . $conn->error;
    }
}

// Login logic
if (isset($_POST['login_submit'])) {
    $login_username = strtolower($_POST['login_username']);
    $login_password = strtolower($_POST['login_password']);
    $hashedLoginPassword = hashString($login_password);

    // Prepare SQL query for login
    $sql = "SELECT passwords FROM user WHERE username = ?";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("s", $login_username);

        // Execute and check if username exists
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $stmt->bind_result($dbHashedPassword);
            $stmt->fetch();

            // Verify password
            if ($dbHashedPassword === $hashedLoginPassword) {
                $_SESSION['username'] = $login_username;
                header("Location: sida.php");
                exit();
            } else {
                echo "<br>Fel användarnamn eller lösenord";
            }
        } else {
            echo "<br>Användarkonto ej skapat";
        }

        $stmt->close();
    } else {
        echo "<br>Kunde inte förbereda SQL: " . $conn->error;
    }
}

// Close connection
$conn->close();
?>

<!DOCTYPE html>
<html lang="sv">
<head>
    <title>Registrera och Logga in</title>
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="style.css?v=1.1">
</head>
<body>
    <!-- Registration Section -->
    <h2>Registrera</h2>
    <form action="" method="post">
        <input type="text" name="register_username" placeholder="Lägg in användernamn" required/>
        <input type="password" name="register_password" placeholder="Lägg in lösenord" required/>
        <input type="e-post" name="register_email" placeholder="Lägg in e-post" required/>
        <input type="text" name="register_name" placeholder="Lägg in namn" required/>
        <input type="submit" name="register_submit" value="Skapa konto" />
    </form>

    <!-- Login Section -->
    <h2>Logga in</h2>
    <form action="" method="post">
        <input type="text" name="login_username" placeholder="Lägg in användernamn" required/>
        <input type="password" name="login_password" placeholder="Lägg in lösenord" required/>
        <input type="submit" name="login_submit" value="Logga in" />
    </form>
</body>
</html>

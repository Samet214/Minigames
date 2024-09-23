<!DOCTYPE html>
<html lang="sv">
<head>
    <title>Minigames</title>
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="style.css?v=1.1">
    <script src="script.js"></script>
</head>
<body>
    <div id="container1">
        <button id="login" onclick="redirect('login.php')"><b>Logga in<b></button>
        <button id="hemsida" onclick="redirect('guesthemsida.php')"><b>Hemsida<b></button>
    </div>
    <h2>Registrera</h2>
    <form action="" method="post">
        <input type="text" name="username" placeholder="Lägg in användernamn" required/>
        <input type="password" name="password" placeholder="Lägg in lösenord" required/>
        <input type="submit" name="submit" value="Registrera" />
    </form>

    <?php
    session_start();

    if (isset($_SESSION['username'])) {
        header("Location: sida.php");
        exit();
    }

    if (isset($_POST['submit'])) {
        $servername = "localhost";
        $dbUsername = "samet";
        $dbPassword = "samet";
        $dbname = "Användarinformation";

        // Establish connection
        $conn = new mysqli($servername, $dbUsername, $dbPassword, $dbname);

        // Check connection
        if ($conn->connect_error) {
            die("Koppling misslyckad: " . $conn->connect_error);
        }

        // Lowercase username and password
        $username = strtolower($_POST['username']);
        $password = strtolower($_POST['password']);

        $sql_check = "SELECT Namn FROM `Användare` WHERE Namn = ?";
        if ($stmt = $conn->prepare($sql_check)) {
            $stmt->bind_param("s", $username);
            // Binder inmatade användarnamn och e-post för att kolla
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows > 0) {
                // Om något resultat hittades
                $stmt->bind_result($existing_username);
                $stmt->fetch();

                if (!empty($existing_username)) {
                    echo "<br>Användarkontot har redan skapats";
                }
            }
        }

        

        // Hash the password
        function hashString($input) {
            return hash('sha256', $input, false);
        }

        $hashedCode = hashString($password);

        // Prepare SQL statement (including the time column)
        $sql = "INSERT INTO Användare (Namn, Lösenord, time) VALUES (?, ?, NOW())";
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("ss", $username, $hashedCode);

            // Execute the prepared statement
            if ($stmt->execute()) {
                echo "<br>Användarkonto skapat!";
            } else {
                echo "<br>Fel vid inmatning: " . $stmt->error;
            }

            // Close statement
            $stmt->close();
        } else {
            echo "<br>Kunde inte förbereda SQL: " . $conn->error;
        }

        // Close connection
        $conn->close();
    }
    ?>
</body>
</html>

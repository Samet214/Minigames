<!DOCTYPE html>
<html lang="sv">
<head>
    <title>Login</title>
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="style.css?v=1.1">
    <script src="script.js"></script>
</head>
<body>
    <div id="container1">
        <button id="login" onclick="redirect('login.php')"><b>Logga in<b></button>
        <button id="signin" onclick="redirect('signup.php')"><b>Registrera<b></button>
        <button id="hemsida" onclick="redirect('hemsida.php')"><b>Hemsida<b></button>
    </div>
    <h2>Logga in</h2>
    <form action="" method="post">
        <input type="text" name="username" placeholder="Lägg in användernamn" required/>
        <input type="password" name="password" placeholder="Lägg in lösenord" required/>
        <input type="submit" name="submit" value="Logga in" />
    </form>

    <?php
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

        // Hash the input password to compare with the stored hash
        function hashString($input) {
            return hash('sha256', $input, false);
        }

        $hashedCode = hashString($password);

        // Prepare SQL query to check if the username exists
        $sql = "SELECT Lösenord FROM Användare WHERE Namn = ?";
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("s", $username);

            // Execute the query
            $stmt->execute();
            $stmt->store_result();

            // Check if the username exists
            if ($stmt->num_rows > 0) {
                $stmt->bind_result($dbHashedPassword);
                $stmt->fetch();

                // Verify if the hashed password matches the one in the database
                if ($dbHashedPassword === $hashedCode) {
                    // Start session and redirect to sida.php
                    session_start();
                    $_SESSION['username'] = $username;
                    header("Location: sida.php");
                    exit();
                } else {
                    // Password is incorrect
                    echo "<br>Fel användarnamn eller lösenord";
                }
            } else {
                // Username does not exist in the database
                echo "<br>Användarkonto ej skapat";
            }

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

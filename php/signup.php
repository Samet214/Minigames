<!DOCTYPE html>
<html lang="sv">
<head>
    <title>Minigames</title>
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="../css/signup.css">
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
                <button id="signin" onclick="redirect('login.php')">Logga in</button>
                <button id="hemsida" onclick="redirect('hemsida.php')">Hemsida</button>
            </div>
        </div>
    </header>
    <h2>Registrera</h2>
    <form action="" method="post">
        <input type="text" name="username" placeholder="Lägg in användernamn" required/>
        <input type="password" name="password" placeholder="Lägg in lösenord" required/>
        <input type="submit" name="submit" value="Registrera" />
    </form>

    <div id="signup-info">
        <h3>Välkommen till Arcade Point!</h3>
        <p>
            Gå in i arkadens värld där spel, utmaningar och belöningar väntar! Skapa ett konto för att låsa upp exklusiva funktioner, följ din utveckling och tävla mot andra spelare. Vad väntar du på? Låt spelen börja!
            När du registrerar dig på Play Point får du tillgång till unika erbjudanden, personliga spelstatistik och specialevenemang som bara är tillgängliga för registrerade användare. Utmana dina vänner, sätt nya rekord, och samla poäng för att klättra på våra topplistor.
            Missa inte chansen att bli en del av vår växande spelgemenskap. Registrera dig nu och upptäck en värld av oändligt spelande. Oavsett om du är en nybörjare eller en erfaren spelare, finns det något här för alla.
            Är du redo för ditt nästa äventyr? Skapa ett konto och lås upp spelets alla hemligheter!
        </p>
    </div>

    <?php
    session_start();

    include 'db.php';

    if (isset($_SESSION['username'])) {
        header("Location: sida.php");
        exit();
    }

    if (isset($_POST['submit'])) {

        // Establish connection
        $conn = Användarinformation();

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
<script src="../js/signup.js"></script>
</html>

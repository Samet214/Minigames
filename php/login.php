<?php
session_start();

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
    <title>Login - Exciting Gaming Portal</title>
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="../css/login.css">
    <script src="../js/login.js"></script>
</head>
<body>
    <!-- Header Section with Logotype and Navigation -->
    <header>
        <div id="logo">
            <img src="../images/logotype.png" alt="Game Portal Logo" />
        </div>
        <nav>
            <button id="signin" onclick="redirect('signup.php')"><b>Registrera</b></button>
            <button id="hemsida" onclick="redirect('hemsida.php')"><b>Hemsida</b></button>
        </nav>
    </header>

    <!-- Main Login Section -->
    <main>
        <section id="login-section">
            <h2>Logga in till din Spelportal</h2>
            <form action="" method="post">
                <input type="text" name="username" placeholder="Lägg in användarnamn" required />
                <input type="password" name="password" placeholder="Lägg in lösenord" required />
                <input type="submit" name="submit" value="Logga in" />
            </form>

            <?php
            if (isset($_POST['submit'])) {
                $conn = Användarinformation();

                $username = strtolower($_POST['username']);
                $password = strtolower($_POST['password']);

                function hashString($input) {
                    return hash('sha256', $input, false);
                }

                $hashedCode = hashString($password);

                $sql = "SELECT Lösenord FROM Användare WHERE Namn = ?";
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
                            echo "<br>Fel användarnamn eller lösenord";
                        }
                    } else {
                        echo "<br>Användarkonto ej skapat";
                    }

                    $stmt->close();
                } else {
                    echo "<br>Kunde inte förbereda SQL: " . $conn->error;
                }

                $conn->close();
            }
            ?>
        </section>

        <!-- Additional Information Section -->
        <section id="info-section">
            <h3>Varför Logga In?</h3>
            <p>
                Genom att logga in får du tillgång till exklusiva spel, prestationer, och turneringar.
                Håll koll på din poäng och utmana andra spelare!
            </p>
        </section>
    </main>
</body>
</html>

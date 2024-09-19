<?php
session_start();
// Startar sessionen för att möjliggöra sessionshantering

// Kontrollera om användaren är inloggad
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    // Skickar användaren tillbaka till login.php om de inte är inloggade
    exit();
    // Avslutar skriptet för att förhindra fortsatt laddning
}

$username = $_SESSION['username'];
// Sparar användarnamnet från sessionen i variabeln $username

$servername = "localhost";
// Servernamnet för databasen
$dbUsername = "samet";
// Mitt användarnamn i phpMyAdmin
$dbPassword = "samet";
// Mitt lösenord i phpMyAdmin
$dbname = "forum";
// Namnet på databasen

$conn = new mysqli($servername, $dbUsername, $dbPassword, $dbname);
// Skapar en anslutning till databasen

if ($conn->connect_error) {
    // Om det uppstår ett anslutningsfel
    die("Koppling misslyckad: " . $conn->connect_error);
    // Avslutar skriptet och skriver ut ett felmeddelande
}

// Hanterar utloggning
if (isset($_GET['logout'])) {
    session_unset();
    // Tömmer alla sessionvariabler
    session_destroy();
    // Förstör sessionen
    header("Location: login.php");
    // Skickar användaren till startsidan (login.php)
    exit();
    // Avslutar skriptet
}

// Hanterar ett nytt inlägg
if (isset($_POST['skicka'])) {
    $message = $_POST['msg'];
    // Hämtar meddelandet från formuläret
    $timestamp = date('Y-m-d H:i:s');
    // Skapar en tidsstämpel för när meddelandet skickas

    $sql = "INSERT INTO forum (username, messages, timed) VALUES (?, ?, ?)";
    // Förbereder en SQL-sats för att lägga till inlägg i databasen
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("sss", $username, $message, $timestamp);
        // Binder användarnamnet, meddelandet och tidsstämpeln till SQL-satsen

        if (!$stmt->execute()) {
            // Om SQL-satsen inte kan exekveras
            echo "Fel vid insättning av meddelande: " . $stmt->error;
            // Skriver ut ett felmeddelande
        }

        $stmt->close();
        // Stänger SQL-satsen
    } else {
        echo "<br>Kunde inte förbereda SQL: " . $conn->error;
        // Felmeddelande om SQL-satsen inte kan förberedas
    }
}

// Hämta och visa alla meddelanden
$sql = "SELECT username, messages, timed FROM forum ORDER BY timed DESC";
// Skapar en SQL-sats för att hämta alla meddelanden sorterade i fallande ordning efter tidsstämpeln
if ($stmt = $conn->prepare($sql)) {
    $stmt->execute();
    // Kör SQL-satsen
    $result = $stmt->get_result();
    // Sparar resultatet från frågan i $result
} else {
    echo "<br>Kunde inte förbereda SQL: " . $conn->error;
    // Felmeddelande om SQL-satsen inte kan förberedas
}
?>

<!DOCTYPE html>
<html lang="sv">
<head>
    <title>Välkommen</title>
    <meta charset="utf-8">
    <link href="forum.css" rel="stylesheet" type="text/css">
    <!-- Länkar till en extern CSS-fil -->
</head>
<body>
    <p>Vill du <a href="?logout=true">logga ut?</a></p>
    <!-- Länk för att logga ut -->
    
    <h1>Ett enkelt forum.</h1>
    <!-- Rubrik för forumet -->
    
    <form name="nypost" method="POST" action="">
        <!-- Formulär för att skicka ett nytt meddelande -->
        <table>
            <tr>
                <td>Meddelande</td>
                <td><label for="msg"></label>
                    <textarea class="textFiled" name="msg" rows="8" id="msg"></textarea>
                    <!-- Textarea för att skriva meddelandet -->
                </td>
            </tr>
            <tr>
                <td colspan="2"><input type="submit" name="skicka" id="skicka" value="Skicka"></td>
                <!-- Knapp för att skicka meddelandet -->
            </tr>
        </table>
        <input type="hidden" name="MM_insert" value="nypost">
        <!-- Dold input för att indikera att formuläret skickas -->
    </form>

    <!-- Visar resultatet i en tabell -->
    <table id="dbres">
        <tr>
            <th>Namn</th>
            <th>Meddelande</th>
            <th>Datum</th>
        </tr>
        <?php while ($row = $result->fetch_assoc()) { ?>
            <!-- Loopar igenom resultatet och visar varje meddelande i en tabellrad -->
            <tr>
                <td><?php echo htmlspecialchars($row['username']); ?></td>
                <!-- Visar användarnamnet -->
                <td><?php echo nl2br(htmlspecialchars($row['messages'])); ?></td>
                <!-- Visar meddelandet och konverterar radbrytningar till <br> -->
                <td><?php echo htmlspecialchars($row['timed']); ?></td>
                <!-- Visar tidsstämpeln -->
            </tr>
        <?php } ?>
    </table>

    <?php
    // Stänger anslutningen och SQL-satsen
    $stmt->close();
    $conn->close();
    ?>
</body>
</html>

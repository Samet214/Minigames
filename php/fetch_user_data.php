<?php
header('Content-Type: application/json'); // Anger att svaret ska vara i JSON-format

// Aktivera felrapportering för felsökning
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Databasanslutning
$servername = "samet-server.adm.huddinge.se";
$db_username = "samet";
$db_password = "samet";

$response = []; // Skapar en array för att lagra svaret

try {
    // Kontrollera om "username" har skickats via GET
    if (isset($_GET['username'])) {
        $username = $_GET['username'];

        // Anslut till databasen "användarinformation"
        $conn1 = new mysqli($servername, $db_username, $db_password, "användarinformation");
        if ($conn1->connect_error) {
            throw new Exception('Databasanslutning misslyckades för användarinformation');
        }

        // Fråga för att hämta spelarens nivå
        $sql1 = "SELECT Levels FROM poängssystem WHERE Namn = ?";
        $stmt1 = $conn1->prepare($sql1);
        $stmt1->bind_param("s", $username);
        $stmt1->execute();
        $result1 = $stmt1->get_result();
        $row1 = $result1->fetch_assoc();

        // Lagrar spelarens nivå i svaret, om det finns ett resultat
        $response['level'] = $row1['Levels'] ?? null;

        // Stäng frågeställning och databasanslutning
        $stmt1->close();
        $conn1->close();

        // Anslut till databasen "ekonomi"
        $conn2 = new mysqli($servername, $db_username, $db_password, "ekonomi");
        if ($conn2->connect_error) {
            throw new Exception('Databasanslutning misslyckades för ekonomi');
        }

        // Fråga för att hämta spelarens nettoförmögenhet
        $sql2 = "SELECT networth FROM ekonomi WHERE username = ?";
        $stmt2 = $conn2->prepare($sql2);
        $stmt2->bind_param("s", $username);
        $stmt2->execute();
        $result2 = $stmt2->get_result();
        $row2 = $result2->fetch_assoc();

        // Lagrar spelarens nettoförmögenhet i svaret, om det finns ett resultat
        $response['networth'] = $row2['networth'] ?? null;

        // Stäng frågeställning och databasanslutning
        $stmt2->close();
        $conn2->close();

        // Skickar svaret som JSON
        echo json_encode($response);
    } else {
        throw new Exception('Användarnamn saknas');
    }
} catch (Exception $e) {
    // Skickar felmeddelande som JSON om något går fel
    echo json_encode(['error' => $e->getMessage()]);
}
?>

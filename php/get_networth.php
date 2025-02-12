<?php
// Starta sessionen för att få den aktuella användarens användarnamn
session_start();

// Kontrollera om användaren är inloggad (sessionen måste innehålla användarnamnet)
if (!isset($_SESSION['username'])) {
    echo "0"; // Om inte inloggad, returnera "0"
    exit; // Stoppa skriptet
}

$username = $_SESSION['username']; // Hämta användarnamnet från sessionen

// Databasanslutningsuppgifter
$host = "localhost"; // Ändra vid behov
$db_username = "samet";  // Databasens användarnamn
$db_password = "samet";  // Databasens lösenord
$dbname = "ekonomi"; // Databasens namn

// Skapa en anslutning till databasen
$conn = new mysqli($host, $db_username, $db_password, $dbname);

// Kontrollera om anslutningen lyckades
if ($conn->connect_error) {
    die("Anslutning misslyckades: " . $conn->connect_error);
}

// SQL-fråga för att hämta användarens värde baserat på deras användarnamn
$sql = "SELECT value FROM ekonomi WHERE username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);  // Bind användarnamnet från sessionen
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // Hämta användarens värde
    $row = $result->fetch_assoc();
    echo $row['value'];  // Returnera användarens värde
} else {
    echo "0"; // Om inget hittas, returnera "0"
}

// Stäng databaskopplingen
$stmt->close();
$conn->close();
?>

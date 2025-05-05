<?php
session_start();  // Startar sessionen
header('Content-Type: application/json');  // Anger att svaret ska vara i JSON-format

// Kontrollera om användaren är inloggad
if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'Användaren är inte inloggad']);
    exit;
}

$username = $_SESSION['username'];  // Hämtar det inloggade användarnamnet

try {
    // Anslut till databasen (ändra vid behov)
    $pdo = new PDO("mysql:host=samet-server.adm.huddinge.se;dbname=ekonomi", "samet", "samet");

    // Hämta användarens värde från databasen
    $stmt = $pdo->prepare("SELECT value FROM ekonomi WHERE username = :username");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Returnerar värdet i JSON-svar
        echo json_encode([
            'status' => 'success',
            'value' => $user['value'],
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Användaren hittades inte i databasen']);
    }

} catch (PDOException $e) {
    // Returnerar felmeddelande vid databasfel
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>

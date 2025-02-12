<?php
// Starta sessionen
session_start();

$response = []; // Skapa en array för svaret

// Kontrollera om användaren är inloggad
if (isset($_SESSION['username'])) {
    $response['loggedIn'] = true;  // Användaren är inloggad
    $response['username'] = $_SESSION['username']; // Hämta användarnamnet från sessionen
} else {
    $response['loggedIn'] = false; // Användaren är inte inloggad
}

// Ange att svaret ska vara i JSON-format och skicka tillbaka svaret
header('Content-Type: application/json');
echo json_encode($response);
?>

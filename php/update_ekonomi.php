<?php
session_start();
header('Content-Type: application/json'); // Säkerställ att svaret är i JSON-format
require_once 'db.php'; // Inkludera databasanslutningen

// Kontrollera om användaren är inloggad
if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

$username = $_SESSION['username']; // Hämta den inloggade användarens användarnamn
$action = $_POST['action'] ?? null; // Kontrollera att 'action' är angiven
$amount = isset($_POST['amount']) ? (int)$_POST['amount'] : 0; // Konvertera 'amount' till ett heltal

// Kontrollera om 'action' är giltig och att beloppet är större än 0
if (!$action || $amount <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action or amount']);
    exit;
}

try {
    // Anslut till databasen (byt ut detaljer om det behövs)
    $pdo = new PDO("mysql:host=localhost;dbname=ekonomi", "samet", "samet");

    // Hämta användarens information från tabellen 'ekonomi'
    $stmt = $pdo->prepare("SELECT * FROM ekonomi WHERE username = :username");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) { // Om användaren finns i databasen
        if ($action === 'gain') { // Om användaren får pengar
            $newValue = $user['value'] + $amount; // Lägg till beloppet till användarens saldo
            $newNetWorth = $user['networth']; // Bevara nuvarande net worth

            if ($amount > 0) {
                $newNetWorth = $user['networth'] + $amount; // Öka net worth vid inkomst
            }

            // Uppdatera användarens saldo och net worth i databasen
            $stmt = $pdo->prepare(
                "UPDATE ekonomi SET value = :value, networth = :networth WHERE username = :username"
            );
            $stmt->execute([':value' => $newValue, ':networth' => $newNetWorth, ':username' => $username]);

        } elseif ($action === 'lose') { // Om användaren förlorar pengar
            $newValue = max(0, $user['value'] - $amount); // Säkerställ att värdet inte blir negativt
            $newSpent = $user['spent'] + $amount; // Uppdatera spenderade pengar

            // Uppdatera användarens saldo och utgifter i databasen
            $stmt = $pdo->prepare(
                "UPDATE ekonomi SET value = :value, spent = :spent WHERE username = :username"
            );
            $stmt->execute([':value' => $newValue, ':spent' => $newSpent, ':username' => $username]);
        }
    } else { // Om användaren inte finns i databasen
        if ($action === 'gain') { // Skapa en ny användare om 'gain' används
            $stmt = $pdo->prepare(
                "INSERT INTO ekonomi (username, value, spent, networth) VALUES (:username, :value, 0, :networth)"
            );
            $stmt->execute([':username' => $username, ':value' => $amount, ':networth' => $amount]);
        } else { // Förhindra att en ny användare startar med negativt saldo
            echo json_encode(['status' => 'error', 'message' => 'Cannot lose currency for a new user']);
            exit;
        }
    }

    // Returnera det uppdaterade saldot och net worth för användaren
    echo json_encode(['status' => 'success', 'value' => $newValue, 'networth' => $newNetWorth]);

} catch (PDOException $e) { // Hantera databasfel
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>

<?php
session_start();
header('Content-Type: application/json'); // Ensure JSON response
require_once 'db.php'; // Include your database connection here.

if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

$username = $_SESSION['username']; // Get the logged-in user's username
$action = $_POST['action'] ?? null; // Ensure `action` is provided
$amount = isset($_POST['amount']) ? (int)$_POST['amount'] : 0;

if (!$action || $amount <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action or amount']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=localhost;dbname=ekonomi", "samet", "samet"); // Replace with your DB details.

    // Fetch the current user's details from the 'ekonomi' table
    $stmt = $pdo->prepare("SELECT * FROM ekonomi WHERE username = :username");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // If the user exists, add the amount to their current value
        if ($action === 'gain') {
            $newValue = $user['value'] + $amount; // Add the currency amount to the current value
            $newNetWorth = $user['networth']; // Only increase net worth if gaining currency
            if ($amount > 0) {
                $newNetWorth = $user['networth'] + $amount;
            }

            // Update the user's value and net worth in the database
            $stmt = $pdo->prepare(
                "UPDATE ekonomi SET value = :value, networth = :networth WHERE username = :username"
            );
            $stmt->execute([':value' => $newValue, ':networth' => $newNetWorth, ':username' => $username]);
        } elseif ($action === 'lose') {
            // Handling loss of currency
            $newValue = max(0, $user['value'] - $amount); // Ensure value doesn't go negative
            $newSpent = $user['spent'] + $amount;
            $stmt = $pdo->prepare(
                "UPDATE ekonomi SET value = :value, spent = :spent WHERE username = :username"
            );
            $stmt->execute([':value' => $newValue, ':spent' => $newSpent, ':username' => $username]);
        }
    } else {
        // If the user doesn't exist in the database, create a new user record
        if ($action === 'gain') {
            $stmt = $pdo->prepare(
                "INSERT INTO ekonomi (username, value, spent, networth) VALUES (:username, :value, 0, :networth)"
            );
            $stmt->execute([':username' => $username, ':value' => $amount, ':networth' => $amount]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Cannot lose currency for a new user']);
            exit;
        }
    }

    // Return the updated value and net worth for the logged-in user
    echo json_encode(['status' => 'success', 'value' => $newValue, 'networth' => $newNetWorth]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>

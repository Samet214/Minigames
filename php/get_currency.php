<?php
session_start();
header('Content-Type: application/json');

// Check if the user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => '0']);
    exit;
}

$username = $_SESSION['username'];  // Get the logged-in user's username

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=localhost;dbname=ekonomi", "samet", "samet");  // Change to your DB credentials

    // Fetch the user's currency value from the database
    $stmt = $pdo->prepare("SELECT value FROM ekonomi WHERE username = :username");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Return the user's value in the response
        echo json_encode(['status' => 'success', 'value' => $user['value']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'User not found in database']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>

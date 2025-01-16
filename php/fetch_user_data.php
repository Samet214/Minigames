<?php
header('Content-Type: application/json');

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Database connection
$servername = "localhost";
$db_username = "samet";
$db_password = "samet";

$response = [];

try {
    if (isset($_GET['username'])) {
        $username = $_GET['username'];

        // Connect to användarinformation database
        $conn1 = new mysqli($servername, $db_username, $db_password, "användarinformation");
        if ($conn1->connect_error) {
            throw new Exception('Database connection failed for användarinformation');
        }

        // Query to get level
        $sql1 = "SELECT Levels FROM poängssystem WHERE Namn = ?";
        $stmt1 = $conn1->prepare($sql1);
        $stmt1->bind_param("s", $username);
        $stmt1->execute();
        $result1 = $stmt1->get_result();
        $row1 = $result1->fetch_assoc();

        // Correctly access the column "Levels"
        $response['level'] = $row1['Levels'] ?? null;

        $stmt1->close();
        $conn1->close();

        // Connect to ekonomi database
        $conn2 = new mysqli($servername, $db_username, $db_password, "ekonomi");
        if ($conn2->connect_error) {
            throw new Exception('Database connection failed for ekonomi');
        }

        // Query to get networth
        $sql2 = "SELECT networth FROM ekonomi WHERE username = ?";
        $stmt2 = $conn2->prepare($sql2);
        $stmt2->bind_param("s", $username);
        $stmt2->execute();
        $result2 = $stmt2->get_result();
        $row2 = $result2->fetch_assoc();

        // Correctly access the column "networth"
        $response['networth'] = $row2['networth'] ?? null;

        $stmt2->close();
        $conn2->close();

        echo json_encode($response);
    } else {
        throw new Exception('Username not provided');
    }
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>

<?php
// Start the session to get the current user's username
session_start();

// Check if the user is logged in (make sure the session contains the username)
if (!isset($_SESSION['username'])) {
    echo "0";
    exit; // Stop executing if the user is not logged in
}

$username = $_SESSION['username']; // Get the username from the session

// Database connection details
$host = "localhost"; // Change if needed
$db_username = "samet";  // Database username
$db_password = "samet";      // Database password
$dbname = "ekonomi"; // Database name

// Create a connection
$conn = new mysqli($host, $db_username, $db_password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Query to fetch networth based on the username from session
$sql = "SELECT value FROM ekonomi WHERE username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);  // Use the username from session
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // Fetch the networth value for the logged-in user
    $row = $result->fetch_assoc();
    echo $row['value'];  // Output the networth
} else {
    echo "0"; // Default if no user found
}

$stmt->close();
$conn->close();
?>

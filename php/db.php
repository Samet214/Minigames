<?php
ini_set('display_errors', 0);

function Användarinformation() {
    // Detect the server environment
    $host = $_SERVER['HTTP_HOST'];
    
    if ($host === '192.168.49.238' || strpos($host, '192.168.') === 0) {
        // Remote environment within the network
        $servername = "192.168.49.238"; // IP address of the database server
        $dbUsername = "samet";
        $dbPassword = "samet";
        $dbname = "användarinformation";
    } else {
        // Add more cases if needed for other environments
        die("Access Denied: Unknown environment.");
    }

    // Create a connection
    $conn = new mysqli($servername, $dbUsername, $dbPassword, $dbname);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    return $conn;
}
?>

<?php
ini_set('display_errors', 0);

function Användarinformation() {
    // Default database settings
    $servername = "localhost";
    $dbname = "användarinformation";
    $dbUsername = "samet";  // Default username
    $dbPassword = "samet";  // Default password

    // Get the client IP address
    $clientIP = $_SERVER['REMOTE_ADDR'];

    // Check for specific IP addresses and adjust the servername, username, and password
    if ($clientIP === '192.168.49.238') {
        $servername = "192.168.49.238"; // First exception
        $dbUsername = "samet";
        $dbPassword = "samet";
    } elseif ($clientIP === '192.168.49.218') {
        $servername = "192.168.49.218"; // Second exception
        $dbUsername = "andreas";
        $dbPassword = "andreas";
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

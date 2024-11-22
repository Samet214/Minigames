<?php
ini_set('display_errors', 0);

function Användarinformation() {
    // Default database settings
    $servername = "localhost";
    $dbname = "användarinformation";
    $dbUsername = "samet";  // Default username
    $dbPassword = "samet";  // Default password

    // Get local IP address
    $localIP = trim(shell_exec("hostname -I")); // Remove any trailing whitespace

    // Check for specific IP addresses and adjust the servername, username, and password
    if ($localIP === '192.168.49.238') {
        $dbUsername = "samet";
        $dbPassword = "samet";
    } elseif ($localIP === '192.168.49.218') {
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

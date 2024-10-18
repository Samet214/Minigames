<?php
function Användarinformation() {
    $servername = "localhost";
    $dbUsername = "samet";
    $dbPassword = "samet";
    $dbname = "Användarinformation";

    $conn = new mysqli($servername, $dbUsername, $dbPassword, $dbname);

    if ($conn->connect_error) {
        die("Koppling misslyckad: " . $conn->connect_error);
    }

    return $conn;
}
?>

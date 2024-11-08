<?php
ini_set('display_errors', 0);
function Användarinformation() {
    $servername = "localhost";
    $dbUsername = "samet";
    $dbPassword = "samet";
    $dbname = "användarinformation";

    $conn = new mysqli($servername, $dbUsername, $dbPassword, $dbname);

    return $conn;
}
?>

<?php
ini_set('display_errors', 0); // Inaktivera visning av felmeddelanden

// Funktion för att ansluta till databasen för användarinformation
function Anvandarinformation() {
    // Standardinställningar för databasen
    $servername = "samet-server.adm.huddinge.se";
    $dbname = "användarinformation"; // Databas för användarinformation
    $dbUsername = "samet";  // Standardanvändarnamn
    $dbPassword = "samet";  // Standardlösenord

    // Hämta den lokala IP-adressen
    $localIP = trim(shell_exec("hostname -I")); // Tar bort eventuella tomma tecken i slutet

    // Skapa anslutning
    $conn = new mysqli($servername, $dbUsername, $dbPassword, $dbname);

    // Kontrollera anslutningen
    if ($conn->connect_error) {
        die("Anslutning misslyckades: " . $conn->connect_error);
    }

    return $conn; // Returnerar anslutningsobjektet
}

// Funktion för att ansluta till databasen för ekonomi
function EkonomiDatabase() {
    // Standardinställningar för databasen
    $servername = "samet-server.adm.huddinge.se";
    $dbname = "ekonomi"; // Databas för ekonomi
    $dbUsername = "samet";  // Standardanvändarnamn
    $dbPassword = "samet";  // Standardlösenord

    // Hämta den lokala IP-adressen
    $localIP = trim(shell_exec("hostname -I")); // Tar bort eventuella tomma tecken i slutet

    // Skapa anslutning
    $conn = new mysqli($servername, $dbUsername, $dbPassword, $dbname);

    // Kontrollera anslutningen
    if ($conn->connect_error) {
        die("Anslutning misslyckades: " . $conn->connect_error);
    }

    return $conn; // Returnerar anslutningsobjektet
}
?>

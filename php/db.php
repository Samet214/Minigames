<?php
ini_set('display_errors', 0); // Inaktivera visning av felmeddelanden

// Funktion för att ansluta till databasen för användarinformation
function Anvandarinformation() {
    // Standardinställningar för databasen
    $servername = "localhost";
    $dbname = "användarinformation"; // Databas för användarinformation
    $dbUsername = "samet";  // Standardanvändarnamn
    $dbPassword = "samet";  // Standardlösenord

    // Hämta den lokala IP-adressen
    $localIP = trim(shell_exec("hostname -I")); // Tar bort eventuella tomma tecken i slutet

    // Om den lokala IP-adressen är 192.168.49.218, använd alternativa inställningar
    if ($localIP === '192.168.49.218') {
        $servername = "192.168.49.249"; // Undantag för en annan dator
        $dbUsername = "andreas";
        $dbPassword = "andreas";
    }

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
    $servername = "localhost";
    $dbname = "ekonomi"; // Databas för ekonomi
    $dbUsername = "samet";  // Standardanvändarnamn
    $dbPassword = "samet";  // Standardlösenord

    // Hämta den lokala IP-adressen
    $localIP = trim(shell_exec("hostname -I")); // Tar bort eventuella tomma tecken i slutet

    // Om den lokala IP-adressen är 192.168.49.218, använd alternativa inställningar
    if ($localIP === '192.168.49.218') {
        $servername = "192.168.49.249"; // Undantag för en annan dator
        $dbUsername = "andreas";
        $dbPassword = "andreas";
    }

    // Skapa anslutning
    $conn = new mysqli($servername, $dbUsername, $dbPassword, $dbname);

    // Kontrollera anslutningen
    if ($conn->connect_error) {
        die("Anslutning misslyckades: " . $conn->connect_error);
    }

    return $conn; // Returnerar anslutningsobjektet
}
?>

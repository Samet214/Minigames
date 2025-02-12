<?php
ini_set('display_errors', 0); // Inaktivera felrapportering
// Starta sessionen
session_start();

// Töm alla sessionsvariabler
$_SESSION = array();

// Förstör sessionen
session_destroy();

// Omdirigera användaren till inloggningssidan
header("Location: login.php");
exit;
?>

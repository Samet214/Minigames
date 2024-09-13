<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit();
}

$username = $_SESSION['username'];
?>

<!DOCTYPE html>
<html lang="sv">
<head>
    <title>Välkommen</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>Välkommen <?php echo htmlspecialchars($username); ?></h1>
    <p>Vill du <a href="login.php">logga ut?</a></p>
</body>
</html>

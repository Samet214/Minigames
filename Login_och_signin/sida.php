<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    header("Location: index.php");
    exit();
}

$username = $_SESSION['username'];

$servername = "localhost";
$dbUsername = "samet";
$dbPassword = "samet";
$dbname = "forum";

// Establish connection
$conn = new mysqli($servername, $dbUsername, $dbPassword, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Koppling misslyckad: " . $conn->connect_error);
}

// Handle logout
if (isset($_GET['logout'])) {
    session_unset();
    session_destroy();
    header("Location: index.php");
    exit();
}

// Handle new post
if (isset($_POST['skicka'])) {
    $message = $_POST['msg'];
    $timestamp = date('Y-m-d H:i:s');

    $sql = "INSERT INTO forum (username, messages, timed) VALUES (?, ?, ?)";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("sss", $username, $message, $timestamp);

        if (!$stmt->execute()) {
            echo "Error inserting message: " . $stmt->error;
        }

        $stmt->close();
    } else {
        echo "<br>Kunde inte förbereda SQL: " . $conn->error;
    }
}

// Retrieve and display messages
$sql = "SELECT messages, timed FROM forum WHERE username = ? ORDER BY timed DESC";
if ($stmt = $conn->prepare($sql)) {
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    echo "<br>Kunde inte förbereda SQL: " . $conn->error;
}
?>

<!DOCTYPE html>
<html lang="sv">
<head>
    <title>Välkommen</title>
    <meta charset="utf-8">
    <link href="sida.css?v=1.1" rel="stylesheet" type="text/css">
</head>
<body>
    <p>Vill du <a href="?logout=true">logga ut?</a></p>
    <h1>Ett enkelt forum.</h1>
    <form name="nypost" method="POST" action="">
        <table>
            <tr>
                <td>Meddelande</td>
                <td><label for="msg"></label>
                    <textarea class="textFiled" name="msg" rows="8" id="msg"></textarea></td>
            </tr>
            <tr>
                <td colspan="2"><input type="submit" name="skicka" id="skicka" value="Skicka"></td>
            </tr>
        </table>
        <input type="hidden" name="MM_insert" value="nypost">
    </form>

    <!-- Display the results in a table -->
    <table id="dbres">
        <tr>
            <th>Namn</th>
            <th>Meddelande</th>
            <th>Datum</th>
        </tr>
        <?php while ($row = $result->fetch_assoc()) { ?>
            <tr>
                <td><?php echo htmlspecialchars($username); ?></td>
                <td><?php echo nl2br(htmlspecialchars($row['messages'])); ?></td>
                <td><?php echo htmlspecialchars($row['timed']); ?></td>
            </tr>
        <?php } ?>
    </table>

    <?php
    // Close the database connection
    $stmt->close();
    $conn->close();
    ?>
</body>
</html>

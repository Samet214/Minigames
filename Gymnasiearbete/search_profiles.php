<?php
session_start();
$servername = "localhost";
$username = "samet";
$password = "samet";
$dbname = "Användarinformation";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if (isset($_POST['query'])) {
    $search = $conn->real_escape_string($_POST['query']) . "%"; // Only match the beginning of the name

    // Fetch matching users from the database where the name starts with the search query
    $stmt = $conn->prepare("SELECT Namn FROM Användare WHERE Namn LIKE ?");
    $stmt->bind_param("s", $search);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Output matching usernames
        while ($row = $result->fetch_assoc()) {
            echo "<div>" . htmlspecialchars($row['Namn']) . "</div>";
        }
    } else {
        echo "<div>Ingen konto hittades</div>";
    }

    $stmt->close();
}
$conn->close();
?>

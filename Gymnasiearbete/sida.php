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

if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit();
}

$username = $_SESSION['username'];

// Fetch user data from the database
$query = $conn->prepare("SELECT * FROM Poängssystem WHERE Namn = ?");
$query->bind_param("s", $username);
$query->execute();
$result = $query->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $level = $user['Levels'];
    $current_exp = $user['EXP'];
    $next_level_exp = $user['EXP_GRÄNS'];
} else {
    // User does not exist, create a new entry in the database with default AVI value of 0
    $level = 1;
    $current_exp = 0;
    $next_level_exp = 50;
    $avi = 0;

    $insert = $conn->prepare("INSERT INTO Poängssystem (Namn, Levels, EXP, EXP_GRÄNS, AVI) VALUES (?, ?, ?, ?, ?)");
    $insert->bind_param("siiii", $username, $level, $current_exp, $next_level_exp, $avi);
    $insert->execute();
}

// Handle logout
if (isset($_GET['logout']) && $_GET['logout'] == 'true') {
    session_destroy();
    header("Location: login.php");
    exit();
}

// Handle adding experience
if (isset($_POST['add_exp'])) {
    $expToAdd = intval($_POST['exp_amount']);
    $current_exp += $expToAdd;

    // Check if current EXP reaches or exceeds the required EXP for the next level
    while ($current_exp >= $next_level_exp) {
        $current_exp -= $next_level_exp;
        $level += 1;
        $next_level_exp *= 2; // Increase EXP requirement for the next level
    }

    // Update user data in the database
    $update = $conn->prepare("UPDATE Poängssystem SET Levels = ?, EXP = ?, EXP_GRÄNS = ? WHERE Namn = ?");
    $update->bind_param("iiis", $level, $current_exp, $next_level_exp, $username);
    $update->execute();

    echo json_encode([
        'current_exp' => $current_exp,
        'level' => $level,
        'next_level_exp' => $next_level_exp
    ]);
    exit();
}
?>

<!DOCTYPE html>
<html lang="sv">
<head>
    <title>Välkommen</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="style.css?v=1.3">
    <script src="script.js"></script>
</head>
<body>
    <div class="search-profile-btn-container">
        <button id="searchProfileBtn" onclick="toggleProfile()">Sök profiler</button>
    </div>

    <!-- White Square with Search Bar and Results -->
    <div id="profileSquare" class="profile-square">
        <div class="search-container">
            <input type="text" id="searchInput" placeholder="Sök profiler..." onkeyup="searchProfiles()">
        </div>
        <!-- Container for displaying search results -->
        <div id="searchResults" class="search-results"></div>
    </div>
    <!-- Sidebar and content remain mostly unchanged -->
    <div id="sidebar-toggle" onclick="toggleSidebar()">☰</div>
    <div id="sidebar" class="sidebar">
        <!-- Profile Picture Section (Placeholder for now) -->
        <div class="profile-section">
        <div class="profile-picture">
            <img id="profile-img" src="current-image-url.jpg" alt="Profile Picture">
            <input type="file" id="file-input" accept="image/*" style="display: none;" />
            <div class="overlay">
                <span class="edit-text">Ändra</span>
            </div>
        </div>

            <div class="username">
                <h3><?php echo htmlspecialchars(ucfirst($username)); ?></h3>
            </div>
        </div>
        
        <!-- Level and EXP bar -->
        <div class="level-section">
            <h4>Level <span id="level"><?php echo $level; ?></span></h4>
            <div class="exp-bar">
                <div class="exp-progress" style="width: <?php echo ($current_exp / $next_level_exp) * 100; ?>%;" id="expProgress"></div>
            </div>
            <p id="expText">
                <?php
                function formatNumber($number) {
                    if ($number >= 1000000000) {
                        return round($number / 1000000000, 1) . 'G';
                    } elseif ($number >= 1000000) {
                        return round($number / 1000000, 1) . 'M';
                    } elseif ($number >= 1000) {
                        return round($number / 1000, 1) . 'K';
                    } else {
                        return $number;
                    }
                }

                $formattedCurrentExp = formatNumber($current_exp);
                $formattedNextLevelExp = formatNumber($next_level_exp);

                echo $formattedCurrentExp . '/' . $formattedNextLevelExp . ' EXP';
                ?>
            </p>
        </div>
        <hr>
        <!-- Log out link -->
        <a href="sida.php?logout=true" id="a-tag1"><b>Logga ut</b></a>
        <hr>

    </div>
    
</body>
</html>

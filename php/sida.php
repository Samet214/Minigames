<?php
session_start();
$servername = "localhost";
$username = "samet";
$password = "samet";
$dbname = "Användarinformation";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit();
}

$username = $_SESSION['username'];

session_start();
$servername = "localhost";
$username = "samet";
$password = "samet";
$dbname = "Användarinformation";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit();
}

$username = $_SESSION['username'];

// Handle file upload
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['profile_picture'])) {
    $file = $_FILES['profile_picture'];
    
    // Check for errors
    if ($file['error'] === UPLOAD_ERR_OK) {
        // Get file properties
        $fileTmpPath = $file['tmp_name'];
        $fileName = basename($file['name']);
        $fileSize = $file['size'];
        $fileType = pathinfo($fileName, PATHINFO_EXTENSION);
        
        // Define allowed file types and size
        $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
        $maxFileSize = 2 * 1024 * 1024; // 2MB

        if (in_array($fileType, $allowedTypes) && $fileSize <= $maxFileSize) {
            // Fetch current profile picture from the database
            $query = $conn->prepare("SELECT Profil_bild FROM Användare WHERE Namn = ?");
            $query->bind_param("s", $username);
            $query->execute();
            $result = $query->get_result();
            $user = $result->fetch_assoc();
            $currentProfilePicture = $user['Profil_bild'];

            // Only delete the current profile picture if it's not the default
            if ($currentProfilePicture && $currentProfilePicture !== 'default.png' && file_exists('../pfp/' . $currentProfilePicture)) {
                unlink('../pfp/' . $currentProfilePicture); // Remove old profile picture
            }

            // Generate a unique name for the new uploaded file
            $newFileName = uniqid() . '.' . $fileType;
            $uploadFileDir = '../pfp/';
            $destPath = $uploadFileDir . $newFileName;

            // Move the file to the pfp directory
            if (move_uploaded_file($fileTmpPath, $destPath)) {
                // Update the database with the new file name
                $updateQuery = $conn->prepare("UPDATE Användare SET Profil_bild = ? WHERE Namn = ?");
                $updateQuery->bind_param("ss", $newFileName, $username);
                if ($updateQuery->execute()) {
                    // File successfully uploaded and profile updated
                } else {
                    // Handle database update failure
                }
            } else {
                // Handle file move failure
            }
        } else {
            // Handle invalid file type or size
        }
    } else {
        // Handle file upload error
    }
}



// Fetch user data from the Poängssystem table
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
    // Default values if the user doesn't exist in Poängssystem
    $level = 1;
    $current_exp = 0;
    $next_level_exp = 50;
    $avi = 0;
    $insert = $conn->prepare("INSERT INTO Poängssystem (Namn, Levels, EXP, EXP_GRÄNS, AVI) VALUES (?, ?, ?, ?, ?)");
    $insert->bind_param("siiii", $username, $level, $current_exp, $next_level_exp, $avi);
    $insert->execute();
}

$query = $conn->prepare("SELECT Profil_bild FROM Användare WHERE Namn = ?");
$query->bind_param("s", $username);
$query->execute();
$result = $query->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $profile_picture = $user['Profil_bild'];

    // If the profile picture is NULL or doesn't exist in the pfp folder, use default.png
    if (empty($profile_picture) || !file_exists('../pfp/' . $profile_picture)) {
        $profile_picture = 'default.png';
    }
} else {
    // If the user doesn't exist in Användare, use default profile picture
    $profile_picture = 'default.png';
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

    while ($current_exp >= $next_level_exp) {
        $current_exp -= $next_level_exp;
        $level += 1;
        $next_level_exp *= 2;
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

// Add this at the top of sida.php to handle live search requests
if (isset($_GET['search'])) {
    $searchTerm = $_GET['search'] . '%'; // Adding '%' for wildcard search

    $searchQuery = $conn->prepare("SELECT Namn FROM Användare WHERE Namn LIKE ?");
    $searchQuery->bind_param("s", $searchTerm);
    $searchQuery->execute();
    $result = $searchQuery->get_result();

    $usernames = [];
    while ($row = $result->fetch_assoc()) {
        $usernames[] = $row['Namn'];
    }

    if (empty($usernames)) {
        echo json_encode(['Inga användare']);
    } else {
        echo json_encode($usernames);
    }
    exit();
}


?>


<!DOCTYPE html>
<html lang="sv">
<head>
    <title>Välkommen</title>
    <meta charset="utf-8">
    <link href="../css/sida.css" rel="stylesheet" type="text/css">
</head>
<body>
    <div class="search-profile-btn-container">
        <button id="searchProfileBtn" onclick="toggleProfile()">Sök profiler</button>
    </div>

    <div id="profileSquare" class="profile-square">
        <div class="search-container">
            <input type="text" id="searchInput" placeholder="Sök profiler..." onkeyup="searchProfiles()">
        </div>
        <div id="searchResults" class="search-results"></div>
    </div>

    <div id="sidebar-toggle" onclick="toggleSidebar()">☰</div>
    <div id="sidebar" class="sidebar">
        <!-- Profile Picture Section -->
        <div class="profile-section">
            <div class="username">
            <div class="profile-circle" style="background-image: url('../pfp/<?php echo htmlspecialchars($profile_picture); ?>');" onclick="document.getElementById('profilePictureInput').click();"></div>
            <h3><?php echo htmlspecialchars(ucfirst($username)); ?></h3>
        </div>
        <!-- File input for profile picture upload -->
        <form id="profilePictureForm" action="sida.php" method="POST" enctype="multipart/form-data" style="display: none;">
            <input type="file" name="profile_picture" id="profilePictureInput" accept="image/*" onchange="document.getElementById('profilePictureForm').submit();">
        </form>
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
        <a id="a-tag1" href="logout.php">Logga ut</a>
        <hr>
    </div>
</body>
<script src="../js/sida.js"></script>
</html>

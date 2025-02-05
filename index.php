<?php
session_start();

ini_set('display_errors', 0);

include './php/db.php';

$conn = Anvandarinformation();

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
            $query = $conn->prepare("SELECT Profil_bild FROM användare WHERE Namn = ?");
            $query->bind_param("s", $username);
            $query->execute();
            $result = $query->get_result();
            $user = $result->fetch_assoc();
            $currentProfilePicture = $user['Profil_bild'];

            // Only delete the current profile picture if it's not the default
            if ($currentProfilePicture && $currentProfilePicture !== 'default.png' && file_exists('pfp/' . $currentProfilePicture)) {
                unlink('pfp/' . $currentProfilePicture); // Remove old profile picture
            }

            // Generate a unique name for the new uploaded file
            $newFileName = uniqid() . '.' . $fileType;
            $uploadFileDir = 'pfp/';
            $destPath = $uploadFileDir . $newFileName;

            // Move the file to the pfp directory
            if (move_uploaded_file($fileTmpPath, $destPath)) {
                // Update the database with the new file name
                $updateQuery = $conn->prepare("UPDATE användare SET Profil_bild = ? WHERE Namn = ?");
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



// Fetch user data from the poängssystem table
$query = $conn->prepare("SELECT * FROM poängssystem WHERE Namn = ?");
$query->bind_param("s", $username);
$query->execute();
$result = $query->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $level = $user['Levels'];
    $current_exp = $user['EXP'];
    $next_level_exp = $user['EXP_GRÄNS'];
    $_SESSION['Namn'] = $username;
    $_SESSION['Levels'] = $user['Levels'];
    $_SESSION['EXP'] = $user['EXP'];
    $_SESSION['EXP_GRÄNS'] = $user['EXP_GRÄNS'];
} else {
    // Default values if the user doesn't exist in poängssystem
    $level = 1;
    $current_exp = 0;
    $next_level_exp = 50;
    $username = 'Guest';
    $_SESSION['Namn'] = $username;
    $_SESSION['Levels'] = 1;
    $_SESSION['EXP'] = 0;
    $_SESSION['EXP_GRÄNS'] = 50;
}

$query = $conn->prepare("SELECT Profil_bild FROM användare WHERE Namn = ?");
$query->bind_param("s", $username);
$query->execute();
$result = $query->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $profile_picture = $user['Profil_bild'];

    // If the profile picture is NULL or doesn't exist in the pfp folder, use default.png
    if (empty($profile_picture) || !file_exists('pfp/' . $profile_picture)) {
        $profile_picture = 'default.png';
    }
} else {
    // If the user doesn't exist in användare, use default profile picture
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
    $update = $conn->prepare("UPDATE poängssystem SET Levels = ?, EXP = ?, EXP_GRÄNS = ? WHERE Namn = ?");
    $update->bind_param("iiis", $level, $current_exp, $next_level_exp, $username);
    $update->execute();

    echo json_encode([
        'current_exp' => $current_exp,
        'level' => $level,
        'next_level_exp' => $next_level_exp
    ]);
    exit();
}

// Add this at the top of spel.php to handle live search requests
if (isset($_GET['search'])) {
    $searchTerm = $_GET['search'] . '%';

    // Join användare and poängssystem tables to fetch profile and level data
    $searchQuery = $conn->prepare("SELECT användare.Namn, Profil_bild, Levels, EXP, EXP_GRÄNS 
                                    FROM användare 
                                    JOIN poängssystem ON användare.Namn = poängssystem.Namn 
                                    WHERE användare.Namn LIKE ?");
    $searchQuery->bind_param("s", $searchTerm);
    $searchQuery->execute();
    $result = $searchQuery->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = [
            'Namn' => $row['Namn'],
            'Profil_bild' => $row['Profil_bild'],
            'Levels' => $row['Levels'],
            'EXP' => $row['EXP'],
            'EXP_GRÄNS' => $row['EXP_GRÄNS']
        ];
    }

    echo empty($data) ? json_encode(['message' => 'Inga användare']) : json_encode($data);
    exit();
}
?>

<?php

$conn = Anvandarinformation();

$query = "SELECT Levels, EXP, EXP_GRÄNS FROM poängssystem WHERE Namn = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("s", $username);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $level = $row['Levels'];
        $exp = $row['EXP'];
        $exp_req = $row['EXP_GRÄNS'];
    }
} else {
    
}

$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html data-page="index">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="style.css" type="text/css" rel="stylesheet">
    <title>Arcade Point</title>
</head>
<body>
    <header id="header">
        <div id="circle-container" style="position: relative; display: inline-block;">
            <img id="logo" src="bilder/Logotyp.png" alt="Logo" style="width: 80px; height: auto;">
            <div id="hover-circle"></div>
        </div>
        <div id="container1">
            <div id="logo-title">
                <h1>Arcade Point</h1>
            </div>
            <div class="buttons">
            <?php if (!isset($_SESSION['username'])): ?>
                <nav style="margin-right: 500px;">
                    <ul>
                        <li><a href="../minigames/php/spel.php">Spel</a></li>
                        <li><a href="../minigames/php/topplista.php">Topplista</a></li>
                    </ul>
                </nav>
                <div class="search-profile-btn-container" style="display: flex; justify-content: space-between; gap: 15px;">
                    <button id="signin" onclick="redirect('../minigames/php/signup.php')">Registrera</button>
                    <button id="login" onclick="redirect('../minigames/php/login.php')">Logga in</button>
                </div>
            <?php else: ?>
                <nav style="margin-right: 600px;">
                    <ul>
                        <li><a href="../minigames/php/spel.php">Spel</a></li>
                        <li><a href="../minigames/php/topplista.php">Topplista</a></li>
                    </ul>
                </nav>
                <div class="search-profile-btn-container" style="display: flex; justify-content: space-between; gap: 15px;">
                    <button id="searchProfileBtn" onclick="toggleProfile()">Sök profiler</button>
                </div>
            <?php endif; ?>
            </div>
        </div>
        <div id="currency-bar">
            <span id="currency-amount">0</span>
            <img src="bilder/mynt.png" id="currency-icon" alt="Coin Icon">
        </div>
    </header>

    <!-- Main Content Section -->
    <main>
        <section class="rectangle-container">
            <div class="rectangle-1">
                <div><b style="margin-left: 20px;">POPULÄRA KATEGORIER</b></div>
                <div id="category-1">
                    <img src="https://www.coolmathgames.com/themes/custom/coolmath/assets/svg/categories/Timing.svg" style="margin-right: 200px;">
                    <b style="margin-top: -80px; margin-left: 120px;">Tid<br>Spel</b>
                    <div id="arrow">→</div>
                </div>
                <div id="category-2"></div>
                <div id="category-3"></div>
                <div id="category-4"></div>
                <div id="category-5"></div>
                <div id="category-6"></div>
            </div>
            <div class="rectangle-2"></div>
            <div class="rectangle-3"></div>
            <div class="rectangle-4"></div>
            <div class="rectangle-5"></div>
            <div class="rectangle-6"></div>
        </section>
    </main>
    <footer>
        <p>Kontakta oss</p>
        <p>Email: kontakt@arcadepoint.com</p>
        <p>Tel: +46 123456789</p>
        <p>Senast uppdaterad: 2024-10-08</p>
    </footer>

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
            <div class="profile-circle" style="background-image: url('pfp/<?php echo htmlspecialchars($profile_picture); ?>');" onclick="document.getElementById('profilePictureInput').click();"></div>
            <h3><?php echo htmlspecialchars(ucfirst($username)); ?></h3>
        </div>
        <!-- File input for profile picture upload -->
        <form id="profilePictureForm" action="index.php" method="POST" enctype="multipart/form-data" style="display: none;">
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
        <?php if (!isset($_SESSION['username'])): ?>

        <?php else: ?>
            <hr>
            <a id="a-tag1" href="../minigames/php/logout.php">Logga ut</a>
            <hr>
        <?php endif; ?>
    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>" data-username="<?php echo htmlspecialchars($username); ?>"></div>
    <script src="script.js"></script>
</body>
</html>

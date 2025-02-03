<?php
session_start();

ini_set('display_errors', 0);

include 'db.php';

$conn = Användarinformation();

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
    if (empty($profile_picture) || !file_exists('../pfp/' . $profile_picture)) {
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
$conn = Användarinformation();

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
<html data-page="topplista">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="../style.css" type="text/css" rel="stylesheet">
    <title>Spel</title>
</head>
<body>
    <header id="header">
        <div id="circle-container" style="position: relative; display: inline-block;">
            <img id="logo" src="../bilder/Logotyp.png" alt="Logo" style="width: 80px; height: auto;">
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
                        <li><a href="spel.php">Spel</a></li>
                        <li><a href="topplista.php">Topplista</a></li>
                    </ul>
                </nav>
                <div class="search-profile-btn-container" style="display: flex; justify-content: space-between; gap: 15px;">
                    <button id="signin" onclick="redirect('signup.php')">Registrera</button>
                    <button id="login" onclick="redirect('login.php')">Logga in</button>
                    <button id="searchProfileBtn" onclick="toggleProfile()">Sök profiler</button>
                </div>
            <?php else: ?>
                <nav style="margin-right: 600px;">
                    <ul>
                        <li><a href="spel.php">Spel</a></li>
                        <li><a href="topplista.php">Topplista</a></li>
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
            <img src="../bilder/mynt.png" id="currency-icon" alt="Coin Icon">
        </div>
    </header>

    <main id="leaderboard-container">
        <section id="leaderboard-grid">
            <div id="leaderboard-navigation">
                <button id="left-button" disabled>Previous</button>
                <div id="leaderboard-text">Welcome to the Leaderboard</div>
                <button id="right-button">Next</button>
            </div>
            <div class="leaderboard-tile"></div>
            <div class="leaderboard-tile"></div>
            <div class="leaderboard-tile"></div>
            <div class="leaderboard-tile"></div>
            <div class="leaderboard-tile"></div>
            <div class="leaderboard-tile"></div>
        </section>
    </main>

    <div id="sidebar-toggle" onclick="toggleSidebar()">☰</div>
    <div id="sidebar" class="sidebar">
        <!-- Profile Picture Section -->
        <div class="profile-section">
            <div class="username">
            <div class="profile-circle" style="background-image: url('../pfp/<?php echo htmlspecialchars($profile_picture); ?>');" onclick="document.getElementById('profilePictureInput').click();"></div>
            <h3><?php echo htmlspecialchars(ucfirst($username)); ?></h3>
        </div>
        <!-- File input for profile picture upload -->
        <form id="profilePictureForm" action="spel.php" method="POST" enctype="multipart/form-data" style="display: none;">
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
            <a id="a-tag1" href="logout.php">Logga ut</a>
            <hr>
        <?php endif; ?>

    <style>
 ::-webkit-scrollbar {
    display: none; /* Hide the scrollbar */
}

 body {
font-family: 'Arial', sans-serif;
background-color: #f7f7f7;
color: #333;
margin: 0;
padding: 0;
text-align: center;
background-size: cover;
}

 #sidebar-toggle {
position: fixed;
top: 100px; /* Adjust this to be just below the header */
left: 10px;
font-size: 30px;
cursor: pointer;
background-color: black;
color: white;
padding: 10px;
border-radius: 5px;
z-index: 1000;
transition: left 0.5s;
}

/* Sidebar */
 .sidebar {
height: 89%;
width: 0;
position: fixed;
top: 80px;
left: 0;
background-color: black;
color: white;
overflow-x: hidden;
transition: width 0.5s;
padding-top: 20px;
box-shadow: 3px 0px 10px rgba(0, 0, 0, 0.5);
}

 .sidebar.open {
width: 250px;
}

/* Profile Section */
 .profile-section {
display: flex;
align-items: center;
padding: 20px;
border-bottom: 1px solid white;
}

/* Level Section */
 .level-section {
padding: 20px;
}

 .level-section h4 {
margin: 0;
color: #ffcc00;
}

 .exp-bar {
width: 100%;
height: 15px;
background-color: #333;
border-radius: 10px;
margin: 10px 0;
}

 .exp-progress {
height: 100%;
background-color: #ffcc00;
border-radius: 10px;
}

 .exp-bar2 {
width: 350%;
height: 15px;
background-color: #333;
border-radius: 10px;
margin: 10px auto; /* Center the element horizontally */
transform: translateX(-37%);
}


 .exp-progress2 {
height: 100%;
background-color: #ffcc00;
border-radius: 10px;
}

/* Level Text */
 .level-section p {
margin: 0;
color: white;
}

 #a-tag1 {
color: white;
text-decoration: none;
}

/* Position the button to the top right of the screen */
 .search-profile-btn-container {
position: fixed;
top: 20px;
right: 30px;
z-index: 1000; /* Ensure it stays on top */
}

 #searchResults {
margin-top: 10px;
}

/* Styling for the button */
 #searchProfileBtn {
background-color: #1e90ff; /* Electric blue */
color: white; /* White text */
border: none;
padding: 10px 5px;
font-size: 16px;
cursor: pointer;
border-radius: 10px; /* More rounded corners */
font-family: 'Arial', sans-serif; /* Clean, modern font */
text-transform: uppercase; /* Make text uppercase */
font-weight: bold;
letter-spacing: 2px; /* Make the text more spaced out */
box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3), 0 0 15px #00ffea, 0 0 25px #00ffea; /* Add a glowing effect */
transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease;
}

 #searchProfileBtn:hover {
background-color: #00ccff; /* Brighter blue on hover */
transform: translateY(-5px); /* Move the button up slightly on hover */
box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), 0 0 20px #00ffea, 0 0 35px #00ffea; /* Enhance glow on hover */
}

 #searchProfileBtn:active {
transform: translateY(0); /* Reset position when pressed */
box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3), 0 0 15px #00ffea, 0 0 25px #00ffea; /* Reset glow when pressed */
}

/* White square hidden by default */
 .profile-square {
width: 300px;
height: 270px;
background-color: white;
position: fixed;
top: 60px; /* Below the button */
right: 9px;
display: none; /* Initially hidden */
box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
border-radius: 10px;
z-index: 999; /* High z-index to overlay other elements */
opacity: 0; /* Start as invisible */
transition: opacity 0.3s ease, transform 0.3s ease; /* Smooth fade and movement */
}

/* Visible state for the square */
 .profile-square.active {
display: block;
opacity: 1;
transform: translateY(10px); /* Slight move-in effect */
}

/* Search container */
 .search-container {
position: relative;
width: 90%;
left: 15px;
}

/* Search input box */
 #searchInput {
width: 80%;
padding: 10px 40px 10px 10px; /* Space for the search icon */
font-size: 14px;
border: 2px solid #1e90ff; /* Match the button's color */
border-radius: 5px;
outline: none;
box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Subtle shadow */
transition: border-color 0.3s ease; /* Smooth border color transition */
margin-top: 20px;
}

/* Change border color on focus */
 #searchInput:focus {
border-color: #00ccff;
}

 .username {
display: flex;
align-items: flex-start; /* Align items to the start */
}

 .profile-circle {
width: 68px; /* Adjust size as needed */
height: 68px; /* Adjust size as needed */
border-radius: 50%; /* Makes the image circular */
background-position: center;
background-size: cover; /* Ensures the image covers the circle */
background-repeat: no-repeat;
cursor: pointer;
margin-top: -27px;
margin-right: 10px;
margin-left: -10px;
}


 .username h3 {
font-size: 1.5em; /* Larger font size for better visibility */
font-family: Arial, sans-serif; /* Font family for a modern look */
margin-top: -10px; /* Move the username text up */
}

 .result-item {
display: flex;
align-items: center;
border-bottom: 1px solid #ddd;
margin: 4px 0;
width: 90%;
margin-left: 5%;
padding: 4px 0;
transition: background-color 0.3s ease, font-size 0.3s ease;
}

 .result-item:hover {
font-size: 1.05em;
background-color: #f9f9f9;
border-radius: 8px;
cursor: pointer;
}

 .profile-image {
width: 40px;
height: 40px;
border-radius: 50%;
object-fit: cover;
border: 2px solid black;
margin-right: 8px;
transition: transform 0.3s ease, border-color 0.3s ease;
}

/* Apply hover effect to profile-image when result-item is hovered */
 .result-item:hover  .profile-image {
transform: scale(1.1);
border-color: #007bff;
}

 .result-item:hover  .username {
color: #007bff; /* Light blue on hover */
}

 .search-results {
max-height: 180px;
overflow-y: auto;
background-color: white;
padding: 8px;
border-radius: 8px;
}

 .close-button {
background-color: transparent;
border: none;
font-size: 20px;
font-weight: bold;
cursor: pointer;
position: absolute;
top: 10px;
right: 10px;
}

 .circle-profile {
width: 80px;
height: 80px;
border-radius: 50%;
border: 2px solid black;
margin-left: 40%;
}

 .selected-profile-container {
display: flex;
flex-direction: column;
align-items: center; /* Center items horizontally */
text-align: center; /* Center text */
}

 .selected-profile-circle {
width: 80px;
height: 80px;
border-radius: 50%;
transition: transform 0.3s ease-in, box-shadow 0.3s ease-in, translate 0.3s ease-in;
}

 .selected-profile-circle:hover {
transform: scale(1.05);
transform: translateY(-3px);
box-shadow: 0px 0px 10px #ffcc00;
border-radius: 50%;
}

 .selected-profile-circle:hover {
transform: scale(1.05);
transform: translateY(-3px);
box-shadow: 0px 0px 10px #ffcc00;
border-radius: 50%;
}

 .username2 {
margin-top: 10px; /* Space between image and text */
font-size: 20px;
font-family: Arial, Helvetica, sans-serif;
font-weight: bold;
text-transform: capitalize;
color: black;
}

 .level-section2 p {
color: black; /* Or your preferred text color */
position: absolute; /* Absolute positioning */
top: 0; /* Position it at the top of the parent container */
left: 50%; /* Center horizontally */
transform: translateX(-50%); /* Center horizontally */
z-index: 10; /* Higher z-index to ensure it's on top */
margin-top: 190px;
}

 .level-section2 h4 {
color: #ffcc00;
margin-bottom: 0px;
margin-top: 10px;
}

 .messagebutton {
position: absolute;
width: 120px;
height: 43px;
background-color: #007bff; /* Classic blue */
color: white;
top: 215px;
left: 20px;
border: none; /* Optional: remove border for a cleaner look */
border-radius: 5px; /* Optional: add slight rounding to corners */
transition: background-color 0.3s, transform 0.3s; /* Smooth transition */
}

 .messagebutton:hover {
background-color: #0056b3; /* Darker tone of blue on hover */
transform: translateY(-3px) scale(1.03); /* Combined transform for smoother effect */
}


/* Input field for writing messages */
 .message-input {
width: calc(100% - 90px); /* Leave space for the button */
padding: 10px;
border-radius: 20px;
border: 1px solid #dcdcdc;
font-size: 14px;
outline: none;
box-sizing: border-box;
transition: all 0.3s;
}

/* Input focus state */
 .message-input:focus {
border-color: #8ab4f8; /* Light blue on focus */
box-shadow: 0 0 5px rgba(138, 180, 248, 0.5);
}

/* Send button */
 .send-button {
margin-top: 180px;
padding: 10px 20px;
background-color: #4CAF50; /* Green background */
color: #fff;
border: none;
border-radius: 20px;
cursor: pointer;
font-size: 14px;
font-weight: bold;
margin-left: 10px;
transition: background-color 0.3s ease, transform 0.2s ease;
}

/* Send button hover and active states */
 .send-button:hover {
background-color: #45A049; /* Darker green on hover */
}

 .send-button:active {
transform: scale(0.98); /* Slightly shrink on click */
}

/* Close button styling */
 .close-button {
position: absolute;
top: 10px;
right: 10px;
background-color: transparent;
border: none;
font-size: 18px;
color: #888;
cursor: pointer;
transition: color 0.2s ease;
}

 .close-button:hover {
color: #333;
}
</style>

    <div id="profileSquare" class="profile-square">
        <div class="search-container">
            <input type="text" id="searchInput" placeholder="Sök profiler..." onkeyup="searchProfiles()">
        </div>
        <div id="searchResults" class="search-results"></div>
    </div>

    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>" data-username="<?php echo htmlspecialchars($username); ?>"></div>
    <script src="../script.js"></script>
</body>
</html>

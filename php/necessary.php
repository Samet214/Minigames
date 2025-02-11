<?php
session_start();

ini_set('display_errors', 0);

include 'db.php';

$conn = Anvandarinformation();

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
    $insert = $conn->prepare("INSERT INTO poängssystem (Namn, Levels, EXP, EXP_GRÄNS) VALUES (?, ?, ?, ?)");
    $insert->bind_param("siii", $username, $level, $current_exp, $next_level_exp);
    $insert->execute();
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

// Add this at the top of sida.php to handle live search requests
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
    echo "No data found";
}

$stmt->close();
$conn->close();
?>
<?php
session_start(); // Startar en session för att hålla koll på användarinformation

ini_set('display_errors', 0); // Stänger av felmeddelanden för säkerhet och en renare upplevelse

include 'db.php'; // Inkluderar filen som hanterar databasanslutningen

$conn = Anvandarinformation(); // Skapar en anslutning till databasen

// Kontrollera om användaren är inloggad
if (!isset($_SESSION['username'])) {
    header("Location: login.php"); // Om inte inloggad, omdirigera till login-sidan
    exit();
}

$username = $_SESSION['username']; // Hämtar användarnamnet från sessionen

// Hantering av filuppladdning (profilbild)
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['profile_picture'])) {
    $file = $_FILES['profile_picture'];

    // Kontrollera om det finns några fel vid uppladdning
    if ($file['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $file['tmp_name']; // Temporär filväg
        $fileName = basename($file['name']); // Filens ursprungliga namn
        $fileSize = $file['size']; // Filstorlek
        $fileType = pathinfo($fileName, PATHINFO_EXTENSION); // Filtyp (t.ex. jpg, png)

        // Definiera tillåtna filtyper och maxstorlek
        $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
        $maxFileSize = 2 * 1024 * 1024; // Maxstorlek: 2 MB

        if (in_array($fileType, $allowedTypes) && $fileSize <= $maxFileSize) {
            // Hämta aktuell profilbild från databasen
            $query = $conn->prepare("SELECT Profil_bild FROM användare WHERE Namn = ?");
            $query->bind_param("s", $username);
            $query->execute();
            $result = $query->get_result();
            $user = $result->fetch_assoc();
            $currentProfilePicture = $user['Profil_bild'];

            // Radera den gamla profilbilden om den inte är standardbilden
            if ($currentProfilePicture && $currentProfilePicture !== 'default.png' && file_exists('../pfp/' . $currentProfilePicture)) {
                unlink('../pfp/' . $currentProfilePicture); // Radera den gamla bilden
            }

            // Skapa ett unikt namn för den nya filen
            $newFileName = uniqid() . '.' . $fileType;
            $uploadFileDir = '../pfp/';
            $destPath = $uploadFileDir . $newFileName;

            // Flytta filen till pfp-katalogen
            if (move_uploaded_file($fileTmpPath, $destPath)) {
                // Uppdatera databasen med det nya filnamnet
                $updateQuery = $conn->prepare("UPDATE användare SET Profil_bild = ? WHERE Namn = ?");
                $updateQuery->bind_param("ss", $newFileName, $username);
                if ($updateQuery->execute()) {
                    // Profilbilden har uppdaterats
                } else {
                    // Hantera misslyckad databasuppdatering
                }
            } else {
                // Hantera misslyckat filflytt
            }
        } else {
            // Hantera ogiltig filtyp eller storlek
        }
    } else {
        // Hantera filuppladdningsfel
    }
}

// Hämta användarens data från poängssystem-tabellen
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
    // Standardvärden om användaren inte finns i poängssystem
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

// Hämta profilbilden för användaren
$query = $conn->prepare("SELECT Profil_bild FROM användare WHERE Namn = ?");
$query->bind_param("s", $username);
$query->execute();
$result = $query->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $profile_picture = $user['Profil_bild'];

    // Använd standardbild om profilbilden är tom eller inte finns i pfp-katalogen
    if (empty($profile_picture) || !file_exists('../pfp/' . $profile_picture)) {
        $profile_picture = 'default.png';
    }
} else {
    $profile_picture = 'default.png'; // Standardprofilbild om användaren inte finns
}

// Hantera utloggning
if (isset($_GET['logout']) && $_GET['logout'] == 'true') {
    session_destroy(); // Avsluta sessionen
    header("Location: login.php"); // Omdirigera till login-sidan
    exit();
}

// Hantera tillägg av erfarenhetspoäng
if (isset($_POST['add_exp'])) {
    $expToAdd = intval($_POST['exp_amount']);
    $current_exp += $expToAdd;

    // Nivåuppgradering vid tillräcklig erfarenhet
    while ($current_exp >= $next_level_exp) {
        $current_exp -= $next_level_exp;
        $level += 1;
        $next_level_exp *= 2;
    }

    // Uppdatera användardata i databasen
    $update = $conn->prepare("UPDATE poängssystem SET Levels = ?, EXP = ?, EXP_GRÄNS = ? WHERE Namn = ?");
    $update->bind_param("iiis", $level, $current_exp, $next_level_exp, $username);
    $update->execute();

    // Returnera uppdaterad data som JSON
    echo json_encode([
        'current_exp' => $current_exp,
        'level' => $level,
        'next_level_exp' => $next_level_exp
    ]);
    exit();
}

// Hantera live-sökning efter användare
if (isset($_GET['search'])) {
    $searchTerm = $_GET['search'] . '%';

    // Sök efter användare och deras nivåinformation
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

    // Returnera resultatet som JSON
    echo empty($data) ? json_encode(['message' => 'Inga användare']) : json_encode($data);
    exit();
}

// Hämta nivå- och erfarenhetsinformation för användaren
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
    echo "No data found"; // Om ingen data hittas
}

$stmt->close(); // Stänger statement
$conn->close(); // Stänger databasanslutningen
?>

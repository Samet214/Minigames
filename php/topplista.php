<?php
session_start(); // Starta sessionen för att hantera inloggning

ini_set('display_errors', 0); // Dölj felmeddelanden för att förbättra säkerheten

include 'db.php'; // Inkludera databasanslutningsfilen

$conn = Anvandarinformation(); // Hämta databaskopplingen

$username = $_SESSION['username']; // Hämta den inloggade användarens namn

// Hantera uppladdning av profilbild
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['profile_picture'])) {
    $file = $_FILES['profile_picture'];

    // Kontrollera om det finns några fel vid uppladdningen
    if ($file['error'] === UPLOAD_ERR_OK) {
        // Hämta filens egenskaper
        $fileTmpPath = $file['tmp_name'];
        $fileName = basename($file['name']);
        $fileSize = $file['size'];
        $fileType = pathinfo($fileName, PATHINFO_EXTENSION);
        
        // Definiera tillåtna filtyper och maximal filstorlek
        $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
        $maxFileSize = 2 * 1024 * 1024; // Max 2MB

        if (in_array($fileType, $allowedTypes) && $fileSize <= $maxFileSize) {
            // Hämta nuvarande profilbild från databasen
            $query = $conn->prepare("SELECT Profil_bild FROM användare WHERE Namn = ?");
            $query->bind_param("s", $username);
            $query->execute();
            $result = $query->get_result();
            $user = $result->fetch_assoc();
            $currentProfilePicture = $user['Profil_bild'];

            // Radera den gamla profilbilden om den inte är standardbilden
            if ($currentProfilePicture && $currentProfilePicture !== 'default.png' && file_exists('../pfp/' . $currentProfilePicture)) {
                unlink('../pfp/' . $currentProfilePicture);
            }

            // Generera ett unikt filnamn för den nya uppladdade filen
            $newFileName = uniqid() . '.' . $fileType;
            $uploadFileDir = '../pfp/';
            $destPath = $uploadFileDir . $newFileName;

            // Flytta den uppladdade filen till pfp-mappen
            if (move_uploaded_file($fileTmpPath, $destPath)) {
                // Förbered SQL-fråga för att uppdatera databasen med det nya filnamnet
                $updateQuery = $conn->prepare("UPDATE användare SET Profil_bild = ? WHERE Namn = ?");
                $updateQuery->bind_param("ss", $newFileName, $username);
                if ($updateQuery->execute()) {
                    // Filen har laddats upp och profilen har uppdaterats framgångsrikt
                } else {
                    // Hantera fel vid uppdatering av databasen
                }
            } else {
                // Hantera fel om filen inte kunde flyttas till pfp-mappen
            }
        } else {
            // Hantera ogiltig filtyp eller filstorlek som överstiger gränsen
        }
    } else {
        // Hantera eventuella fel vid filuppladdning
    }
}



// Hämta användardata från poängssystemstabellen
$query = $conn->prepare("SELECT * FROM poängssystem WHERE Namn = ?");
$query->bind_param("s", $username);
$query->execute();
$result = $query->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $level = $user['Levels'];
    $current_exp = $user['EXP'];
    $next_level_exp = $user['EXP_GRÄNS'];

    // Spara användarens uppgifter i sessionen
    $_SESSION['Namn'] = $username;
    $_SESSION['Levels'] = $level;
    $_SESSION['EXP'] = $current_exp;
    $_SESSION['EXP_GRÄNS'] = $next_level_exp;
} else {
    // Standardvärden om användaren inte finns i poängssystemet
    $level = 1;
    $current_exp = 0;
    $next_level_exp = 50;
    $username = 'Guest';

    $_SESSION['Namn'] = $username;
    $_SESSION['Levels'] = 1;
    $_SESSION['EXP'] = 0;
    $_SESSION['EXP_GRÄNS'] = 50;
}

// Hämta profilbild från databasen
$query = $conn->prepare("SELECT Profil_bild FROM användare WHERE Namn = ?");
$query->bind_param("s", $username);
$query->execute();
$result = $query->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $profile_picture = $user['Profil_bild'];

    // Om profilbilden saknas eller inte finns i mappen, använd standardbild
    if (empty($profile_picture) || !file_exists('../pfp/' . $profile_picture)) {
        $profile_picture = 'default.png';
    }
} else {
    $profile_picture = 'default.png';
}

// Hantera utloggning
if (isset($_GET['logout']) && $_GET['logout'] == 'true') {
    session_destroy(); // Förstör sessionen
    header("Location: login.php"); // Omdirigera till inloggningssidan
    exit();
}

// Hantera tillägg av erfarenhetspoäng (EXP)
if (isset($_POST['add_exp'])) {
    $expToAdd = intval($_POST['exp_amount']);
    $current_exp += $expToAdd;

    // Öka nivån om EXP överstiger gränsen
    while ($current_exp >= $next_level_exp) {
        $current_exp -= $next_level_exp;
        $level += 1;
        $next_level_exp *= 2; // EXP-gränsen fördubblas vid varje nivå
    }

    // Uppdatera användarens data i databasen
    $update = $conn->prepare("UPDATE poängssystem SET Levels = ?, EXP = ?, EXP_GRÄNS = ? WHERE Namn = ?");
    $update->bind_param("iiis", $level, $current_exp, $next_level_exp, $username);
    $update->execute();

    // Skicka uppdaterade värden som JSON-svar
    echo json_encode([
        'current_exp' => $current_exp,
        'level' => $level,
        'next_level_exp' => $next_level_exp
    ]);
    exit();
}

// Hantera live-sökning av profiler
if (isset($_GET['search'])) {
    $searchTerm = $_GET['search'] . '%';

    // Hämta användare och deras nivådata från databasen
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

// Hämta användarens nivå och erfarenhetspoäng
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

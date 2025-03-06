<?php
session_start();

ini_set('display_errors', 0);

include 'db.php';

$conn = Anvandarinformation();

$username = $_SESSION['username'];

// Hantera fil uppladning  
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['profile_picture'])) {
    $file = $_FILES['profile_picture'];
    
    // Kontroller för felmeddelanden
    if ($file['error'] === UPLOAD_ERR_OK) {
        // Hämta filens egenskaper
        $fileTmpPath = $file['tmp_name'];
        $fileName = basename($file['name']);
        $fileSize = $file['size'];
        $fileType = pathinfo($fileName, PATHINFO_EXTENSION);
        
        // Definiera tillåtna filtyper och maxstorlek
        $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
        $maxFileSize = 2 * 1024 * 1024; // 2MB

        if (in_array($fileType, $allowedTypes) && $fileSize <= $maxFileSize) {
            // Hämta nuvarande profilbild från databasen
            $query = $conn->prepare("SELECT Profil_bild FROM användare WHERE Namn = ?");
            $query->bind_param("s", $username);
            $query->execute();
            $result = $query->get_result();
            $user = $result->fetch_assoc();
            $currentProfilePicture = $user['Profil_bild'];

            // Ta endast bort nuvarande profilbild om den inte är standard
            if ($currentProfilePicture && $currentProfilePicture !== 'default.png' && file_exists('../pfp/' . $currentProfilePicture)) {
                unlink('../pfp/' . $currentProfilePicture); // Remove old profile picture
            }

            // Skapa ett unikt filnamn för den nya uppladdade filen
            $newFileName = uniqid() . '.' . $fileType;
            $uploadFileDir = '../pfp/';
            $destPath = $uploadFileDir . $newFileName;

            // Flytta filen till pfp-mappen
            if (move_uploaded_file($fileTmpPath, $destPath)) {
                // Uppdatera databasen med det nya filnamnet
                $updateQuery = $conn->prepare("UPDATE användare SET Profil_bild = ? WHERE Namn = ?");
                $updateQuery->bind_param("ss", $newFileName, $username);
                if ($updateQuery->execute()) {
                    // Filen har laddats upp och profilen har uppdaterats
                } else {
                    // Hantera fel vid uppdatering av databasen
                }
            } else {
                // Hantera fel vid flytt av filen
            }
        } else {
            // Hantera ogiltig filtyp eller storlek
        }
    } else {
        // Hantera filuppladdningsfel
    }
}



// Hämta användardata från tabellen poängssystem
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

    // Om profilbilden är NULL eller inte finns i pfp-mappen, använd default.png
    if (empty($profile_picture) || !file_exists('../pfp/' . $profile_picture)) {
        $profile_picture = 'default.png';
    }
} else {
    // Om användaren inte finns i användare-tabellen, använd standardprofilbild
    $profile_picture = 'default.png';
}

// Hantera utloggning
if (isset($_GET['logout']) && $_GET['logout'] == 'true') {
    session_destroy();
    header("Location: login.php");
    exit();
}

// Hantera tillägg av erfarenhetspoäng (EXP)
if (isset($_POST['add_exp'])) {
    $expToAdd = intval($_POST['exp_amount']);
    $current_exp += $expToAdd;

    while ($current_exp >= $next_level_exp) {
        $current_exp -= $next_level_exp;
        $level += 1;
        $next_level_exp *= 2;
    }

    // Öka nivån om spelaren når gränsen
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

// Hantera livesökning av användare
if (isset($_GET['search'])) {
    $searchTerm = $_GET['search'] . '%';

    // Koppla samman tabellerna användare och poängssystem för att hämta profil- och nivådata
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
// Hämta nivå, erfarenhet och erfarenhetsgräns från databasen
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
} else {  // Ingen data hittades, kan hanteras vid behov

    
    
}

$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html data-page="spel">
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

    <!-- Spel sektion -->
    <main class="game-section">
        <div class="game-container">
            <h2>Memory</h2>
            <p>Testa hur mycket du kan komma ihåg och tävla mot andra</p>
            <button class="open-modal-button" onclick="openModal('game1')">Spela Nu</button>
        </div>
        <div class="game-container">
            <h2>Squigglegolf</h2>
            <p>Ha roligt med att köra golf och kontrollera bollen genom musen. Ha roligt med boll fysik och fina grafiska element på skärmen!</p>
            <button class="open-modal-button" onclick="openModal('game2')">Spela Nu</button>
        </div>
        <div class="game-container">
            <h2>Colourvision</h2>
            <p>Testa om du kan se nyanser av färger eller om du är färg blind!</p>
            <button class="open-modal-button" onclick="openModal('game3')">Spela Nu</button>
        </div>
        <div class="game-container">
            <h2>Maze runner</h2>
            <p>Klura dig igenom svåra labyrinter och hitta den rätta vägen!</p>
            <button class="open-modal-button" onclick="openModal('game4')">Spela Nu</button>
        </div>
        <div class="game-container">
            <h2>Biljard</h2>
            <p>Ha roligt med att spela biljard!</p>
            <button class="open-modal-button" onclick="openModal('game5')">Spela Nu</button>
        </div>
    </main>

    <!-- Overlay och Modal -->
    <div id="overlay" onclick="closeModal()">
        <div id="modal" onclick="event.stopPropagation()">
            <button id="full-screen-button" onclick="toggleFullScreen(event)">
                <svg class="icon icon-fullscreen icon-lg" width="28" height="32" viewBox="0 0 28 32" aria-hidden="true"><path d="M0 11.25V3.5C0 2.669.669 2 1.5 2h7.75c.412 0 .75.337.75.75v2.5c0 .412-.338.75-.75.75H4v5.25c0 .412-.337.75-.75.75H.75a.753.753 0 0 1-.75-.75zm18-8.5v2.5c0 .412.337.75.75.75H24v5.25c0 .412.337.75.75.75h2.5c.413 0 .75-.338.75-.75V3.5c0-.831-.669-1.5-1.5-1.5h-7.75a.752.752 0 0 0-.75.75zM27.25 20h-2.5a.752.752 0 0 0-.75.75V26h-5.25a.752.752 0 0 0-.75.75v2.5c0 .413.337.75.75.75h7.75c.831 0 1.5-.669 1.5-1.5v-7.75a.752.752 0 0 0-.75-.75zM10 29.25v-2.5a.752.752 0 0 0-.75-.75H4v-5.25a.752.752 0 0 0-.75-.75H.75a.752.752 0 0 0-.75.75v7.75c0 .831.669 1.5 1.5 1.5h7.75c.412 0 .75-.337.75-.75z"></path></svg>
                <svg id="exit-fullscreen-icon" width="28" height="32" viewBox="0 0 28 32" style="display: none;">
                    <rect x="5" y="8" width="18" height="3" fill="currentColor" />
                    <rect x="5" y="16" width="18" height="3" fill="currentColor" />
                </svg>
            </button>
            <div id="modal-content">
                <iframe src="spel1.php" id="game-iframe" width="100%" height="500px" style="border: none;"></iframe>
            </div>
        </div>
    </div>

    <div id="profileSquare" class="profile-square">
        <div class="search-container">
            <input type="text" id="searchInput" placeholder="Sök profiler..." onkeyup="searchProfiles()">
        </div>
        <div id="searchResults" class="search-results"></div>
    </div>

    <div id="sidebar-toggle" onclick="toggleSidebar()">☰</div>
    <div id="sidebar" class="sidebar">
        <!-- Profilbild sektion -->
        <div class="profile-section">
            <div class="username">
            <div class="profile-circle" style="background-image: url('../pfp/<?php echo htmlspecialchars($profile_picture); ?>');" onclick="document.getElementById('profilePictureInput').click();"></div>
            <h3><?php echo htmlspecialchars(ucfirst($username)); ?></h3>
        </div>
        <!-- Filuppladdning för profilbild -->
        <form id="profilePictureForm" action="spel.php" method="POST" enctype="multipart/form-data" style="display: none;">
            <input type="file" name="profile_picture" id="profilePictureInput" accept="image/*" onchange="document.getElementById('profilePictureForm').submit();">
        </form>
    </div>

        <!-- Level och EXP bar -->
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
    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>" data-username="<?php echo htmlspecialchars($username); ?>"></div>
    <script src="../script.js"></script>
</body>
</html>

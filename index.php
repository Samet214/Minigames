<?php
// Startar en session för att kunna använda sessionsvariabler
session_start();

// Döljer felmeddelanden för användaren
ini_set('display_errors', 0);

// Inkluderar filen för databaskoppling
include './php/db.php';

// Skapar en anslutning till databasen
$conn = Anvandarinformation();

// Hämtar användarnamnet från sessionen
$username = $_SESSION['username'];

// Hanterar uppladdning av profilbild
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['profile_picture'])) {
    $file = $_FILES['profile_picture'];
    
    // Kontrollerar om det finns några fel vid uppladdningen
    if ($file['error'] === UPLOAD_ERR_OK) {
        // Hämtar filens egenskaper
        $fileTmpPath = $file['tmp_name'];
        $fileName = basename($file['name']);
        $fileSize = $file['size'];
        $fileType = pathinfo($fileName, PATHINFO_EXTENSION);
        
        // Definierar tillåtna filtyper och max storlek
        $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
        $maxFileSize = 2 * 1024 * 1024; // 2MB

        // Kontrollerar om filtypen och storleken är tillåten
        if (in_array($fileType, $allowedTypes) && $fileSize <= $maxFileSize) {
            // Hämtar nuvarande profilbild från databasen
            $query = $conn->prepare("SELECT Profil_bild FROM användare WHERE Namn = ?");
            $query->bind_param("s", $username);
            $query->execute();
            $result = $query->get_result();
            $user = $result->fetch_assoc();
            $currentProfilePicture = $user['Profil_bild'];

            // Tar bort den nuvarande profilbilden om den inte är standardbilden
            if ($currentProfilePicture && $currentProfilePicture !== 'default.png' && file_exists('pfp/' . $currentProfilePicture)) {
                unlink('pfp/' . $currentProfilePicture); // Tar bort den gamla profilbilden
            }

            // Genererar ett unikt namn för den nya uppladdade filen
            $newFileName = uniqid() . '.' . $fileType;
            $uploadFileDir = 'pfp/';
            $destPath = $uploadFileDir . $newFileName;

            // Flyttar filen till pfp-katalogen
            if (move_uploaded_file($fileTmpPath, $destPath)) {
                // Uppdaterar databasen med det nya filnamnet
                $updateQuery = $conn->prepare("UPDATE användare SET Profil_bild = ? WHERE Namn = ?");
                $updateQuery->bind_param("ss", $newFileName, $username);
                if ($updateQuery->execute()) {
                    // Filen har laddats upp och profilen har uppdaterats
                } else {
                    // Hanterar fel vid uppdatering av databasen
                }
            } else {
                // Hanterar fel vid flytt av fil
            }
        } else {
            // Hanterar ogiltig filtyp eller storlek
        }
    } else {
        // Hanterar fel vid uppladdning av fil
    }
}

// Hämtar användardata från poängsystemtabellen
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
    // Standardvärden om användaren inte finns i poängsystemtabellen
    $level = 1;
    $current_exp = 0;
    $next_level_exp = 50;
    $username = 'Guest';
    $_SESSION['Namn'] = $username;
    $_SESSION['Levels'] = 1;
    $_SESSION['EXP'] = 0;
    $_SESSION['EXP_GRÄNS'] = 50;
}

// Hämtar profilbilden från användartabellen
$query = $conn->prepare("SELECT Profil_bild FROM användare WHERE Namn = ?");
$query->bind_param("s", $username);
$query->execute();
$result = $query->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $profile_picture = $user['Profil_bild'];

    // Använder standardbilden om profilbilden är NULL eller inte finns i pfp-katalogen
    if (empty($profile_picture) || !file_exists('pfp/' . $profile_picture)) {
        $profile_picture = 'default.png';
    }
} else {
    // Använder standardbilden om användaren inte finns i användartabellen
    $profile_picture = 'default.png';
}

// Hanterar utloggning
if (isset($_GET['logout']) && $_GET['logout'] == 'true') {
    session_destroy();
    header("Location: login.php");
    exit();
}

// Hanterar tillägg av erfarenhet (EXP)
if (isset($_POST['add_exp'])) {
    $expToAdd = intval($_POST['exp_amount']);
    $current_exp += $expToAdd;

    // Uppdaterar level och EXP om användaren når nästa nivå
    while ($current_exp >= $next_level_exp) {
        $current_exp -= $next_level_exp;
        $level += 1;
        $next_level_exp *= 2;
    }

    // Uppdaterar användardata i databasen
    $update = $conn->prepare("UPDATE poängssystem SET Levels = ?, EXP = ?, EXP_GRÄNS = ? WHERE Namn = ?");
    $update->bind_param("iiis", $level, $current_exp, $next_level_exp, $username);
    $update->execute();

    // Returnerar JSON-svar med uppdaterad EXP, level och nästa nivås EXP
    echo json_encode([
        'current_exp' => $current_exp,
        'level' => $level,
        'next_level_exp' => $next_level_exp
    ]);
    exit();
}

// Hanterar live-sökning av användare
if (isset($_GET['search'])) {
    $searchTerm = $_GET['search'] . '%';

    // Joinar användare och poängsystemtabeller för att hämta profil- och leveldata
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

    // Returnerar JSON-svar med sökresultat eller ett meddelande om inga användare hittades
    echo empty($data) ? json_encode(['message' => 'Inga användare']) : json_encode($data);
    exit();
}
?>

<?php

// Skapar en ny anslutning till databasen
$conn = Anvandarinformation();

// Hämtar level, EXP och EXP-krav från poängsystemtabellen
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
    // Hanterar fall där användaren inte finns i poängsystemtabellen
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
                        <li><a href="../php/spel.php">Spel</a></li>
                        <li><a href="../php/topplista.php">Topplista</a></li>
                    </ul>
                </nav>
                <div class="search-profile-btn-container" style="display: flex; justify-content: space-between; gap: 15px;">
                    <button id="signin" onclick="redirect('../php/signup.php')">Registrera</button>
                    <button id="login" onclick="redirect('../php/login.php')">Logga in</button>
                </div>
            <?php else: ?>
                <nav style="margin-right: 600px;">
                    <ul>
                        <li><a href="../php/spel.php">Spel</a></li>
                        <li><a href="../php/topplista.php">Topplista</a></li>
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

    <!-- Huvudinnehållssektion -->
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

    <!-- Profilsökningsruta -->
    <div id="profileSquare" class="profile-square">
        <div class="search-container">
            <input type="text" id="searchInput" placeholder="Sök profiler..." onkeyup="searchProfiles()">
        </div>
        <div id="searchResults" class="search-results"></div>
    </div>

    <!-- Sidofältsknapp -->
    <div id="sidebar-toggle" onclick="toggleSidebar()">☰</div>
    <div id="sidebar" class="sidebar">
        <!-- Profilbildssektion -->
        <div class="profile-section">
            <div class="username">
            <div class="profile-circle" style="background-image: url('pfp/<?php echo htmlspecialchars($profile_picture); ?>');" onclick="document.getElementById('profilePictureInput').click();"></div>
            <h3><?php echo htmlspecialchars(ucfirst($username)); ?></h3>
        </div>
        <!-- Filuppladdningsformulär för profilbild -->
        <form id="profilePictureForm" action="index.php" method="POST" enctype="multipart/form-data" style="display: none;">
            <input type="file" name="profile_picture" id="profilePictureInput" accept="image/*" onchange="document.getElementById('profilePictureForm').submit();">
        </form>
    </div>

        <!-- Level och EXP-sektion -->
        <div class="level-section">
            <h4>Level <span id="level"><?php echo $level; ?></span></h4>
            <div class="exp-bar">
                <div class="exp-progress" style="width: <?php echo ($current_exp / $next_level_exp) * 100; ?>%;" id="expProgress"></div>
            </div>
            <p id="expText">
                <?php
                // Funktion för att formatera stora nummer (t.ex. 1000 till 1K)
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

                // Formaterar nuvarande EXP och nästa nivås EXP
                $formattedCurrentExp = formatNumber($current_exp);
                $formattedNextLevelExp = formatNumber($next_level_exp);

                echo $formattedCurrentExp . '/' . $formattedNextLevelExp . ' EXP';
                ?>
            </p>
        </div>
        <?php if (!isset($_SESSION['username'])): ?>

        <?php else: ?>
            <hr>
            <a id="a-tag1" href="../php/logout.php">Logga ut</a>
            <hr>
        <?php endif; ?>
    <div id="php-file-info" data-php-file="<?php echo basename(__FILE__); ?>" data-username="<?php echo htmlspecialchars($username); ?>"></div>
    <script src="script.js"></script>
</body>
</html>
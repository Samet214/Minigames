<?php
    session_start();

    // If user is not logged in, redirect to login.php
    if (!isset($_SESSION['username'])) {
        header("Location: login.php");
        exit();
    }

    // Check if the user clicked the logout link
    if (isset($_GET['logout']) && $_GET['logout'] == 'true') {
        // Destroy the session to log the user out
        session_destroy();
        // Redirect to login.php
        header("Location: login.php");
        exit();
    }

    // Initialize session variables if not set
    if (!isset($_SESSION['level'])) {
        $_SESSION['level'] = 1;
    }

    if (!isset($_SESSION['current_exp'])) {
        $_SESSION['current_exp'] = 0;
    }

    if (!isset($_SESSION['next_level_exp'])) {
        $_SESSION['next_level_exp'] = 50;
    }

    // Function to add experience and check for level up
    function addExperience($amount) {
        $_SESSION['current_exp'] += $amount;

        // Check if current EXP reaches or exceeds the required EXP for the next level
        while ($_SESSION['current_exp'] >= $_SESSION['next_level_exp']) {
            // Level up
            $_SESSION['current_exp'] -= $_SESSION['next_level_exp'];
            $_SESSION['level'] += 1;
            // Increase EXP requirement for the next level by 50
            $_SESSION['next_level_exp'] *= 2;
        }
    }

    if (isset($_POST['add_exp'])) {
        $expToAdd = intval($_POST['exp_amount']);
        addExperience($expToAdd);

        // Return the updated EXP, level, and next level exp
        echo json_encode([
            'current_exp' => $_SESSION['current_exp'],
            'level' => $_SESSION['level'],
            'next_level_exp' => $_SESSION['next_level_exp']
        ]);
        exit();
    }

    $username = $_SESSION['username'];
    $password = $_SESSION['password'];

    $level = $_SESSION['level'];
    $current_exp = $_SESSION['current_exp'];
    $next_level_exp = $_SESSION['next_level_exp'];

    // Profile picture handling (same as before)
    $profile_pic_dir = "uploads/";
    $default_pic = "default.png";
    $profile_pic = isset($_SESSION['profile_pic']) ? $_SESSION['profile_pic'] : $default_pic;

    if (isset($_FILES['profile_pic'])) {
        $target_file = $profile_pic_dir . basename($_FILES["profile_pic"]["name"]);
        if (move_uploaded_file($_FILES["profile_pic"]["tmp_name"], $target_file)) {
            $_SESSION['profile_pic'] = $target_file;
            $profile_pic = $target_file;
        }
    }
?>

<!DOCTYPE html>
<html lang="sv">
<head>
    <title>Välkommen</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="style.css">
    <script src="script.js?v=1.2"></script>
</head>
<body>

    <!-- Button to open/close sidebar -->
    <div id="sidebar-toggle" onclick="toggleSidebar()">☰</div>

    <!-- Sidebar -->
    <div id="sidebar" class="sidebar">
        <div class="profile-section">
            <div class="profile-pic">
                <img src="<?php echo htmlspecialchars($profile_pic); ?>" alt="Profile Picture" id="profilePic">
                <form id="uploadForm" method="post" enctype="multipart/form-data" style="display:none;">
                    <input type="file" name="profile_pic" id="fileInput" onchange="document.getElementById('uploadForm').submit();">
                </form>
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
            // Function to format large numbers (K, M, G)
            function formatNumber($number) {
                if ($number >= 1000000000) {
                    return round($number / 1000000000, 1) . 'G';
                } else if ($number >= 1000000) {
                    return round($number / 1000000, 1) . 'M';
                } else if ($number >= 1000) {
                    return round($number / 1000, 1) . 'K';
                } else {
                    return $number;
                }
            }

            // Get formatted values for display
            $formattedCurrentExp = formatNumber($_SESSION['current_exp']);
            $formattedNextLevelExp = formatNumber($_SESSION['next_level_exp']);

            // Display current EXP and next level EXP in the correct format
            echo $formattedCurrentExp . '/' . $formattedNextLevelExp . ' EXP';
            ?>
        </p>

        </div>
        <hr>
        <!-- Log out link -->
        <a href="sida.php?logout=true" id="a-tag1"><b>Logga ut</b></a>
        <hr>
    </div>

    <button onclick="gainExp(100)">+100 exp</button>

</body>
</html>

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

$username = $_SESSION['username'];
$level = 1;
$current_exp = 45;
$next_level_exp = 50;

// Profile picture handling
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
            <h4>Level <?php echo $level; ?></h4>
            <div class="exp-bar">
                <div class="exp-progress" style="width: <?php echo ($current_exp / $next_level_exp) * 100; ?>%;"></div>
            </div>
            <p><?php echo $current_exp . '/' . $next_level_exp; ?> EXP</p>
        </div>
        <hr>
        <!-- Log out link -->
        <a href="sida.php?logout=true" id="a-tag1"><b>Logga ut</b></a>
        <hr>
    </div>

    <script>
        function toggleSidebar() {
            var sidebar = document.getElementById("sidebar");
            var toggleButton = document.getElementById("sidebar-toggle");

            sidebar.classList.toggle("open");

            if (sidebar.classList.contains("open")) {
                toggleButton.style.left = "260px";
            } else {
                toggleButton.style.left = "10px";
            }
        }

        document.getElementById('profilePic').addEventListener('click', function() {
            document.getElementById('fileInput').click();
        });
    </script>
</body>
</html>

<!DOCTYPE html>
<html>
    <head></head>
    <body>
    <?php
        session_start();

        // If user is not logged in, redirect to login.php
        if (!isset($_SESSION['username'])) {
            header("Location: login.php");
            exit();
        }
    ?>

    </body>
</html>
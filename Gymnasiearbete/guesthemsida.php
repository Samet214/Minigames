<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Hemsida</title>
        <link rel="stylesheet" href="style.css">
        <script src="script.js"></script>
    </head>
    <body>
        <div id="container1">
            <button id="login" onclick="redirect('login.php')"><b>Logga in<b></button>
            <button id="signin" onclick="redirect('signup.php')"><b>Registrera<b></button>
        </div>
        <?php
        session_start();
        
        if (isset($_SESSION['username'])) {
            header("Location: sida.php");
            exit();
        }
        ?>
    </body>
</html>
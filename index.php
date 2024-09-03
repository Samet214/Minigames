<!DOCTYPE html>
<!--Deklerar att det är en html fil-->
<html lang="sv">
<!--Skapar en html-tag med språk svenska-->
<head>
<!--Skapar en head tag-->
    <title>Minigames</title>
<!--Skapar en titel-->
    <meta charset="utf-8">
<!--Gör utf-8-->
    <link rel="stylesheet" type="text/css" href="style.css">
<!--Länkar till en css-fil-->
</head>
<!--Avslutar head-tag-->
<body>
<!--Skapar en body-tag-->
    <form action="" method="post">
<!--Skapar en form för textbox-->
        <input type="text" name="username" value="" placeholder="Lägg in användernamn"/>
<!--Skapar en textbox för användarnamn-->
        <input type="text" name="password" value="" placeholder="Lägg in lösenord"/>
<!--Skapar en textbox för lösenord-->
        <input type="submit" name="submit" value="Submit" />
<!--Skapar en submit knapp-->
    </form>
<!--Avslutar form-tag-->

    <?php
    //Börjar php sektion
        $servername = "localhost";
        //Anger servernamn
        $username = "samet";
        //Anger användarnamn
        $password = "samet";
        //Anger lösenord
        $dbname = "Användarinformation";
        //Anger databas namn

        $conn = new mysqli($servername, $username, $password, $dbname);
        //Skapar en koppling med servernamn, användarnamn, lösennord och databasnamn

        if ($conn->connect_error) {
            //Om kopplonnection failedingen misslyckas
            die("Koppling misslyckad: " . $conn->connect_error);
            //Skriver en error meddelande
        }

        if (isset($_POST['submit'])) {
            //Ifall man har tryckt på knappen
            $username = $_POST['username'];
            //Kollar ifall användarnamnet finns
            $password = $_POST['password'];
            //Kollar ifall lösenordet finns och assignar det till variabel

            $sql = "INSERT INTO Användare (Namn, Lösenord) VALUES (?, ?)";
            //Skapar en sql kommand och lägger till variabel
            $stmt = $conn->prepare($sql);
            //Connectar till databas
            $stmt->bind_param("ss", $username, $password);
            //Lägger till username och password

            

            $stmt->execute();

            $stmt->close();
            //Stänger av stmt
        }

        $conn->close();
        //Stänger av kopplingen
    ?>
    <!--Stänger av PHP-->
</body>
    <!--Stänger av body-tag-->
</html>
    <!--Avslutar html-tag-->
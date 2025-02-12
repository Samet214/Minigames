<!-- Sidebar HTML -->
<div id="sidebar-toggle" onclick="toggleSidebar()">☰</div>
<div id="sidebar" class="sidebar">
    <!-- Profilbildssektion -->
    <div class="profile-section">
        <div class="username">
            <!-- Cirkulär profilbild som kan klickas för att ladda upp en ny bild -->
            <div class="profile-circle" style="background-image: url('../pfp/<?php echo htmlspecialchars($profile_picture); ?>');" onclick="document.getElementById('profilePictureInput').click();"></div>
            <!-- Användarnamn -->
            <h3><?php echo htmlspecialchars(ucfirst($username)); ?></h3>
        </div>
        <!-- Formulär för att ladda upp en ny profilbild -->
        <form id="profilePictureForm" method="POST" enctype="multipart/form-data" style="display: none;">
            <input type="file" name="profile_picture" id="profilePictureInput" accept="image/*" onchange="document.getElementById('profilePictureForm').submit();">
        </form>
    </div>

    <!-- Level och EXP-sektion -->
    <div class="level-section">
        <!-- Nuvarande level -->
        <h4>Level <span id="level"><?php echo $level; ?></span></h4>
        <!-- EXP-bar som visar framsteg -->
        <div class="exp-bar">
            <div class="exp-progress" style="width: <?php echo ($current_exp / $next_level_exp) * 100; ?>%;" id="expProgress"></div>
        </div>
        <!-- Text som visar nuvarande och nästa levels EXP -->
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

            // Formatera nuvarande och nästa levels EXP
            $formattedCurrentExp = formatNumber($current_exp);
            $formattedNextLevelExp = formatNumber($next_level_exp);

            echo $formattedCurrentExp . '/' . $formattedNextLevelExp . ' EXP';
            ?>
        </p>
    </div>
    <hr>
    <!-- Logga ut-länk -->
    <a id="a-tag1" href="../minigames/php/logout.php">Logga ut</a>
    <hr>
</div>

<!-- Sidebar CSS -->
<style>
 /* Dölj scrollbar */
 ::-webkit-scrollbar {
    display: none;
}

 /* Grundläggande stil för sidan */
 body {
    font-family: 'Arial', sans-serif;
    background-color: #f7f7f7;
    color: #333;
    margin: 0;
    padding: 0;
    text-align: center;
    background-size: cover;
}

 /* Stil för sidebar-toggle knappen */
 #sidebar-toggle {
    position: fixed;
    top: 100px; /* Justera detta för att placera knappen under headern */
    left: 10px;
    font-size: 30px;
    cursor: pointer;
    background-color: black;
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 1000;
    transition: left 0.5s;
}

/* Stil för sidebar */
 .sidebar {
    height: 89%;
    width: 0;
    position: fixed;
    top: 80px;
    left: 0;
    background-color: black;
    color: white;
    overflow-x: hidden;
    transition: width 0.5s;
    padding-top: 20px;
    box-shadow: 3px 0px 10px rgba(0, 0, 0, 0.5);
}

 /* Stil för öppen sidebar */
 .sidebar.open {
    width: 250px;
}

/* Stil för profilsektionen */
 .profile-section {
    display: flex;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid white;
}

/* Stil för level-sektionen */
 .level-section {
    padding: 20px;
}

 .level-section h4 {
    margin: 0;
    color: #ffcc00;
}

 /* Stil för EXP-baren */
 .exp-bar {
    width: 100%;
    height: 15px;
    background-color: #333;
    border-radius: 10px;
    margin: 10px 0;
}

 .exp-progress {
    height: 100%;
    background-color: #ffcc00;
    border-radius: 10px;
}

 /* Stil för level-text */
 .level-section p {
    margin: 0;
    color: white;
}

 /* Stil för logga ut-länken */
 #a-tag1 {
    color: white;
    text-decoration: none;
}

/* Stil för sökprofil-knappen */
 .search-profile-btn-container {
    position: fixed;
    top: 20px;
    right: 30px;
    z-index: 1000; /* Se till att den ligger över andra element */
}

 /* Stil för sökresultat */
 #searchResults {
    margin-top: 10px;
}

/* Stil för sökprofil-knappen */
 #searchProfileBtn {
    background-color: #1e90ff; /* Elektrisk blå */
    color: white; /* Vit text */
    border: none;
    padding: 10px 5px;
    font-size: 16px;
    cursor: pointer;
    border-radius: 10px; /* Mer rundade hörn */
    font-family: 'Arial', sans-serif; /* Ren, modern font */
    text-transform: uppercase; /* Gör texten till versaler */
    font-weight: bold;
    letter-spacing: 2px; /* Gör texten mer utspridd */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3), 0 0 15px #00ffea, 0 0 25px #00ffea; /* Glow-effekt */
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease;
}

 /* Hover-effekt för sökprofil-knappen */
 #searchProfileBtn:hover {
    background-color: #00ccff; /* Ljusare blå vid hover */
    transform: translateY(-5px); /* Flytta knappen uppåt vid hover */
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), 0 0 20px #00ffea, 0 0 35px #00ffea; /* Förstärk glow vid hover */
}

 /* Aktiv effekt för sökprofil-knappen */
 #searchProfileBtn:active {
    transform: translateY(0); /* Återställ position vid klick */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3), 0 0 15px #00ffea, 0 0 25px #00ffea; /* Återställ glow vid klick */
}

/* Stil för den vita rutan som visas vid sökning */
 .profile-square {
    width: 300px;
    height: 270px;
    background-color: white;
    position: fixed;
    top: 60px; /* Under knappen */
    right: 9px;
    display: none; /* Dold som standard */
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    z-index: 999; /* Hög z-index för att ligga över andra element */
    opacity: 0; /* Osynlig från början */
    transition: opacity 0.3s ease, transform 0.3s ease; /* Jämn övergång */
}

 /* Synlighet för den vita rutan */
 .profile-square.active {
    display: block;
    opacity: 1;
    transform: translateY(10px); /* Liten inflyttningseffekt */
}

/* Stil för sökcontainer */
 .search-container {
    position: relative;
    width: 90%;
    left: 15px;
}

/* Stil för sökruta */
 #searchInput {
    width: 80%;
    padding: 10px 40px 10px 10px; /* Utrymme för sökikonen */
    font-size: 14px;
    border: 2px solid #1e90ff; /* Matchar knappens färg */
    border-radius: 5px;
    outline: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Subtilt skugga */
    transition: border-color 0.3s ease; /* Jämn övergång för bordercolor */
    margin-top: 20px;
}

 /* Ändra bordercolor vid fokus */
 #searchInput:focus {
    border-color: #00ccff;
}

 /* Stil för användarnamn */
 .username {
    display: flex;
    align-items: flex-start; /* Justera objekt till starten */
}

 /* Stil för cirkulär profilbild */
 .profile-circle {
    width: 68px; /* Justera storlek efter behov */
    height: 68px; /* Justera storlek efter behov */
    border-radius: 50%; /* Gör bilden cirkulär */
    background-position: center;
    background-size: cover; /* Se till att bilden täcker cirkeln */
    background-repeat: no-repeat;
    cursor: pointer;
    margin-top: -27px;
    margin-right: 10px;
    margin-left: -10px;
}

 /* Stil för användarnamnstext */
 .username h3 {
    font-size: 1.5em; /* Större textstorlek för bättre synlighet */
    font-family: Arial, sans-serif; /* Font för en modern look */
    margin-top: -10px; /* Flytta användarnamnstexten uppåt */
}

 /* Stil för sökresultatobjekt */
 .result-item {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #ddd;
    margin: 4px 0;
    width: 90%;
    margin-left: 5%;
    padding: 4px 0;
    transition: background-color 0.3s ease, font-size 0.3s ease;
}

 /* Hover-effekt för sökresultatobjekt */
 .result-item:hover {
    font-size: 1.05em;
    background-color: #f9f9f9;
    border-radius: 8px;
    cursor: pointer;
}

 /* Stil för profilbild i sökresultat */
 .profile-image {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid black;
    margin-right: 8px;
    transition: transform 0.3s ease, border-color 0.3s ease;
}

/* Hover-effekt för profilbild när sökresultatobjekt hoveras */
 .result-item:hover  .profile-image {
    transform: scale(1.1);
    border-color: #007bff;
}

 /* Hover-effekt för användarnamn i sökresultat */
 .result-item:hover  .username {
    color: #007bff; /* Ljusblå vid hover */
}

 /* Stil för sökresultatcontainer */
 .search-results {
    max-height: 180px;
    overflow-y: auto;
    background-color: white;
    padding: 8px;
    border-radius: 8px;
}

 /* Stil för stängningsknapp */
 .close-button {
    background-color: transparent;
    border: none;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    position: absolute;
    top: 10px;
    right: 10px;
}

 /* Stil för cirkulär profilbild i vald profil */
 .circle-profile {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid black;
    margin-left: 40%;
}

 /* Stil för container för vald profil */
 .selected-profile-container {
    display: flex;
    flex-direction: column;
    align-items: center; /* Centrera objekt horisontellt */
    text-align: center; /* Centrera text */
}

 /* Stil för cirkulär profilbild i vald profil */
 .selected-profile-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    transition: transform 0.3s ease-in, box-shadow 0.3s ease-in, translate 0.3s ease-in;
}

 /* Hover-effekt för cirkulär profilbild i vald profil */
 .selected-profile-circle:hover {
    transform: scale(1.05);
    transform: translateY(-3px);
    box-shadow: 0px 0px 10px #ffcc00;
    border-radius: 50%;
}

 /* Stil för användarnamn i vald profil */
 .username2 {
    margin-top: 10px; /* Mellanrum mellan bild och text */
    font-size: 20px;
    font-family: Arial, Helvetica, sans-serif;
    font-weight: bold;
    text-transform: capitalize;
    color: black;
}

 /* Stil för level-text i vald profil */
 .level-section2 p {
    color: black; /* Eller önskad textfärg */
    position: absolute; /* Absolut positionering */
    top: 0; /* Placera den överst i föräldracontainern */
    left: 50%; /* Centrera horisontellt */
    transform: translateX(-50%); /* Centrera horisontellt */
    z-index: 10; /* Högre z-index för att säkerställa att den ligger överst */
    margin-top: 190px;
}

 /* Stil för level-rubrik i vald profil */
 .level-section2 h4 {
    color: #ffcc00;
    margin-bottom: 0px;
    margin-top: 10px;
}

 /* Stil för meddelandeknapp */
 .messagebutton {
    position: absolute;
    width: 120px;
    height: 43px;
    background-color: #007bff; /* Klassisk blå */
    color: white;
    top: 215px;
    left: 20px;
    border: none; /* Valfritt: ta bort kant för en renare look */
    border-radius: 5px; /* Valfritt: lägg till lätt rundning till hörn */
    transition: background-color 0.3s, transform 0.3s; /* Jämn övergång */
}

 /* Hover-effekt för meddelandeknapp */
 .messagebutton:hover {
    background-color: #0056b3; /* Mörkare blå vid hover */
    transform: translateY(-3px) scale(1.03); /* Kombinerad transform för jämnare effekt */
}

/* Stil för inmatningsfält för att skriva meddelanden */
 .message-input {
    width: calc(100% - 90px); /* Lämna utrymme för knappen */
    padding: 10px;
    border-radius: 20px;
    border: 1px solid #dcdcdc;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    transition: all 0.3s;
}

/* Fokuserad stil för inmatningsfält */
 .message-input:focus {
    border-color: #8ab4f8; /* Ljusblå vid fokus */
    box-shadow: 0 0 5px rgba(138, 180, 248, 0.5);
}

/* Stil för skicka-knapp */
 .send-button {
    margin-top: 180px;
    padding: 10px 20px;
    background-color: #4CAF50; /* Grön bakgrund */
    color: #fff;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    margin-left: 10px;
    transition: background-color 0.3s ease, transform 0.2s ease;
}

/* Hover- och aktiv effekt för skicka-knapp */
 .send-button:hover {
    background-color: #45A049; /* Mörkare grön vid hover */
}

 .send-button:active {
    transform: scale(0.98); /* Krymp något vid klick */
}

/* Stil för stängningsknapp */
 .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: transparent;
    border: none;
    font-size: 18px;
    color: #888;
    cursor: pointer;
    transition: color 0.2s ease;
}

 /* Hover-effekt för stängningsknapp */
 .close-button:hover {
    color: #333;
}
</style>
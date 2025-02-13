// Hämta namnet på PHP-filen från data-attributet
const phpFileInfoElement = document.getElementById('php-file-info');
const currentPhpFile = phpFileInfoElement.getAttribute('data-php-file');
let currentProfile = {};  // Globalt objekt för att lagra aktuell profildata

// Funktion för att omdirigera till en viss URL
function redirect(url) {
    window.location.href = url;
}

let currency = 0; // Variabel som lagrar användarens valuta (uppdateras dynamiskt)

// Funktion för att hämta användarens nuvarande förmögenhet när sidan laddas
async function fetchUserNetworth() {
    try {
        let response;
        // Välj rätt sökväg beroende på vilken PHP-fil som används
        if (currentPhpFile === "index.php") {
            response = await fetch('../php/get_currency.php');
        } else {
            response = await fetch('../php/get_currency.php');
        }

        const data = await response.json();  // Konvertera svaret till JSON

        if (data.status === 'success') {
            currency = data.value; // Sätt valutan till användarens nuvarande förmögenhet
            document.getElementById('currency-amount').textContent = formatNumber(currency);
        } else {
            console.error('Fel vid hämtning av förmögenhet:', data.message);
        }
    } catch (error) {
        console.error('Hämtningsfel:', error);
    }
}

// Funktion för att lägga till erfarenhetspoäng (EXP)
function gainExp(expAmount, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "sida.php", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            var currentExp = response.current_exp;
            var nextLevelExp = response.next_level_exp;
            var level = response.level;

            // Intern funktion för att formatera nummer med K, M eller G
            function formatNumber(number) {
                if (number >= 1000000000) {
                    return (number / 1000000000).toFixed(1) + 'G';
                } else if (number >= 1000000) {
                    return (number / 1000000).toFixed(1) + 'M';
                } else if (number >= 1000) {
                    return (number / 1000).toFixed(1) + 'K';
                } else {
                    return number;
                }
            }

            // Formatera erfarenhetspoängen och målet för nästa nivå
            var formattedCurrentExp = formatNumber(currentExp);
            var formattedNextLevelExp = formatNumber(nextLevelExp);

            // Uppdatera EXP-fältet och texten
            var progressBar = document.getElementById('expProgress');
            var expText = document.getElementById('expText');
            progressBar.style.width = (currentExp / nextLevelExp) * 100 + '%';
            expText.textContent = formattedCurrentExp + '/' + formattedNextLevelExp + ' EXP';

            // Uppdatera användarens nivå
            document.getElementById('level').textContent = level;

            // Kör callback-funktionen om den finns, med aktuell EXP-data
            if (callback) {
                callback(currentExp, nextLevelExp, level);
            }
        }
    };

    // Skicka begäran till servern med mängden EXP som ska läggas till
    xhr.send("add_exp=true&exp_amount=" + expAmount);
}

// Funktion för att formatera ett nummer till K, M eller G
function formatNumber(number) {
    if (number >= 1_000_000_000) {
        return (number / 1_000_000_000).toFixed(1) + 'G';
    } else if (number >= 1_000_000) {
        return (number / 1_000_000).toFixed(1) + 'M';
    } else if (number >= 1_000) {
        return (number / 1_000).toFixed(1) + 'K';
    } else {
        return number.toString();
    }
}

// Kör funktionen för att hämta användarens förmögenhet när sidan laddas
window.onload = fetchUserNetworth;

// Funktion för att lägga till valuta till användarens konto
function gainCurrency(amount) {
    // Hämta den aktuella valutan från servern
    fetch('../php/get_currency.php')
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 'success') {
                let currentCurrency = data.value;  // Hämta aktuell valuta

                // Lägg till det angivna beloppet
                currentCurrency += amount;
                currency = currentCurrency;

                // Uppdatera valutatvisningen på sidan
                document.getElementById('currency-amount').textContent = currency;

                // Skicka den uppdaterade valutan tillbaka till servern
                fetch('update_ekonomi.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `action=gain&amount=${amount}`,
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.status === 'success') {
                            console.log('Valuta uppdaterad framgångsrikt.');
                        } else {
                            console.error('Fel vid uppdatering av valuta:', data.message);
                        }
                    })
                    .catch((error) => {
                        console.error('Hämtningsfel:', error);
                    });
            } else {
                console.error('Fel vid hämtning av valuta:', data.message);
            }
        })
        .catch((error) => {
            console.error('Hämtningsfel:', error);
        });
}

// Funktionen för att minska valuta (currency)
function loseCurrency(amount) {
    if (currency - amount < 0) {  // Kontrollera om valutan är mindre än det belopp som ska dras av
        console.log('Not enough currency to lose.');  // Logga ett felmeddelande om inte tillräckligt med valuta finns
        return;  // Avsluta funktionen
    }

    currency -= amount;  // Minska valutan
    document.getElementById('currency-amount').textContent = currency;  // Uppdatera valutan på skärmen

    // Skicka uppdaterad valuta till servern
    fetch('update_ekonomi.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=lose&amount=${amount}`,  // Skicka data om förlustbeloppet
    })
    .then((response) => {
        if (!response.ok) {  // Kontrollera om servern svarar korrekt
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();  // Om allt gick bra, konvertera svaret till JSON
    })
    .then((data) => {
        if (data.status === 'success') {  // Kontrollera om servern meddelar att uppdateringen lyckades
            console.log('Currency updated successfully.');
        } else {
            console.error('Error updating currency:', data.message);  // Felmeddelande om uppdatering misslyckades
        }
    })
    .catch((error) => {  // Fånga eventuella fel
        console.error('Fetch error:', error);
    });
}

// Funktion för att visa och dölja sidofältet (sidebar)
function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    var toggleButton = document.getElementById("sidebar-toggle");

    // Växla mellan att lägga till/ta bort klassen 'open'
    sidebar.classList.toggle("open");

    // Justera sidofältets bredd när det är öppet
    if (sidebar.classList.contains("open")) {
        sidebar.style.width = "250px";  // Ställ in bredden när sidofältet är öppet
        toggleButton.style.left = "260px";  // Placera knappen utanför sidofältet
    } else {
        sidebar.style.width = "0";  // Dölj sidofältet
        toggleButton.style.left = "10px";  // Återställ knappen till ursprunglig position
    }
}

// Om vi är på specifika PHP-filer, lägg till specifik logik
if (currentPhpFile === "game_display.php") {
    // Här kan du lägga till kod för game_display.php om det behövs
} else if (currentPhpFile === "index.php") {
    // Samma toggleSidebar-funktion som ovan för index.php
    function toggleSidebar() {
        var sidebar = document.getElementById("sidebar");
        var toggleButton = document.getElementById("sidebar-toggle");
    
        sidebar.classList.toggle("open");
    
        if (sidebar.classList.contains("open")) {
            sidebar.style.width = "250px";
            toggleButton.style.left = "260px";
        } else {
            sidebar.style.width = "0";
            toggleButton.style.left = "10px";
        }
    }

    // Klick på loggan leder tillbaka till index.php
    document.getElementById("logo").addEventListener("click", function() {
        redirect('index.php');
    });

    // Glow-effekt när man hovrar över loggan
    const logo = document.getElementById('logo');
    const hoverCircle = document.getElementById('hover-circle');
    
    logo.addEventListener('mouseover', () => {
        hoverCircle.style.opacity = '1';
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.7), 0 0 45px rgba(0, 255, 255, 0.6)';
    });
    
    logo.addEventListener('mouseout', () => {
        hoverCircle.style.opacity = '0';
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.6), 0 0 30px rgba(0, 255, 255, 0.5), 0 0 45px rgba(0, 255, 255, 0.4)';
    });

    // Funktion för att öppna ett modalt fönster för specifika spel
    function openModal(gameId) {
        const gameUrls = {
            game1: "game_display.php?gameId=game1",
            game2: "game_display.php?gameId=game2",
            game3: "game_display.php?gameId=game3",
            game4: "game_display.php?gameId=game4",
            game5: "game_display.php?gameId=game5"
        };
    
        if (gameUrls[gameId]) {
            window.location.href = gameUrls[gameId];  // Navigera till vald spelsida
        }
    }
    
    // Funktion för att stänga det modala fönstret
    function closeModal() {
        const overlay = document.getElementById("overlay");
        const modal = document.getElementById("modal");
        overlay.style.animation = "fadeOut 0.5s ease-out forwards";  // Lägg till fade-out animation
        modal.style.animation = "modalResizeOut 1s cubic-bezier(0.25, 0.1, 0.25, 1.5) forwards";
    
        setTimeout(() => {
            overlay.style.display = "none";  // Dölj efter animation
        }, 500);
    }
    
    // Växla mellan fullskärmsläge och normalt läge för det modala fönstret
    function toggleFullScreen(event) {
        event.stopPropagation();
        const modal = document.getElementById("modal");
        const enterIcon = document.getElementById("enter-fullscreen-icon");
        const exitIcon = document.getElementById("exit-fullscreen-icon");
    
        if (!document.fullscreenElement) {
            modal.requestFullscreen().then(() => {
                modal.classList.add("full-screen-mode");
                enterIcon.style.display = "none";
                exitIcon.style.display = "inline";
            });
        } else {
            document.exitFullscreen().then(() => {
                modal.classList.remove("full-screen-mode");
                enterIcon.style.display = "inline";
                exitIcon.style.display = "none";
            });
        }
    }
    
    function toggleSidebar() {
        var sidebar = document.getElementById("sidebar");
        var toggleButton = document.getElementById("sidebar-toggle");
        
        // Växla klassen "open" på sidebaren för att visa eller dölja den
        sidebar.classList.toggle("open");
        
        // Kontrollera om sidebaren är öppen och flytta knappen därefter
        if (sidebar.classList.contains("open")) {
            toggleButton.style.left = "260px"; // Sidebarens bredd (250px) + 10px marginal
        } else {
            toggleButton.style.left = "10px"; // Återställ till ursprunglig position
        }
    }
    
    document.addEventListener("DOMContentLoaded", function() {
        // Hämta användarnamnet från data-attributet i elementet med id "php-file-info"
        const username = document.getElementById("php-file-info").getAttribute("data-username");
        
        // Skriv ut användarnamnet i konsolen
        console.log("Inloggad användare:", username);
        
        // Visa användarnamnet på sidan om elementet "display-username" finns
        const usernameElement = document.getElementById("display-username");
        if (usernameElement) {
            usernameElement.textContent = username;
        }
        
        // Inaktivera klick på profilbilden om användaren är "guest"
        const profileCircle = document.querySelector(".profile-circle");
        if (username.toLowerCase() === "guest") {
            profileCircle.style.pointerEvents = "none";  // Inaktivera klick
            profileCircle.style.cursor = "default";  // Ändra muspekaren till standard
        }
    });
    
    function toggleProfile() {
        const profileSquare = document.getElementById('profileSquare');
        
        // Växla profilrutan mellan aktiv och inaktiv
        if (profileSquare.classList.contains('active')) {
            closeProfile();  // Stäng profilrutan om den är aktiv
        } else {
            profileSquare.classList.add('active');
            profileSquare.style.display = 'block';
            profileSquare.style.opacity = '1';
            profileSquare.style.transform = 'translateY(10px)';  // Flytta ned rutan med 10px
        }
    }
    
    function closeProfile() {
        const profileSquare = document.getElementById('profileSquare');
        
        // Sätt opacity till 0 och återställ positionen
        profileSquare.style.opacity = '0';
        profileSquare.style.transform = 'translateY(0px)';
        
        // Vänta tills animationen är klar innan rutan döljs
        setTimeout(() => {
            profileSquare.classList.remove('active');
            profileSquare.style.display = 'none';
        }, 300); // Matcha CSS-transitionens varaktighet (300 ms)
    }
    
    function handleOutsideClick(event) {
        const profileSquare = document.getElementById('profileSquare');
        const searchProfileBtn = document.getElementById('searchProfileBtn');
        
        // Stäng profilrutan om klicket är utanför rutan och inte på vissa specifika element
        if (
            !profileSquare.contains(event.target) &&
            event.target !== searchProfileBtn &&
            !event.target.classList.contains('result-item') &&
            !event.target.classList.contains('close-button') &&
            !event.target.classList.contains('profile-image') &&
            event.target.id !== 'sidebar-toggle' &&
            !event.target.classList.contains('messagebutton')
        ) {
            closeProfile();
        }
    }
    
    function searchProfiles() {
        const searchInput = document.getElementById('searchInput').value.trim();
        
        // Om sökfältet är tomt, rensa sökresultaten
        if (searchInput === '') {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }
        
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '../php/sida.php?search=' + encodeURIComponent(searchInput), true);
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                console.log(JSON.parse(xhr.responseText));
                const results = JSON.parse(xhr.responseText);
                const searchResultsContainer = document.getElementById('searchResults');
                searchResultsContainer.innerHTML = '';  // Töm tidigare sökresultat
                
                // Om inga användare hittas, visa ett meddelande
                if (results.message) {
                    const noUserFound = document.createElement('div');
                    noUserFound.classList.add('result-item');
                    noUserFound.textContent = results.message;
                    searchResultsContainer.appendChild(noUserFound);
                } else {
                    // Skapa ett resultatobjekt för varje användare
                    results.forEach(function(user) {
                        const profileImage = user.Profil_bild || '../pfp/default.png';
                        const resultItem = document.createElement('div');
                        resultItem.classList.add('result-item');
                        
                        // Sätt data-attribut för nivå, erfarenhet och erfarenhetsgräns
                        resultItem.dataset.profileImage = profileImage;
                        resultItem.dataset.level = user.Levels;
                        resultItem.dataset.exp = user.EXP;
                        resultItem.dataset.expThreshold = user.EXP_GRÄNS;
                        
                        const img = document.createElement('img');
                        img.classList.add('profile-image');
                        img.src = '../pfp/' + profileImage;
                        
                        let username = document.createElement('span');
                        username.classList.add('username');
                        
                        // Funktion för att göra första bokstaven i namnet versal
                        function capitalizeFirstLetter(str) {
                            if (!str) return str; // Hantera tomma eller falska strängar
                            return str.charAt(0).toUpperCase() + str.slice(1);
                        }
                        
                        username.textContent = capitalizeFirstLetter(user.Namn);
                        username.style.color = "black";
                        
                        resultItem.appendChild(img);
                        resultItem.appendChild(username); // Lägg till användarnamn korrekt
                        searchResultsContainer.appendChild(resultItem);
                    });
                }
            }
        };
        
        xhr.send(); // Skicka förfrågan till servern
    }    
    
    function updateProfile(profileImageSrc, userName, userLevel, userExp, expThreshold) {
        const searchResultsContainer = document.getElementById('searchResults');
    
        // Rensa tidigare resultat
        searchResultsContainer.innerHTML = '';
    
        // Skapa en ny container för den valda profilen
        const selectedProfileContainer = document.createElement('div');
        selectedProfileContainer.style.display = 'flex';
        selectedProfileContainer.style.alignItems = 'center';
        selectedProfileContainer.style.flexDirection = 'column';
        selectedProfileContainer.style.textAlign = 'center';
    
        // Lägg till profilbild och användarnamn
        const profileCircle = document.createElement('img');
        profileCircle.src = '../pfp/' + profileImageSrc;
        profileCircle.classList.add('selected-profile-circle');
    
        const username = document.createElement('span');
        username.classList.add('username2');
        username.textContent = userName;
    
        // Skapa en sektion för level med EXP-detaljer
        const levelSection = document.createElement('div');
        levelSection.classList.add('level-section2');
        levelSection.innerHTML = `
            <h4>Level <span>${userLevel}</span></h4>
            <div class="exp-bar2">
                <div class="exp-progress2" style="width: ${(userExp / expThreshold) * 100}%;"></div>
            </div>
            <p>${userExp} / ${expThreshold} EXP</p>
        `;
    
        // Lägg till elementen i den nya profilcontainern
        selectedProfileContainer.appendChild(profileCircle);
        selectedProfileContainer.appendChild(username);
        selectedProfileContainer.appendChild(levelSection);
    
        // Lägg till i sökresultatcontainern
        searchResultsContainer.appendChild(selectedProfileContainer);
    
        // Skapa stäng-knapp
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.classList.add('close-button');
        closeButton.addEventListener('click', function() {
            searchResultsContainer.innerHTML = ''; // Rensa resultatcontainern
            document.getElementById('searchInput').style.display = 'block'; // Visa sökrutan igen
            searchProfiles(); // Ladda om sökresultaten
        });
        selectedProfileContainer.appendChild(closeButton);
    }
    
    function openMessageContainer() {
        const searchResultsContainer = document.getElementById('searchResults');
        searchResultsContainer.innerHTML = ''; // Rensa tidigare innehåll
    
        // Skapa och konfigurera "Stäng"-knappen
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.classList.add('close-button');
        closeButton.addEventListener('click', function() {
            document.getElementById('searchInput').style.display = 'block'; // Visa sökrutan igen
            searchResultsContainer.innerHTML = ''; // Rensa meddelandecontainern
            searchProfiles(); // Ladda om sökresultaten
        });
    
        // Skapa meddelandedisplay
        const messageDisplay = document.createElement('div');
        messageDisplay.classList.add('message-display');
    
        // Skapa inmatningsfält för nya meddelanden
        const messageInput = document.createElement('input');
        messageInput.type = 'text';
        messageInput.classList.add('message-input');
        messageInput.placeholder = 'Skriv ett meddelande...';
    
        // Skapa "Skicka"-knappen
        const sendButton = document.createElement('button');
        sendButton.textContent = 'Skicka';
        sendButton.classList.add('send-button');
    
        // Lägg till elementen för meddelande-UI
        searchResultsContainer.classList.add('message-container'); // Använd stilar för meddelandecontainern
        searchResultsContainer.appendChild(closeButton);
        searchResultsContainer.appendChild(messageDisplay);
        searchResultsContainer.appendChild(messageInput);
        searchResultsContainer.appendChild(sendButton);
    }
    
    // Lyssnare för klickhändelser på profiler och meddelanden
    document.addEventListener('click', function(event) {
        const searchResultsContainer = document.getElementById('searchResults');
        const searchBox = document.getElementById('searchInput');
    
        // Kontrollera om en profil eller profilbild har klickats
        if (event.target.classList.contains('result-item') || event.target.classList.contains('profile-image')) {
            const clickedItem = event.target.closest('.result-item');
            const profileImageSrc = clickedItem.dataset.profileImage;
            const userName = clickedItem.querySelector('.username').textContent;
            const userLevel = clickedItem.dataset.level;
            const userExp = clickedItem.dataset.exp;
            const expThreshold = clickedItem.dataset.expThreshold;
    
            // Dölj sökrutan
            searchBox.style.display = 'none';
    
            // Visa vald profil med detaljer
            updateProfile(profileImageSrc, userName, userLevel, userExp, expThreshold);
        }
    
        // Kontrollera om "Meddelande"-knappen har klickats
        if (event.target.classList.contains('messagebutton')) {
            openMessageContainer();
        }
    });
    
    // Automatisk stängning av meddelanden efter 5 sekunder
    setTimeout(() => {
        document.querySelectorAll('.message').forEach(msg => {
            msg.style.display = 'none';
        });
    }, 5000);    

} else if (currentPhpFile === "login.php") {
    
    // När dokumentet är fullständigt laddat
    document.addEventListener("DOMContentLoaded", function () {
        const infoSection = document.getElementById('login-info');
        infoSection.style.opacity = 0;  // Döljer info-sektionen

        setTimeout(function () {
            // Lägger till en mjuk övergångseffekt och visar info-sektionen
            infoSection.style.transition = 'opacity 1.5s ease-in-out';
            infoSection.style.opacity = 1;
        }, 200);
    });

    // Om användaren klickar på logotypen omdirigeras de till startsidan
    document.getElementById("logo").addEventListener("click", function() {
        redirect('../index.php');
    });

    const logo = document.getElementById('logo');
    const hoverCircle = document.getElementById('hover-circle');

    // Mjuk övergång vid hovring över logotypen
    logo.addEventListener('mouseover', () => {
        hoverCircle.style.opacity = '1';  // Fadar in cirkeln
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.7), 0 0 45px rgba(0, 255, 255, 0.6)';  // Starkare glow-effekt
    });

    logo.addEventListener('mouseout', () => {
        hoverCircle.style.opacity = '0';  // Fadar ut cirkeln
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.6), 0 0 30px rgba(0, 255, 255, 0.5), 0 0 45px rgba(0, 255, 255, 0.4)';  // Normal glow-effekt
    });

    // När dokumentet är fullständigt laddat
    document.addEventListener("DOMContentLoaded", function() {
        // Hämtar användarnamnet från data-attributet
        const username = document.getElementById("php-file-info").getAttribute("data-username");
        
        // Skriver ut användarnamnet i konsolen
        console.log("Inloggad användare:", username);

        // Visar användarnamnet på sidan om elementet finns
        const usernameElement = document.getElementById("display-username");
        if (usernameElement) {
            usernameElement.textContent = username;
        }

        // Inaktiverar klick på profilbilden om användaren är gäst
        const profileCircle = document.querySelector(".profile-circle");
        if (username.toLowerCase() === "guest") {
            profileCircle.style.pointerEvents = "none";  // Inaktiverar klick
            profileCircle.style.cursor = "default";  // Ändrar pekaren till standard
        }
    });

    // Funktion för att växla profilfönstret
    function toggleProfile() {
        const profileSquare = document.getElementById('profileSquare');

        if (profileSquare.classList.contains('active')) {
            closeProfile();  // Stänger profilfönstret
        } else {
            // Öppnar profilfönstret och visar det med en övergång
            profileSquare.classList.add('active');
            profileSquare.style.display = 'block';
            profileSquare.style.opacity = '1';
            profileSquare.style.transform = 'translateY(10px)';
        }
    }

} else if (currentPhpFile === "signup.php") {

    // När dokumentet är fullständigt laddat
    document.addEventListener("DOMContentLoaded", function () {
        const infoSection = document.getElementById('signup-info');
        infoSection.style.opacity = 0;  // Döljer info-sektionen

        setTimeout(function () {
            // Lägger till en mjuk övergångseffekt och visar info-sektionen
            infoSection.style.transition = 'opacity 1.5s ease-in-out';
            infoSection.style.opacity = 1;
        }, 200);
    });

    // Om användaren klickar på logotypen omdirigeras de till startsidan
    document.getElementById("logo").addEventListener("click", function() {
        redirect('../index.php');
    });

    const logo = document.getElementById('logo');
    const hoverCircle = document.getElementById('hover-circle');

    // Mjuk övergång vid hovring över logotypen
    logo.addEventListener('mouseover', () => {
        hoverCircle.style.opacity = '1';  // Fadar in cirkeln
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.7), 0 0 45px rgba(0, 255, 255, 0.6)';  // Starkare glow-effekt
    });

    logo.addEventListener('mouseout', () => {
        hoverCircle.style.opacity = '0';  // Fadar ut cirkeln
        hoverCircle.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.6), 0 0 30px rgba(0, 255, 255, 0.5), 0 0 45px rgba(0, 255, 255, 0.4)';  // Normal glow-effekt
    });

    // När dokumentet är fullständigt laddat
    document.addEventListener("DOMContentLoaded", function() {
        // Hämtar användarnamnet från data-attributet
        const username = document.getElementById("php-file-info").getAttribute("data-username");
        
        // Skriver ut användarnamnet i konsolen
        console.log("Inloggad användare:", username);

        // Visar användarnamnet på sidan om elementet finns
        const usernameElement = document.getElementById("display-username");
        if (usernameElement) {
            usernameElement.textContent = username;
        }

        // Inaktiverar klick på profilbilden om användaren är gäst
        const profileCircle = document.querySelector(".profile-circle");
        if (username.toLowerCase() === "guest") {
            profileCircle.style.pointerEvents = "none";  // Inaktiverar klick
            profileCircle.style.cursor = "default";  // Ändrar pekaren till standard
        }
    });

    // Funktion för att växla profilfönstret
    function toggleProfile() {
        const profileSquare = document.getElementById('profileSquare');

        if (profileSquare.classList.contains('active')) {
            closeProfile();  // Stänger profilfönstret
        } else {
            // Öppnar profilfönstret och visar det med en övergång
            profileSquare.classList.add('active');
            profileSquare.style.display = 'block';
            profileSquare.style.opacity = '1';
            profileSquare.style.transform = 'translateY(10px)';
        }
    }
} else if (currentPhpFile === "spel.php") {

    // När användaren klickar på logotypen omdirigeras de till startsidan
    document.getElementById("logo").addEventListener("click", function() {
        redirect('../index.php');
    });
    
    // Funktion för att öppna modalen med rätt spel
    function openModal(gameId) {
        const gameUrls = {
            game1: "game_display.php?gameId=game1",
            game2: "game_display.php?gameId=game2",
            game3: "game_display.php?gameId=game3",
            game4: "game_display.php?gameId=game4",
            game5: "game_display.php?gameId=game5"
        };

        // Om gameId matchar någon av URL:erna, omdirigeras användaren till den URL:en
        if (gameUrls[gameId]) {
            window.location.href = gameUrls[gameId];
        } else {
            // Annars görs ingenting
        }
    }

    // Funktion för att stänga modalen
    function closeModal() {
        const overlay = document.getElementById("overlay");
        const modal = document.getElementById("modal");
        overlay.style.animation = "fadeOut 0.5s ease-out forwards";
        modal.style.animation = "modalResizeOut 1s cubic-bezier(0.25, 0.1, 0.25, 1.5) forwards";

        // Väntar tills animationen är klar innan overlay döljs
        setTimeout(() => {
            overlay.style.display = "none";
        }, 500);
    }

    // Funktion för att växla mellan fullskärmsläge
    function toggleFullScreen(event) {
        event.stopPropagation();
        const modal = document.getElementById("modal");
        const enterIcon = document.getElementById("enter-fullscreen-icon");
        const exitIcon = document.getElementById("exit-fullscreen-icon");
        const gameIframe = document.getElementById("game-iframe");

        // Om sidan inte redan är i fullskärm
        if (!document.fullscreenElement) {
            modal.requestFullscreen().then(() => {
                modal.classList.add("full-screen-mode");
                enterIcon.style.display = "none";  // Döljer ikonen för att gå till fullskärm
                exitIcon.style.display = "inline";  // Visar ikonen för att gå ur fullskärm
            });
        } else {
            document.exitFullscreen().then(() => {
                modal.classList.remove("full-screen-mode");
                enterIcon.style.display = "inline";  // Visar ikonen för att gå till fullskärm
                exitIcon.style.display = "none";  // Döljer ikonen för att gå ur fullskärm
            });
        }
    }

    // Funktion för att växla sidopanelen
    function toggleSidebar() {
        var sidebar = document.getElementById("sidebar");
        var toggleButton = document.getElementById("sidebar-toggle");

        sidebar.classList.toggle("open");

        // Kollar om sidopanelen är öppen och justerar knappen därefter
        if (sidebar.classList.contains("open")) {
            toggleButton.style.left = "260px"; // Sidopanelens bredd (250px) + 10px marginal
        } else {
            toggleButton.style.left = "10px"; // Återställer till ursprunglig position
        }
    }

    // När dokumentet är fullständigt laddat
    document.addEventListener("DOMContentLoaded", function() {
        // Hämtar användarnamnet från data-attributet
        const username = document.getElementById("php-file-info").getAttribute("data-username");

        // Skriver ut användarnamnet i konsolen
        console.log("Inloggad användare:", username);

        // Visar användarnamnet på sidan om elementet finns
        const usernameElement = document.getElementById("display-username");
        if (usernameElement) {
            usernameElement.textContent = username;
        }

        // Inaktiverar klick på profilbilden om användaren är gäst
        const profileCircle = document.querySelector(".profile-circle");
        if (username.toLowerCase() === "guest") {
            profileCircle.style.pointerEvents = "none";  // Inaktiverar klick
            profileCircle.style.cursor = "default";  // Ändrar pekaren till standard
        }
    });

    // Funktion för att växla profilfönstret
    function toggleProfile() {
        const profileSquare = document.getElementById('profileSquare');

        if (profileSquare.classList.contains('active')) {
            closeProfile();
        } else {
            profileSquare.classList.add('active');
            profileSquare.style.display = 'block';
            profileSquare.style.opacity = '1';
            profileSquare.style.transform = 'translateY(10px)';
        }
    }

    // Funktion för att stänga profilfönstret
    function closeProfile() {
        const profileSquare = document.getElementById('profileSquare');

        profileSquare.style.opacity = '0';
        profileSquare.style.transform = 'translateY(0px)';

        // Väntar på att animationen ska slutföras innan fönstret döljs
        setTimeout(() => {
            profileSquare.classList.remove('active');
            profileSquare.style.display = 'none';
        }, 300); // Matchar CSS-övergångens varaktighet

        // Tar bort event-lyssnaren
        document.removeEventListener('click', handleOutsideClick);
    }

    // Funktion för att hantera klick utanför profilfönstret
    function handleOutsideClick(event) {
        const profileSquare = document.getElementById('profileSquare');
        const searchProfileBtn = document.getElementById('searchProfileBtn');

        // Kollar om klicket är utanför profilfönstret och inte på någon av de angivna elementen
        if (
            !profileSquare.contains(event.target) &&
            event.target !== searchProfileBtn &&
            !event.target.classList.contains('result-item') &&
            !event.target.classList.contains('close-button') &&
            !event.target.classList.contains('profile-image') &&
            event.target.id !== 'sidebar-toggle' &&
            !event.target.classList.contains('messagebutton')
        ) {
            closeProfile();
        }
    }
    
    // Antag att searchProfiles är där du skapar och visar sökresultat
    function searchProfiles() {
        const searchInput = document.getElementById('searchInput').value.trim();

        // Om sökfältet är tomt, rensa sökresultaten och avsluta
        if (searchInput === '') {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'sida.php?search=' + encodeURIComponent(searchInput), true);

        xhr.onload = function() {
            if (xhr.status === 200) {
                console.log(JSON.parse(xhr.responseText));
                const results = JSON.parse(xhr.responseText);
                const searchResultsContainer = document.getElementById('searchResults');
                searchResultsContainer.innerHTML = '';

                // Om det finns ett meddelande, visa det som resultat
                if (results.message) {
                    const noUserFound = document.createElement('div');
                    noUserFound.classList.add('result-item');
                    noUserFound.textContent = results.message;
                    searchResultsContainer.appendChild(noUserFound);
                } else {
                    // Loopar genom alla användare och visar resultaten
                    results.forEach(function(user) {
                        const profileImage = user.Profil_bild || '../pfp/default.png';
                        const resultItem = document.createElement('div');
                        resultItem.classList.add('result-item');

                        // Sätt data-attribut för nivå, EXP och EXP-gräns
                        resultItem.dataset.profileImage = profileImage;
                        resultItem.dataset.level = user.Levels;
                        resultItem.dataset.exp = user.EXP;
                        resultItem.dataset.expThreshold = user.EXP_GRÄNS;

                        const img = document.createElement('img');
                        img.classList.add('profile-image');
                        img.src = '../pfp/' + profileImage;

                        let username = document.createElement('span');
                        username.classList.add('username');

                        function capitalizeFirstLetter(str) {
                            if (!str) return str; // Hantera tomma eller falska strängar
                            return str.charAt(0).toUpperCase() + str.slice(1);
                        }

                        username.textContent = capitalizeFirstLetter(user.Namn);
                        username.style.color = "black";

                        resultItem.appendChild(img);
                        resultItem.appendChild(username); // Lägg till användarnamnet korrekt
                        searchResultsContainer.appendChild(resultItem);
                    });
                }
            }
        };

        xhr.send();
    }

    // Uppdatera profilens vy när en användare väljs
    function updateProfile(profileImageSrc, userName, userLevel, userExp, expThreshold) {
        const searchResultsContainer = document.getElementById('searchResults');

        // Rensa tidigare resultat
        searchResultsContainer.innerHTML = '';

        // Skapa en ny container för den valda profilen
        const selectedProfileContainer = document.createElement('div');
        selectedProfileContainer.style.display = 'flex';
        selectedProfileContainer.style.alignItems = 'center';
        selectedProfileContainer.style.flexDirection = 'column';
        selectedProfileContainer.style.textAlign = 'center';

        // Lägg till profilbild och användarnamn
        const profileCircle = document.createElement('img');
        profileCircle.src = '../pfp/' + profileImageSrc;
        profileCircle.classList.add('selected-profile-circle');

        const username = document.createElement('span');
        username.classList.add('username2');
        username.textContent = userName;

        // Skapa nivåsektionen med EXP detaljer som vanlig text
        const levelSection = document.createElement('div');
        levelSection.classList.add('level-section2');
        levelSection.innerHTML = `
            <h4>Level <span>${userLevel}</span></h4>
            <div class="exp-bar2">
                <div class="exp-progress2" style="width: ${(userExp / expThreshold) * 100}%;"></div>
            </div>
            <p>${userExp} / ${expThreshold} EXP</p>
        `;

        // Lägg till elementen i den nya profilcontainern
        selectedProfileContainer.appendChild(profileCircle);
        selectedProfileContainer.appendChild(username);
        selectedProfileContainer.appendChild(levelSection);

        // Lägg till i sökresultatscontainern
        searchResultsContainer.appendChild(selectedProfileContainer);

        // Lägg till stäng-knappen
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.classList.add('close-button');
        closeButton.addEventListener('click', function() {
            searchResultsContainer.innerHTML = '';
            document.getElementById('searchInput').style.display = 'block'; // Visa sökfältet igen
            searchProfiles(); // Ladda om sökresultaten
        });
        selectedProfileContainer.appendChild(closeButton);
    }

    // Funktion för att öppna meddelandekontainern
    function openMessageContainer() {
        const searchResultsContainer = document.getElementById('searchResults');
        searchResultsContainer.innerHTML = ''; // Rensa eventuell tidigare innehåll

        // Skapa och konfigurera "Stäng"-knappen
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.classList.add('close-button');
        closeButton.addEventListener('click', function() {
            // Gå tillbaka till sökinmatningen och ladda om sökresultaten
            document.getElementById('searchInput').style.display = 'block'; // Visa sökfältet
            searchResultsContainer.innerHTML = ''; // Rensa meddelandekontainern
            searchProfiles(); // Ladda om sökresultaten
        });

        // Område för att visa meddelanden
        const messageDisplay = document.createElement('div');
        messageDisplay.classList.add('message-display');

        // Inmatningsfält för att skriva nya meddelanden
        const messageInput = document.createElement('input');
        messageInput.type = 'text';
        messageInput.classList.add('message-input');
        messageInput.placeholder = 'Skriv ett meddelande...';

        // "Skicka"-knapp för att skicka meddelanden
        const sendButton = document.createElement('button');
        sendButton.textContent = 'Skicka';
        sendButton.classList.add('send-button');

        // Lägg till element för att visa meddelande UI
        searchResultsContainer.classList.add('message-container'); // Tillämpa stilar för meddelandekontainer
        searchResultsContainer.appendChild(closeButton);
        searchResultsContainer.appendChild(messageDisplay);
        searchResultsContainer.appendChild(messageInput);
        searchResultsContainer.appendChild(sendButton);
    }
    
    // Eventlyssnare för att hantera interaktioner med profiler och meddelanden
document.addEventListener('click', function(event) {
    const searchResultsContainer = document.getElementById('searchResults');
    const searchBox = document.getElementById('searchInput');

    // Kolla om en profil eller profilbild har klickats
    if (event.target.classList.contains('result-item') || event.target.classList.contains('profile-image')) {
        const clickedItem = event.target.closest('.result-item');
        const profileImageSrc = clickedItem.dataset.profileImage;
        const userName = clickedItem.querySelector('.username').textContent;
        const userLevel = clickedItem.dataset.level;
        const userExp = clickedItem.dataset.exp;
        const expThreshold = clickedItem.dataset.expThreshold;

        // Dölj sökrutan
        searchBox.style.display = 'none';

        // Visa den valda profilen med dess detaljer
        updateProfile(profileImageSrc, userName, userLevel, userExp, expThreshold);
    }

    // Kolla om "Meddelande"-knappen har klickats
    if (event.target.classList.contains('messagebutton')) {
        openMessageContainer();
    }
});

// Dölja meddelanden automatiskt efter 5 sekunder
setTimeout(() => {
    document.querySelectorAll('.message').forEach(msg => {
        msg.style.display = 'none';
    });
}, 5000);

// Om den aktuella filen är "spel1.php", sätt upp spelets logik
} else if (currentPhpFile === "spel1.php") {
    const grid = document.getElementById('grid');
    const startButton = document.getElementById('start-button');
    const levelDisplay = document.getElementById('level');
    const attemptsDisplay = document.getElementById('attempts');
    const timeDisplay = document.getElementById('time');
    const modeSwitch = document.getElementById('mode-switch');
    const switchText = document.getElementById('switch-text');
    const popup = document.getElementById('popup');
    const overlay = document.getElementById('overlay');
    const closePopupButton = document.getElementById('close-popup');
    const finalLevel = document.getElementById('final-level');
    const finalXP = document.getElementById('final-xp');
    const finalAP = document.getElementById('final-money');
    const totalTime = document.getElementById('total-time');
    const switchContainer = document.getElementById('switch-container');
    const buyAttemptsButton = document.getElementById('buy-attempts-button');
    const username = phpFileInfoElement.dataset.username;

    buyAttemptsButton.style.marginLeft = "15px";

    let sequence = [];
    let userSequence = [];
    let level = 1;
    let attempts = 3;
    let timeRemaining = 10;
    let timer;
    let canInteract = false;
    let progressiveMode = false;
    let startTime, endTime;

    // Uppdatera texten för lägenväxlaren dynamiskt
    modeSwitch.addEventListener('change', () => {
        if (modeSwitch.checked) {
            switchText.textContent = 'Progressiv ';
            progressiveMode = true;
            startButton.style.marginRight = "40%";
        } else {
            switchText.textContent = 'Slumpmässig ';
            progressiveMode = false;
            startButton.style.marginRight = "35%";
        }
    });

    // Skapa rutnätet
    for (let i = 0; i < 9; i++) {
        const box = document.createElement('div');
        box.classList.add('box');
        box.dataset.index = i;
        grid.appendChild(box);

        box.addEventListener('click', () => {
            if (canInteract) {
                handleUserInput(Number(box.dataset.index));
            }
        });
    }

    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        switchContainer.remove(); // Ta bort växlingscontainern
        startGame();
    });

    closePopupButton.addEventListener('click', closePopup);
    overlay.addEventListener('click', () => {
        if (popup.classList.contains('visible')) {
            window.location.reload();
        }
    });

    function restartLevel() {
        canInteract = false;
        userSequence = [];
        timeRemaining = 10 + (level - 1) * 5;
        updateStats();
        displaySequence(() => {
            startTimer();
        });
    }

    // Lägg till eventlyssnare för "Köp Försök"-knappen
    let baseCost = 50;
    let currentCost = baseCost; // Starta med 50 AP

    // Funktion för att uppdatera texten på knappen med aktuell kostnad
    function updateBuyAttemptsButton() {
        buyAttemptsButton.textContent = `Köp Försök (${currentCost} AP)`;
        buyAttemptsButton.style.display = 'block';
    }

    // Lägg till eventlyssnare för "Köp Försök"-knappen
    buyAttemptsButton.addEventListener('click', () => {
        fetch('http://samet-desktop.adm.huddinge.se:3000/ekonomi')
            .then(res => res.json())
            .then(ekonomiResponse => {
                const matchedUser = ekonomiResponse.find(user => user.username === username);
                if (matchedUser && matchedUser.value >= currentCost) {
                    const updateData = {
                        username: username,
                        cost: currentCost
                    };

                    fetch('http://samet-desktop.adm.huddinge.se:3000/update-ekonomi2', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData),
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            attempts += 3;
                            updateStats();
                            popup.classList.remove('visible');
                            overlay.classList.remove('visible');
                            restartLevel();

                            // Dubbel kostnaden för nästa köp
                            currentCost *= 2;
                            updateBuyAttemptsButton(); // Uppdatera knappen med ny kostnad
                        }
                    });
                } else {
                    alert(`Inte tillräckligt med AP! Du behöver ${currentCost} AP.`);
                }
            });
    });

    function startGame() {
        level = 1;
        attempts = 3;
        timeRemaining = 10;
        sequence = [];
        startTime = Date.now(); // Registrera starttiden
        updateStats();
        nextLevel();
    }
    
    function nextLevel() {
        canInteract = false;
        userSequence = [];
        levelDisplay.textContent = level;
        timeRemaining = 10 + (level - 1) * 5; // Justera timern för varje nivå
        updateStats();
    
        // Lägg till ett nytt tal i sekvensen beroende på om det är progressivt läge eller inte
        if (progressiveMode) {
            sequence.push(Math.floor(Math.random() * 9));
        } else {
            sequence = Array.from({ length: level }, () => Math.floor(Math.random() * 9));
        }
    
        displaySequence(() => {
            startTimer(); // Starta timern **efter** att sekvensen visats
        });
    }
    
    function displaySequence(callback) {
        let index = 0;
        const boxes = document.querySelectorAll('.box');
    
        const interval = setInterval(() => {
            if (index > 0) boxes[sequence[index - 1]].classList.remove('active');
    
            if (index < sequence.length) {
                boxes[sequence[index]].classList.add('active');
                index++;
            } else {
                clearInterval(interval);
                boxes.forEach((box) => box.classList.remove('active'));
                canInteract = true;
    
                // Anropa callback-funktionen när sekvensen har visats klart
                if (typeof callback === 'function') callback();
            }
        }, 800);
    }
    
    // Uppdatera startTimer-funktionen:
    function startTimer() {
        clearInterval(timer); // Rensa eventuella befintliga timers
        updateStats(); // Uppdatera visningen omedelbart
        timer = setInterval(() => {
            timeRemaining--; // Använd den globala variabeln
            updateStats();
            if (timeRemaining <= 0) {
                clearInterval(timer);
                endGame(); // Hantera när tiden är slut
            }
        }, 1000);
    }
    
    function handleUserInput(index) {
        const boxes = document.querySelectorAll('.box');
        
        // Förhindra interaktion om vi redan behandlar användarens input
        if (!canInteract) return;
    
        if (sequence[userSequence.length] === index) {
            userSequence.push(index);
            boxes[index].classList.add('correct');
            canInteract = false; // Inaktivera interaktion tillfälligt
    
            setTimeout(() => {
                boxes[index].classList.remove('correct');
                canInteract = true; // Återaktivera interaktion
    
                // Kolla om användaren har slutfört sekvensen
                if (userSequence.length === sequence.length) {
                    level++;
                    canInteract = false; // Inaktivera interaktion tills nästa sekvens startar
                    setTimeout(nextLevel, 1000);
                }
            }, 500);
        } else {
            // Hantera felaktig input
            boxes[index].classList.add('incorrect');
            setTimeout(() => boxes[index].classList.remove('incorrect'), 500);
    
            attempts--;
            updateStats();
    
            if (attempts <= 0) {
                buyAttemptsButton.style.display = 'block'; // Visa knappen för att köpa fler försök
                updateBuyAttemptsButton();
                endGame();
            }
        }
    }
    
    function updateStats() {
        attemptsDisplay.textContent = attempts;
        timeDisplay.textContent = timeRemaining;
    }
    
    function endGame() {
        canInteract = false;
        clearInterval(timer);
        endTime = Date.now();
        const totalTimeElapsed = Math.floor((endTime - startTime) / 1000);
    
        finalLevel.textContent = level;
        totalTime.textContent = totalTimeElapsed;
    
        // Om användaren inte är "guest", spara resultatet
        if (username !== 'guest') {
            fetch('http://samet-desktop.adm.huddinge.se:3000/memory')
                .then(res => res.json())
                .then(memoryResponse => {
                    let userExists = false;
    
                    // Kontrollera om användaren redan finns
                    for (const record of memoryResponse) {
                        if (record.username === username) {
                            userExists = true;
    
                            (async () => {
                                try {
                                    const poangssystemResponse = await fetch('http://samet-desktop.adm.huddinge.se:3000/poangssystem');
                                    const poangssystemData = await poangssystemResponse.json();    
    
                                    // Hitta användaren i poängsystemdata baserat på användarnamn
                                    const matchedPoangssystemUser = poangssystemData.find(user => user.Namn === username);

                                    // Om användaren hittas, använd deras nivå, annars sätt nivå till 1
                                    const userlevel = matchedPoangssystemUser ? matchedPoangssystemUser.Levels : 1;

                                    // Skapa ett objekt med aktuell speldata
                                    const currentGameData = {
                                        nivå: level, // Aktuellt spelens nivå
                                        level: userlevel, // Användarens nivå
                                        pengar_tjanat: 2 * (level - 1) * userlevel, // Beräknat antal pengar tjänat
                                        exp_tjanat: 2 * (level - 1) * userlevel, // Beräknat antal erfarenhetspoäng tjänat
                                        tid: totalTimeElapsed / level, // Beräknad tid baserat på total tid och nivå
                                        netvarde: (record.netvarde || 0) + 2 * (level - 1) * userlevel, // Beräknat netto värde
                                    };

                                    // Uppdaterar netvärdet i record-objektet med det nya värdet
                                    record.netvarde = currentGameData.netvarde;

                                    // Ger spelaren erfarenhetspoäng baserat på exp_tjanat
                                    gainExp(currentGameData.exp_tjanat);

                                    // Uppdaterar textinnehåll för olika UI-element med aktuell speldata
                                    finalLevel.textContent = level; // Visar aktuell nivå
                                    finalXP.textContent = currentGameData.exp_tjanat; // Visar tjänade erfarenhetspoäng
                                    finalAP.textContent = currentGameData.pengar_tjanat; // Visar tjänade pengar
                                    totalTime.textContent = totalTimeElapsed; // Visar total tid

                                    // Skapar ett uppdaterat dataobjekt för att skicka till servern
                                    const updatedData = {
                                        username: record.username, // Användarnamn
                                        nivå: Math.max(record.nivå, currentGameData.nivå), // Högsta nivån
                                        level: Math.max(record.level, currentGameData.level), // Högsta användarnivån
                                        pengar_tjanat: Math.max(record.pengar_tjanat, currentGameData.pengar_tjanat), // Högsta pengar tjänat
                                        exp_tjanat: Math.max(record.exp_tjanat, currentGameData.exp_tjanat), // Högsta erfarenhetspoäng tjänat
                                        tid: Math.min(record.tid || Infinity, currentGameData.tid), // Lägsta tid
                                        netvarde: Math.max(record.netvarde, currentGameData.netvarde), // Högsta netto värde
                                    };

                                    // Skickar en POST-förfrågan för att uppdatera spelardata på servern
                                    await fetch('http://samet-desktop.adm.huddinge.se:3000/update-memory', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ updatedData, currentGameData }), // Skickar uppdaterad data och aktuell speldata
                                    });

                                    // Visar popup och overlay för att indikera att spelet är klart
                                    popup.classList.add('visible');
                                    overlay.classList.add('visible');
                                    buyAttemptsButton.style.display = 'block'; // Visar knappen för att köpa fler försök
                                    } catch (error) {
                                        console.error('Error:', error); // Loggar eventuella fel
                                    }
                                    })();
                                    }
                                    }

                                    // Om användaren inte finns i systemet
                                    if (userExists === false) {
                                    (async () => {
                                    try {
                                        // Hämtar poängsystemdata från servern
                                        const poangssystemResponse = await fetch('http://samet-desktop.adm.huddinge.se:3000/poangssystem');
                                        const poangssystemData = await poangssystemResponse.json();

                                        // Hittar användaren i poängsystemdata
                                        const matchedPoangssystemUser = poangssystemData.find(user => user.Namn === username);
                                        const userlevel = matchedPoangssystemUser ? matchedPoangssystemUser.Levels : 1;

                                        // Hämtar ekonomidata från servern
                                        const ekonomiResponse = await fetch('http://samet-desktop.adm.huddinge.se:3000/ekonomi');
                                        const ekonomiData = await ekonomiResponse.json();

                                        // Hittar användaren i ekonomidata
                                        const matchedEkonomiUser = ekonomiData.find(user => user.username === username);
                                        let usernetworth = matchedEkonomiUser ? matchedEkonomiUser.networth : 0;

                                        // Uppdaterar användarens netto värde
                                        usernetworth += 2 * (level - 1) * userlevel;

                                        // Uppdaterar textinnehåll för olika UI-element
                                        finalLevel.textContent = level; // Visar aktuell nivå
                                        finalXP.textContent = 2 * (level - 1) * userlevel; // Visar tjänade erfarenhetspoäng
                                        finalAP.textContent = 2 * (level - 1) * userlevel; // Visar tjänade pengar
                                        totalTime.textContent = totalTimeElapsed; // Visar total tid

                                        // Skapar ett objekt med data som ska skickas till servern
                                        const dataToInsert = {
                                            username: username, // Användarnamn
                                            level: level, // Aktuell nivå
                                            userlevel: userlevel, // Användarens nivå
                                            pengar_tjanat: 2 * (level - 1) * userlevel, // Tjänade pengar
                                            exp_tjanat: 2 * (level - 1) * userlevel, // Tjänade erfarenhetspoäng
                                            tid: totalTimeElapsed / level, // Beräknad tid
                                            netvarde: usernetworth, // Netto värde
                                        };

                                        // Ger spelaren erfarenhetspoäng
                                        gainExp(2 * (level - 1) * userlevel);

                                        // Ger belöningar till spelaren
                                        grantRewards();

                                        // Visar popup och overlay för att indikera att spelet är klart
                                        popup.classList.add('visible');
                                        overlay.classList.add('visible');
                                        buyAttemptsButton.style.display = 'block'; // Visar knappen för att köpa fler försök

                                        // Skickar en POST-förfrågan för att lägga till ny spelardata på servern
                                        await fetch('http://samet-desktop.adm.huddinge.se:3000/insert-memory', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(dataToInsert), // Skickar data som ska infogas
                                        });

                                    } catch (error) {
                                        console.error('Error fetching data:', error); // Loggar eventuella fel
                                    }
                                    })();
                                    }
                                    })
                                    .catch(error => console.error('Error:', error)); // Loggar eventuella fel
                                    } else {
                                    // Om spelet inte är klart, visa popup och overlay utan köpknapp
                                    popup.classList.add('visible');
                                    overlay.classList.add('visible');
                                    buyAttemptsButton.style.display = 'none';
                                    }
}

// Funktion för att stänga popup
function closePopup() {
    // Döljer popup och overlay
    popup.classList.remove('visible');
    overlay.classList.remove('visible');
    buyAttemptsButton.style.display = 'none';

    // Om försöken är slut, återställ spelet
    if (attempts <= 0) {
    console.log("Reset"); // Loggar återställning
    grantRewards(); // Ger belöningar
    startGame(); // Startar om spelet

    // Återställ kostnaden till 50 för nästa spel
    currentCost = 50;

    // Ladda om sidan
    window.location.reload();
    } else {
    // Starta om nivån om det finns fler försök kvar
    restartLevel();
    }
}

// Funktion för att ge belöningar till spelaren
function grantRewards() {
    // Om användaren är gäst, returnera utan att ge belöningar
    if (username === 'guest') return;

    // Hämtar poängsystemdata från servern
    fetch('http://samet-desktop.adm.huddinge.se:3000/poangssystem')
    .then(res => res.json())
    .then(poangssystemData => {
        // Hittar användarens nivå eller sätter den till 1 om användaren inte hittas
        const userlevel = poangssystemData.find(u => u.Namn === username)?.Levels || 1;

        // Beräknar belöningen baserat på nivå och användarens nivå
        const reward = 2 * (level - 1) * userlevel;

        // Uppdaterar ekonomidata på servern
        fetch('http://samet-desktop.adm.huddinge.se:3000/update-ekonomi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pengar_tjanat: reward }) // Skickar användarnamn och belöning
        });

        // Ger spelaren erfarenhetspoäng
        gainExp(reward);
    });
}
    
} else if (currentPhpFile === "spel3.php") {
    const gridContainer = document.getElementById('grid-container');
    const levelInfo = document.getElementById('level-info');
    const timerDisplay = document.getElementById('timer');
    const attemptsDisplay = document.getElementById('attempts');
    const startButton = document.getElementById('start-button');
    const newGameOverPopup = document.getElementById('new-game-over-popup');
    const newPopupCloseButton = document.getElementById('new-popup-close');
    const newPopupOverlay = document.getElementById('new-popup-overlay');
    const newBuyAttemptsButton = document.getElementById('new-buy-attempts-button');
    const username = phpFileInfoElement.dataset.username;
    const buyAttemptsButton = document.getElementById("new-buy-attempts-button");
    
    let level = 1;
    let attempts = 3;
    let timer = 10;
    let timerInterval;
    let startTime;
    let totalTimePlayed = 0;
    let targetBoxIndex = null;
    let colorDifference = 50;
    let originalColors = [];
    let gameStarted = false;
    let baseCost = 50;
    let currentCost = baseCost;
    
    // Funktion för att generera en slumpmässig färg
    function generateRandomColor() {
        return {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256),
        };
    }
    
    // Funktion för att justera en färg
    function adjustColor(color, adjustment) {
        return {
            r: Math.max(0, Math.min(255, color.r + adjustment)),
            g: Math.max(0, Math.min(255, color.g + adjustment)),
            b: Math.max(0, Math.min(255, color.b + adjustment)),
        };
    }
    
    // Omvandla RGB till CSS-format
    function rgbToCss(rgb) {
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
    
    // Skapa rutnätet (grid)
    function createGrid() {
        gridContainer.innerHTML = ''; // Rensa tidigare innehåll
        originalColors = []; // Rensa färgdata
    
        // Skapa 16 rutor i rutnätet
        for (let i = 0; i < 16; i++) {
            const box = document.createElement('div');
            box.className = 'grid-box';
            box.style.pointerEvents = ''; // Tillåt klick på boxarna
            box.classList.remove('disabled'); // Ta bort 'disabled' klass
            box.addEventListener('click', () => handleBoxClick(box, i)); // Lägg till klickhanterare
            gridContainer.appendChild(box); // Lägg till boxen i rutnätet
        }
    }
    
    // Starta spelet
    function startGame() {
        gameStarted = true; // Spelet har startat
        levelInfo.style.display = 'block'; // Visa level-info
        document.getElementById('info-container').style.display = 'block'; // Visa info-container
        startButton.style.display = 'none'; // Dölj startknappen
    
        levelInfo.textContent = `Level: ${level}`; // Uppdatera leveln
        attempts = 3; // Nollställ försök
        attemptsDisplay.textContent = `Attempts: ${attempts}`; // Uppdatera visningen av försök
        timer = 10 + (level - 1) * 5; // Uppdatera timer för nästa nivå
        timerDisplay.textContent = `Time Left: ${timer}s`; // Visa tid kvar
    
        startTime = Date.now(); // Spara starttiden
    
        const baseColor = generateRandomColor(); // Generera en basfärg
        const adjustment = Math.random() > 0.5 ? -colorDifference : colorDifference; // Bestäm justering för mål-färgen
        const targetColor = adjustColor(baseColor, adjustment); // Justera färgen för att få mål-färgen
    
        targetBoxIndex = Math.floor(Math.random() * 16); // Välj en slumpmässig ruta som mål
    
        const boxes = document.querySelectorAll('.grid-box');
        boxes.forEach((box, index) => {
            const color = index === targetBoxIndex ? targetColor : baseColor; // Om det är mål-boxen, sätt mål-färgen, annars basfärgen
            box.style.backgroundColor = rgbToCss(color); // Sätt bakgrundsfärg för varje ruta
            originalColors[index] = rgbToCss(color); // Spara originalfärger
        });
    
        clearInterval(timerInterval); // Rensa eventuella tidigare timers
        timerInterval = setInterval(() => {
            timer--; // Minska timer
            timerDisplay.textContent = `Time Left: ${timer}s`; // Uppdatera tid kvar
            if (timer <= 0) { // Om tiden är slut, avsluta spelet
                handleGameOver();
            }
        }, 1000);
    }
    
    // Hantera klick på rutor
    function handleBoxClick(box, index) {
        if (!gameStarted || box.classList.contains('clicked')) return; // Om spelet inte har startat eller boxen redan är klickad
    
        if (index === targetBoxIndex) { // Om användaren klickar på mål-boxen
            box.style.backgroundColor = 'green'; // Ändra färg på boxen till grön
            box.style.transform = 'scale(1.2)'; // Gör boxen större
            box.classList.add('clicked'); // Markera boxen som klickad
            clearInterval(timerInterval); // Stoppa timern
    
            const boxes = document.querySelectorAll('.grid-box');
            boxes.forEach((b) => {
                b.classList.add('disabled'); // Disabla alla boxar
                b.style.pointerEvents = 'none'; // Förhindra klick på boxarna
            });
    
            totalTimePlayed += (Date.now() - startTime) / 1000; // Lägg till tiden spelad
    
            // Efter 1 sekund, öka leveln och skapa ett nytt rutnät
            setTimeout(() => {
                level++;
                colorDifference = Math.max(5, colorDifference - 5); // Minska färgskillnaden
                createGrid(); // Skapa nytt rutnät
                startGame(); // Starta spelet igen
            }, 1000);
        } else { // Om användaren klickar på en fel box
            box.style.backgroundColor = 'red'; // Ändra färg på boxen till röd
            box.style.transform = 'scale(1.2)'; // Gör boxen större
            box.classList.add('clicked'); // Markera boxen som klickad
            attempts--; // Minska försök
            attemptsDisplay.textContent = `Attempts: ${attempts}`; // Uppdatera antal försök
    
            // Återställ boxens utseende efter 500 ms
            setTimeout(() => {
                box.style.transform = 'scale(1)';
                box.style.backgroundColor = originalColors[index]; // Återställ färg
                box.classList.remove('clicked'); // Ta bort 'clicked' klass
            }, 500);
    
            if (attempts <= 0) { // Om försök är slut, avsluta spelet
                handleGameOver();
            }
        }
    }
    
    function handleGameOver() {
        if (username !== "guest") { // Kontrollera om användaren inte är en gäst
            gameStarted = false; // Stoppa spelet
            clearInterval(timerInterval); // Stoppa timern
            totalTimePlayed += Math.floor(Date.now() - startTime) / 1000; // Lägg till den totala tiden som spelats
    
            // Funktion för att hämta användarens nivå
            function getUserLevel(username) {
                return fetch('http://samet-desktop.adm.huddinge.se:3000/poangssystem')
                    .then(response => response.json())
                    .then(data => {
                        for (const user of data) {
                            if (user.Namn === username) {
                                return user.Levels; // Återvänd användarens nivå
                            }
                        }
                        return 'User not found'; // Om användaren inte hittas
                    })
                    .catch(error => {
                        console.error('Error fetching level data:', error); // Logga eventuella fel
                        return null;
                    });
            }
    
        // Funktion för att hämta användarens nettoförmögenhet
        function getUserNetWorth(username) {
            return fetch('http://samet-desktop.adm.huddinge.se:3000/netvarde')
                .then(response => response.json())
                .then(data => {
                    for (const user of data) {
                        if (user.username === username) {
                            return user.networth; // Återvänd användarens nettoförmögenhet
                        }
                    }
                    return 'Networth not found'; // Om användarens nettoförmögenhet inte hittas
                })
                .catch(error => {
                    console.error('Error fetching networth data:', error); // Logga eventuella fel
                    return null;
                });
        }

        // Funktion för att uppdatera användarens statistik
        function updateUserStats(username, level, userlevel, averagetime, money, experience, userNetWorth) {
            fetch('http://samet-desktop.adm.huddinge.se:3000/updateUserStats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    level,
                    userlevel,
                    averagetime,
                    money,
                    experience,
                    userNetWorth
                })
            })
                .then(response => response.json())
                .then(data => console.log('User stats updated:', data)) // Logga när användarstatistik uppdateras
                .catch(error => console.error('Error updating user stats:', error)); // Logga eventuella fel

            fetch('http://samet-desktop.adm.huddinge.se:3000/updateEkonomi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    moneyToAdd: money,
                    netWorthToAdd: money
                })
            })
                .then(response => response.json())
                .then(data => console.log('Ekonomi updated:', data)) // Logga när ekonomi uppdateras
                .catch(error => console.error('Error updating ekonomi:', error)); // Logga eventuella fel

            let experience2 = 2 * level * userlevel; // Beräkna erfarenhetspoäng

            // Uppdatera popup-informationen
            document.getElementById('new-popup-level').textContent = `Level: ${level}`;
            document.getElementById('new-popup-time').textContent = `Total Time Played: ${totalTimePlayed}s`;
            document.getElementById('new-popup-exp').textContent = `Earned exp: ${2 * level * userlevel}`;
            document.getElementById('new-popup-money').textContent = `Earned money: ${2 * level * userlevel}`;

            gainExp(experience2); // Ge erfarenhetspoäng
        }

        // Funktion för att hämta användardata
        function getUserData(username) {
            console.log(username); // Logga användarnamnet
            Promise.all([getUserLevel(username), getUserNetWorth(username)]) // Vänta på både nivå och nettoförmögenhet
                .then(([userlevel, userNetWorth]) => {
                    if (userlevel !== null && userlevel !== undefined && userNetWorth !== null && userNetWorth !== undefined) {
                        const experience = 2 * level * userlevel; // Beräkna erfarenhet
                        const money = 2 * level * userlevel; // Beräkna pengar
                        let averagetime = totalTimePlayed / level; // Beräkna genomsnittlig speltid

                        fetch('http://samet-desktop.adm.huddinge.se:3000/colourvision')
                            .then(response => response.json())
                            .then(data => {
                                const userExists = data.some(user => user.username === username); // Kontrollera om användaren finns i databasen

                                console.log(userExists);

                                if (userExists) {
                                    updateUserStats(username, level, userlevel, averagetime, money, experience, userNetWorth); // Uppdatera användarstatistik
                                } else {
                                    gainExp(experience); // Ge erfarenhet

                                    // Uppdatera popup-information om användaren är ny
                                    document.getElementById('new-popup-level').textContent = `Level: ${level}`;
                                    document.getElementById('new-popup-time').textContent = `Total Time Played: ${totalTimePlayed}s`;
                                    document.getElementById('new-popup-exp').textContent = `Earned exp: ${2 * level * userlevel}`;
                                    document.getElementById('new-popup-money').textContent = `Earned money: ${2 * level * userlevel}`;

                                    let pengar_tjanat = 2 * level * userlevel;

                                    const updateData = {
                                        username: username,
                                        pengar_tjanat: pengar_tjanat // Spara pengar som användaren tjänat
                                    };

                                    fetch('http://samet-desktop.adm.huddinge.se:3000/update-ekonomi', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(updateData), // Uppdatera ekonomin
                                    })
                                    .then(response => response.json())
                                    .then(result => {
                                        if (result.success) {
                                            console.log(result.message); // Logga om uppdateringen lyckades
                                        } else {
                                            console.error('Failed to update:', result.message); // Logga om uppdateringen misslyckades
                                        }
                                    })
                                    .catch(error => console.error('Error updating ekonomi table:', error)); // Logga eventuella fel

                                    // Lägg till användaren i databasen om den inte finns där
                                    fetch('http://samet-desktop.adm.huddinge.se:3000/insertIntoColourvision', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            username,
                                            level,
                                            userlevel,
                                            tid: averagetime,
                                            pengar_tjanat: money,
                                            exp_tjanat: experience,
                                            netvarde: userNetWorth
                                        })
                                    })
                                        .then(response => response.json())
                                        .then(data => console.log('User inserted into colourvision:', data)) // Logga när användaren är inlagd
                                        .catch(error => console.error('Error inserting into colourvision:', error)); // Logga eventuella fel
                                }
                            })
                            .catch(error => console.error('Error fetching colourvision data:', error)); // Logga eventuella fel
                        }
                    })
                    .catch(error => {
                        console.error('Error getting user data:', error); // Logga eventuella fel vid hämtning av användardata
                    });
            }
    
            getUserData(username); // Hämtar användardata baserat på användarnamnet
    
            newPopupOverlay.style.display = 'block'; // Visar överlägget
            newGameOverPopup.style.display = 'block'; // Visar spelet slut-popupen
            newGameOverPopup.style.opacity = '1'; // Sätter opacitet för att göra popupen synlig

            newPopupOverlay.classList.add('visible'); // Lägger till 'visible' klass för animation på överlägget
            newGameOverPopup.classList.add('visible'); // Lägger till 'visible' klass för animation på spelet slut-popupen
            buyAttemptsButton.style.display = 'block'; // Visar knappen för att köpa fler försök
            buyAttemptsButton.style.marginLeft = "12%"; // Justerar vänstermarginalen för knappen

            } else if (username === "guest") { // Kollar om användarnamnet är "guest"
                gameStarted = false; // Stoppar spelet om användaren är en gäst
                clearInterval(timerInterval); // Stänger av eventuella aktiva timerintervall
                totalTimePlayed += Math.floor((Date.now() - startTime) / 1000); // Uppdaterar den totala spelade tiden
                
                // Uppdaterar den visade nivån och tiden spelad för popupen när spelet är slut
                document.getElementById('new-popup-level').textContent = `Level: ${level}`;
                document.getElementById('new-popup-time').textContent = `Total Time Played: ${totalTimePlayed}s`;
                
                newPopupOverlay.style.display = 'block'; // Visar överlägget
                newGameOverPopup.style.display = 'block'; // Visar spelet slut-popupen
                newGameOverPopup.style.opacity = '1'; // Gör spelet slut-popupen synlig
            }
        }

        function closePopup() { // Funktion för att stänga popupen
            newPopupOverlay.style.display = 'none'; // Döljer överlägget
            location.reload(); // Laddar om sidan
        }
        
        createGrid(); // Skapar spelrutnätet
        startButton.addEventListener('click', startGame); // Lägg till eventlyssnare för startknappen
        newPopupCloseButton.addEventListener('click', closePopup); // Lägg till eventlyssnare för att stänga popupen
        newPopupOverlay.addEventListener('click', (e) => { // Lyssnar på klick på överlägget
            if (e.target === newPopupOverlay) closePopup(); // Stänger popupen om bakgrunden klickas
        });
        
        newBuyAttemptsButton.addEventListener('click', () => { // Klickhändelse för att köpa fler försök
            fetch('http://samet-desktop.adm.huddinge.se:3000/ekonomi') // Hämtar ekonomiuppgifter från servern
                .then(res => res.json()) // Omvandlar svaret till JSON
                .then(ekonomiResponse => {
                    const matchedUser = ekonomiResponse.find(user => user.username === username); // Hittar användaren i svaret
                    if (matchedUser && matchedUser.value >= currentCost) { // Om användaren har tillräckligt med AP
                        const updateData = {
                            username: username,
                            cost: currentCost
                        };
        
                        fetch('http://samet-desktop.adm.huddinge.se:3000/update-ekonomi2', { // Uppdaterar ekonomi på servern
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updateData),
                        })
                        .then(response => response.json()) // Omvandlar svar till JSON
                        .then(result => {
                            if (result.success) { // Om uppdateringen var framgångsrik
                                attempts += 3; // Ökar antal försök
                                updateStats(); // Uppdaterar visade stats
                                newPopupOverlay.style.display = 'none'; // Döljer popupen
                                newGameOverPopup.style.display = 'none'; // Döljer spelet slut-popupen
                                startGame(); // Startar om spelet
        
                                currentCost *= 2; // Fördubblar kostnaden för nästa gång
                                newBuyAttemptsButton.textContent = `Buy Attempts (${currentCost} AP)`; // Uppdaterar knapptexten
                            }
                        });
                    } else {
                        alert(`Not enough AP coins! You need ${currentCost} AP.`); // Meddelar om inte tillräckligt med AP
                    }
                });
        });
        
        // Hjälpfunktion för att uppdatera visade stats
        function updateStats() {
            attemptsDisplay.textContent = `Attempts: ${attempts}`; // Uppdaterar antalet försök
            timerDisplay.textContent = `Time Left: ${timer}s`; // Uppdaterar timer
            levelInfo.textContent = `Level: ${level}`; // Uppdaterar nivå
        }
        
        
        
        } else if (currentPhpFile === "spel4.php") { // Kollar om den aktuella PHP-filen är 'spel4.php'
            let baseCost = 50; // Grundkostnad för att köpa fler försök
            let currentCost = baseCost; // Initierar nuvarande kostnad
        
            function gainExp(expAmount, callback) { // Funktion för att ge erfarenhetspoäng
                var xhr = new XMLHttpRequest(); // Skapar XMLHttpRequest för att kommunicera med servern
                xhr.open("POST", "sida.php", true); // Skickar POST-förfrågan till 'sida.php'
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); // Ställer in headers för POST-begäran
            
                xhr.onreadystatechange = function() { // Funktion som körs när svar mottas från servern
                    if (xhr.readyState == 4 && xhr.status == 200) { // Om svaret är klart och status är OK
                        var response = JSON.parse(xhr.responseText); // Omvandlar svaret till JSON
                        var currentExp = response.current_exp; // Hämtar nuvarande erfarenhetspoäng
                        var nextLevelExp = response.next_level_exp; // Hämtar erfarenhetspoäng som krävs för nästa nivå
                        var level = response.level; // Hämtar nuvarande nivå
            
                        // Funktion för att formatera nummer med rätt enheter (K, M, G)
                        function formatNumber(number) {
                            if (number >= 1000000000) {
                                return (number / 1000000000).toFixed(1) + 'G'; // G för miljarder
                            } else if (number >= 1000000) {
                                return (number / 1000000).toFixed(1) + 'M'; // M för miljoner
                            } else if (number >= 1000) {
                                return (number / 1000).toFixed(1) + 'K'; // K för tusen
                            } else {
                                return number; // Returnerar talet som det är
                            }
                        }
            
                        var formattedCurrentExp = formatNumber(currentExp); // Formaterar nuvarande XP
                        var formattedNextLevelExp = formatNumber(nextLevelExp); // Formaterar XP för nästa nivå
            
                        // Uppdaterar EXP-bar och text
                        var progressBar = document.getElementById('expProgress');
                        var expText = document.getElementById('expText');
                        progressBar.style.width = (currentExp / nextLevelExp) * 100 + '%'; // Uppdaterar bredden på EXP-bar
                        expText.textContent = formattedCurrentExp + '/' + formattedNextLevelExp + ' EXP'; // Uppdaterar EXP-text
            
                        // Uppdaterar spelarens nivå
                        document.getElementById('level').textContent = level;
            
                        // Om callback tillhandahålls, kör den med EXP-data
                        if (callback) {
                            callback(currentExp, nextLevelExp, level);
                        }
                    }
                };
            
                // Skickar förfrågan till servern med den angivna EXP-mängden
                xhr.send("add_exp=true&exp_amount=" + expAmount);
            }
        
            let startTime = null; // Spårar när spelet startar
            let totalElapsedTime = 0; // Spårar den totala förflutna tiden i sekunder
        
            // Hämtar användarnamnet från PHP-elementet
            const phpFileInfo = document.getElementById("php-file-info");
            const username = phpFileInfo.dataset.username; // Hämtar användarnamnet från dataset        

        // Hämtar användarens nivå baserat på användarnamnet
        async function fetchUserLevel(username) {
            try {
                // Hämtar all data från poangssystem endpoint
                const response = await fetch(`http://samet-desktop.adm.huddinge.se:3000/poangssystem`);
                const data = await response.json();

                // Kollar om svaret är en array
                if (!Array.isArray(data)) {
                    console.error("Ogiltigt svarformat: Förväntade en array");
                    return 1; // Återgår till nivå 1 om svaret inte är en array
                }

                // Hittar användaren med matchande 'Namn' (användarnamn)
                const user = data.find((entry) => entry.Namn === username);

                // Om användaren hittas och nivå definieras, returnera deras nivå, annars återgå till nivå 1
                if (user && user.Levels) {
                    return user.Levels;
                } else {
                    console.log("Användare inte hittad eller nivå inte definierad. Återgår till nivå 1.");
                    return 1;
                }
            } catch (error) {
                console.error("Fel vid hämtning av användarnivå:", error);
                return 1; // Återgår till nivå 1 om ett fel inträffar
            }
        }

        // Kollar om en användare existerar
        async function checkUserExists(username) {
            try {
                const response = await fetch(`http://samet-desktop.adm.huddinge.se:3000/mazerunner?username=${username}`);
                const data = await response.json();
                return data.length > 0; // Returnerar true om användaren finns
            } catch (error) {
                console.error("Fel vid kontroll av användare:", error);
                return false; // Returnerar false om ett fel inträffar
            }
        }

        // Sätter in användarens data i mazerunner-tabellen och uppdaterar ekonomi
        async function insertUser(username, level, userlevel, averagetime) {
            try {
                const pengar_tjanat = 10 * userlevel * level; // Beräknar pengar tjänade
                const exp_tjanat = 10 * userlevel * level; // Beräknar erfarenhetspoäng tjänade

                // Sätter in användaren i mazerunner-tabellen
                const mazerunnerResponse = await fetch("http://samet-desktop.adm.huddinge.se:3000/mazerunner", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username,
                        nivå: level,
                        level: userlevel,
                        tid: averagetime,
                        pengar_tjanat,
                        exp_tjanat,
                    }),
                });

                if (!mazerunnerResponse.ok) {
                    throw new Error(`HTTP-fel! Status: ${mazerunnerResponse.status}`);
                }

                // Kollar om användaren finns i ekonomi
                const ekonomiCheckResponse = await fetch(`http://samet-desktop.adm.huddinge.se:3000/ekonomi?username=${username}`);
                if (!ekonomiCheckResponse.ok) {
                    throw new Error(`HTTP-fel! Status: ${ekonomiCheckResponse.status}`);
                }
                const ekonomiData = await ekonomiCheckResponse.json();

                if (ekonomiData.length > 0) {
                    // Om användaren finns, uppdatera ekonomi
                    const ekonomiUpdateResponse = await fetch(`http://samet-desktop.adm.huddinge.se:3000/ekonomi`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            username,
                            value: pengar_tjanat, 
                            networth: pengar_tjanat,
                        }),
                    });

                    if (!ekonomiUpdateResponse.ok) {
                        throw new Error(`HTTP-fel! Status: ${ekonomiUpdateResponse.status}`);
                    }
                } else {
                    // Om användaren inte finns, sätt in användaren i ekonomi
                    const ekonomiInsertResponse = await fetch(`http://samet-desktop.adm.huddinge.se:3000/ekonomi`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            username,
                            value: pengar_tjanat, 
                            networth: pengar_tjanat,
                        }),
                    });

                    if (!ekonomiInsertResponse.ok) {
                        throw new Error(`HTTP-fel! Status: ${ekonomiInsertResponse.status}`);
                    }
                    console.log(`Ekonomi insatt för ${username}.`);
                }
            } catch (error) {
                console.error("Fel vid inmatning av användare och uppdatering av ekonomi:", error);
            }
        }
        
        // Funktion för att uppdatera användarens data i både mazerunner och ekonomi
    async function updateUser(username, level, userlevel, averagetime) {
        try {
            const pengar_tjanat = 10 * userlevel * level; // Beräknar pengar tjänade
            const exp_tjanat = 10 * userlevel * level; // Beräknar erfarenhetspoäng tjänade

            // Uppdaterar mazerunner-tabellen
            const mazerunnerResponse = await fetch(`http://samet-desktop.adm.huddinge.se:3000/mazerunner`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    nivå: level,
                    level: userlevel,
                    tid: averagetime,
                    pengar_tjanat,
                    exp_tjanat,
                }),
            });

            if (!mazerunnerResponse.ok) {
                throw new Error(`HTTP-fel! Status: ${mazerunnerResponse.status}`);
            }

            // Uppdaterar ekonomi-tabellen (adderar pengar_tjanat till value och networth)
            const ekonomiResponse = await fetch(`http://samet-desktop.adm.huddinge.se:3000/ekonomi`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    value: pengar_tjanat, // Lägger till pengar_tjanat till value
                    networth: pengar_tjanat, // Lägger till pengar_tjanat till networth
                }),
            });

            if (!ekonomiResponse.ok) {
                throw new Error(`HTTP-fel! Status: ${ekonomiResponse.status}`);
            }

            const ekonomiData = await ekonomiResponse.json();
            return ekonomiData; // Returnerar uppdaterad ekonomi-data
        } catch (error) {
            console.error("Fel vid uppdatering av användare och ekonomi:", error);
            throw error; // Kastar vidare felet för att hantera det högre upp
        }
    }

    class MazeBuilder {

        constructor(width, height) {

            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            // Beräknar maximala rader och kolumner baserat på skärmstorlek
            const cellSize = 20; // Storleken på varje cell i pixlar
            const maxCols = Math.floor(screenWidth / cellSize);
            const maxRows = Math.floor(screenHeight / cellSize);

            // Säkerställer att labyrinten har minst 4 rader och kolumner
            this.width = Math.max(4, Math.floor(maxCols / 2));
            this.height = Math.max(4, Math.floor(maxRows / 2));

            this.cols = 2 * this.width + 1;
            this.rows = 2 * this.height + 1;

            this.maze = this.initArray([]);

            /* Placera initiala väggar */

            this.maze.forEach((row, r) => {
                row.forEach((cell, c) => {
                    switch(r)
                    {
                        case 0:
                        case this.rows - 1:
                            this.maze[r][c] = ["wall"];
                            break;

                        default:
                            if((r % 2) == 1) {
                                if((c == 0) || (c == this.cols - 1)) {
                                    this.maze[r][c] = ["wall"];
                                }
                            } else if(c % 2 == 0) {
                                this.maze[r][c] = ["wall"];
                            }
                    }
                });

                if(r == 0) {
                    // Placera utgången i översta raden
                    let doorPos = this.posToSpace(this.rand(1, this.width));
                    this.maze[r][doorPos] = ["door", "exit"];
                }

                if(r == this.rows - 1) {
                    // Placera ingången i nedersta raden
                    let doorPos = this.posToSpace(this.rand(1, this.width));
                    this.maze[r][doorPos] = ["door", "entrance"];
                }
            });

            /* Börjar dela upp labyrinten */

            this.partition(1, this.height - 1, 1, this.width - 1);
        }

        // Skapar en array med de givna värdena
        initArray(value) {
            return new Array(this.rows).fill().map(() => new Array(this.cols).fill(value));
        }

        // Slumpar ett tal inom ett givet intervall
        rand(min, max) {
            return min + Math.floor(Math.random() * (1 + max - min));
        }

        // Omvandlar en position till ett utrymme i labyrinten
        posToSpace(x) {
            return 2 * (x - 1) + 1;
        }

        // Omvandlar en position till en vägg
        posToWall(x) {
            return 2 * x;
        }

        // Kollar om en position är inom labyrintens gränser
        inBounds(r, c) {
            if((typeof this.maze[r] == "undefined") || (typeof this.maze[r][c] == "undefined")) {
                return false; // Om utanför gränserna
            }
            return true; // Om inom gränserna
        }

        // Blandar en array
        shuffle(array) {
            // Källa: https://stackoverflow.com/a/12646864
            for(let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]]; // Byter plats på elementen
            }
            return array; // Returnerar den blandade arrayen
        }

        
            // Funktion för att skapa partitionering av väggar i labyrinten
        partition(r1, r2, c1, c2) {
            /* skapa partitioneringsväggar
            källa: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method */
        
            let horiz, vert, x, y, start, end;
        
            if ((r2 < r1) || (c2 < c1)) {
                return false; // Om områdets höger-/nederkant är utanför vänster-/övre kanten
            }
        
            if (r1 == r2) {
                horiz = r1; // Om raderna är lika, sätt horisontell vägg vid r1
            } else {
                x = r1 + 1;
                y = r2 - 1;
                start = Math.round(x + (y - x) / 4); // Bestäm startpunkt för horisontell vägg
                end = Math.round(x + 3 * (y - x) / 4); // Bestäm slutpunkt för horisontell vägg
                horiz = this.rand(start, end); // Välj en slumpmässig plats för horisontell vägg
            }
        
            if (c1 == c2) {
                vert = c1; // Om kolumnerna är lika, sätt vertikal vägg vid c1
            } else {
                x = c1 + 1;
                y = c2 - 1;
                start = Math.round(x + (y - x) / 3); // Bestäm startpunkt för vertikal vägg
                end = Math.round(x + 2 * (y - x) / 3); // Bestäm slutpunkt för vertikal vägg
                vert = this.rand(start, end); // Välj en slumpmässig plats för vertikal vägg
            }
        
            // Skapar väggar för partitionen
            for (let i = this.posToWall(r1) - 1; i <= this.posToWall(r2) + 1; i++) {
                for (let j = this.posToWall(c1) - 1; j <= this.posToWall(c2) + 1; j++) {
                    if ((i == this.posToWall(horiz)) || (j == this.posToWall(vert))) {
                        this.maze[i][j] = ["wall"]; // Sätt vägg på den beräknade positionen
                    }
                }
            }
        
            // Skapar luckor i partitioneringsväggarna för att tillåta flera vägar
            let primaryGaps = this.shuffle([true, true, true, false]); // Säkerställer en primär lucka per partition
            let extraGaps = this.shuffle([true, false, false, false]); // Ytterligare luckor för fler vägar
        
            // Funktion för att skapa en lucka genom att ta bort en vägg
            const createGap = (row, col) => {
                if (this.inBounds(row, col) && this.maze[row][col].includes("wall")) {
                    this.maze[row][col] = []; // Ta bort väggen för att skapa en väg
                }
            };
        
            // Skapar primära luckor
            if (primaryGaps[0]) createGap(this.posToWall(horiz), this.posToSpace(this.rand(c1, vert)));
            if (primaryGaps[1]) createGap(this.posToWall(horiz), this.posToSpace(this.rand(vert + 1, c2 + 1)));
            if (primaryGaps[2]) createGap(this.posToSpace(this.rand(r1, horiz)), this.posToWall(vert));
            if (primaryGaps[3]) createGap(this.posToSpace(this.rand(horiz + 1, r2 + 1)), this.posToWall(vert));
        
            // Skapar extra luckor
            if (extraGaps[0]) createGap(this.posToWall(horiz), this.posToSpace(this.rand(c1, vert)));
            if (extraGaps[1]) createGap(this.posToWall(horiz), this.posToSpace(this.rand(vert + 1, c2 + 1)));
            if (extraGaps[2]) createGap(this.posToSpace(this.rand(r1, horiz)), this.posToWall(vert));
            if (extraGaps[3]) createGap(this.posToSpace(this.rand(horiz + 1, r2 + 1)), this.posToWall(vert));
        
            // Rekursiv partitionering för de nya delarna av labyrinten
            this.partition(r1, horiz - 1, c1, vert - 1);
            this.partition(horiz + 1, r2, c1, vert - 1);
            this.partition(r1, horiz - 1, vert + 1, c2);
            this.partition(horiz + 1, r2, vert + 1, c2);
        }

        // Funktion för att kontrollera om en cell är en lucka (väg)
        isGap(...cells) {
            return cells.every((array) => {
                let row, col;
                [row, col] = array;
                if(this.maze[row][col].length > 0) {
                    if(!this.maze[row][col].includes("door")) {
                        return false; // Om det inte är en dörr
                    }
                }
                return true; // Om det är en öppning eller dörr
            });
        }

        // Funktion för att räkna steg för att nå en viss plats
        countSteps(array, r, c, val, stop) {

            if(!this.inBounds(r, c)) {
                return false; /* utanför gränserna */
            }

            if(array[r][c] <= val) {
                return false; /* Kortare väg har redan kartlagts */
            }

            if(!this.isGap([r, c])) {
                return false; /* Kan inte passera här */
            }

            array[r][c] = val;

            if(this.maze[r][c].includes(stop)) {
                return true; /* Målet har nåtts */
            }

            // Räkna steg i alla fyra riktningar
            this.countSteps(array, r-1, c, val+1, stop);
            this.countSteps(array, r, c+1, val+1, stop);
            this.countSteps(array, r+1, c, val+1, stop);
            this.countSteps(array, r, c-1, val+1, stop);
        }

        // Funktion för att hitta nyckelns position i labyrinten
        getKeyLocation() {

            let fromEntrance = this.initArray();
            let fromExit = this.initArray();

            this.totalSteps = -1;

            // Räkna steg från ingången och utgången
            for(let j = 1; j < this.cols-1; j++) {
                if(this.maze[this.rows-1][j].includes("entrance")) {
                    this.countSteps(fromEntrance, this.rows-1, j, 0, "exit");
                }
                if(this.maze[0][j].includes("exit")) {
                    this.countSteps(fromExit, 0, j, 0, "entrance");
                }
            }

            let fc = -1, fr = -1;

            // Hitta cellen med flest gemensamma steg från både ingång och utgång
            this.maze.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if(typeof fromEntrance[r][c] == "undefined") {
                        return;
                    }
                    let stepCount = fromEntrance[r][c] + fromExit[r][c];
                    if(stepCount > this.totalSteps) {
                        fr = r;
                        fc = c;
                        this.totalSteps = stepCount;
                    }
                });
            });

            return [fr, fc]; // Returnerar den bästa platsen för nyckeln
        }

        
        placeKey() {
            // Variabler för rad och kolumn där nyckeln ska placeras
            let fr, fc;
            // Hämta platsen för nyckeln
            [fr, fc] = this.getKeyLocation();
        
            // Placera nyckeln på den angivna platsen i labyrinten
            this.maze[fr][fc] = ["key"];
        }
        
        display(id) {
            // Hämta föräldradiv med det angivna id:t
            this.parentDiv = document.getElementById(id);
        
            // Om föräldradiven inte existerar, returnera falskt
            if (!this.parentDiv) {
                return false;
            }
        
            // Ta bort alla tidigare barn från föräldradiven
            while (this.parentDiv.firstChild) {
                this.parentDiv.removeChild(this.parentDiv.firstChild);
            }
        
            // Skapa en container för labyrinten
            const container = document.createElement("div");
            container.id = "maze";
            container.dataset.steps = this.totalSteps;  // Lägg till antalet steg i data-attribut
        
            // Gå igenom varje rad i labyrinten och skapa en div för varje rad och cell
            this.maze.forEach((row) => {
                let rowDiv = document.createElement("div");
                row.forEach((cell) => {
                    let cellDiv = document.createElement("div");
                    if (cell) {
                        // Om cellen innehåller något (t.ex. en nyckel), sätt klassen till cellens innehåll
                        cellDiv.className = cell.join(" ");
                    }
                    rowDiv.appendChild(cellDiv);  // Lägg till cellen till raden
                });
                container.appendChild(rowDiv);  // Lägg till raden till containern
            });
        
            // Lägg till containern till föräldradiven
            this.parentDiv.appendChild(container);
        
            return true;  // Returtrue för att indikera att visningen lyckades
        }        
        }
        
        
        class Player {
            constructor(maze) {
                this.maze = maze;
                this.position = { row: maze.rows - 2, col: maze.cols - 2 }; // Starta nära ingången
                this.hasKey = false;
                this.isMovementEnabled = false; // Inaktivera rörelse initialt
            }
        
            init() {
                document.addEventListener("keydown", (e) => this.move(e)); // Lägg till lyssnare för rörelse
                this.updatePlayerPosition(); // Uppdatera spelarens position i UI
            }
        
            move(event) {
                if (!this.isMovementEnabled) return; // Endast rörelse om den är aktiverad
        
                let { row, col } = this.position;
        
                switch (event.key) {
                    case "ArrowUp":
                        row -= 1; // Flytta uppåt
                        break;
                    case "ArrowDown":
                        row += 1; // Flytta nedåt
                        break;
                    case "ArrowLeft":
                        col -= 1; // Flytta vänster
                        break;
                    case "ArrowRight":
                        col += 1; // Flytta höger
                        break;
                    default:
                        return;
                }
        
                if (this.canMoveTo(row, col)) {
                    this.position = { row, col }; // Uppdatera position
                    this.checkInteraction(); // Kontrollera interaktioner
                    this.updatePlayerPosition(); // Uppdatera position i UI
                }
            }
        
            enableMovement() {
                this.isMovementEnabled = true; // Aktivera rörelse
            }
        
            disableMovement() {
                this.isMovementEnabled = false; // Inaktivera rörelse
            }
        
            canMoveTo(row, col) {
                // Kontrollera om positionen är inom gränserna
                if (row < 0 || row >= this.maze.rows || col < 0 || col >= this.maze.cols) {
                    return false;
                }
        
                // Hämta cellen på den nya positionen
                const cell = this.maze.maze[row][col];
        
                // Kontrollera om cellen innehåller en vägg
                if (cell.includes("wall")) {
                    return false;
                }
        
                // Extra kontroll för att säkerställa att cellen inte är en dörr (om nödvändigt)
                if (cell.includes("door") && !cell.includes("entrance") && !cell.includes("exit")) {
                    return false;
                }
        
                return true;
            }
        
            generateNewMaze() {
                if (monster) monster.stopHunting(); // Stoppa monster om det finns ett
        
                let width = 40;
                let height = 24;
                const newMaze = new MazeBuilder(width, height); // Skapa en ny labyrint
                newMaze.placeKey(); // Placera nyckeln i labyrinten
                newMaze.display("maze_container"); // Visa labyrinten i UI
        
                this.maze = newMaze;
                this.position = { row: newMaze.rows - 2, col: newMaze.cols - 2 }; // Återställ spelaren till startposition
                this.hasKey = false;
                this.updatePlayerPosition(); // Uppdatera spelarens position i UI
        
                monster = new Monster(newMaze); // Skapa ett nytt monster
                monster.init();
                startTimer(); // Starta timern för spelet
            }
        
            checkInteraction() {
                const cell = this.maze.maze[this.position.row][this.position.col];
                if (cell.includes("key")) {
                    this.pickUpKey(); // Plocka upp nyckeln
                } else if (cell.includes("exit") && this.hasKey) {
                    completeMaze(); // Avsluta labyrinten om nyckeln är upphämtad
                }
            }
        
            pickUpKey() {
                this.hasKey = true; // Spelaren har nu nyckeln
        
                // Ta bort nyckeln från labyrintens data
                this.maze.maze[this.position.row][this.position.col] = [];
        
                // Uppdatera DOM
                const currentCell = document
                    .getElementById("maze")
                    .children[this.position.row]
                    .children[this.position.col];
                currentCell.classList.remove("key"); // Ta bort nyckelns visuella representation
        
                // Uppdatera UI för att indikera att spelaren har nyckeln
                document.getElementById("maze_score").classList.add("has-key");
            }         
        
            updatePlayerPosition() {
                // Ta bort tidigare position av spelaren i UI
                document.querySelectorAll(".hero").forEach((el) => el.classList.remove("hero"));
                
                // Hitta aktuell cell och markera den som spelarens position
                const currentCell = document
                    .getElementById("maze")
                    .children[this.position.row]
                    .children[this.position.col];
                currentCell.classList.add("hero");
            }
        }
        

        class Monster {
            constructor(maze) {
                this.maze = maze;
                this.position = { row: 1, col: 1 }; // Startposition för monstret
                this.huntInterval = null; // Håller koll på intervallet för rörelse
            }
        
            startHunting() {
                if (this.huntInterval) {
                    clearInterval(this.huntInterval); // Rensa eventuellt tidigare intervall
                }
                this.huntInterval = setInterval(() => this.moveTowardsPlayer(), 500); // Starta jakt på spelaren
            }
        
            resetPosition() {
                this.position = { row: 1, col: 1 }; // Återställ till startposition
                this.updateMonsterPosition();
            }
        
            stopHunting() {
                if (this.huntInterval) {
                    clearInterval(this.huntInterval);
                    this.huntInterval = null; // Stoppa jaktintervallet
                }
            }
        
            init() {
                this.updateMonsterPosition(); // Uppdatera monsterposition i UI
                this.startHunting(); // Starta jakt på spelaren
            }
        
            canMoveTo(row, col) {
                return (
                    row >= 0 && row < this.maze.rows &&
                    col >= 0 && col < this.maze.cols &&
                    !this.maze.maze[row][col].includes("wall") // Kontrollera att monstret inte går in i en vägg
                );
            }
        
            findShortestPath(targetRow, targetCol) {
                const directions = [
                    { row: -1, col: 0 }, // Upp
                    { row: 1, col: 0 },  // Ner
                    { row: 0, col: -1 }, // Vänster
                    { row: 0, col: 1 },  // Höger
                ];
                const queue = [{ row: this.position.row, col: this.position.col, path: [] }];
                const visited = Array.from({ length: this.maze.rows }, () => Array(this.maze.cols).fill(false));
                visited[this.position.row][this.position.col] = true;
        
                while (queue.length > 0) {
                    const { row, col, path } = queue.shift();
                    if (row === targetRow && col === targetCol) return path; // Returnera kortaste vägen till spelaren
        
                    for (const direction of directions) {
                        const newRow = row + direction.row;
                        const newCol = col + direction.col;
                        if (this.canMoveTo(newRow, newCol) && !visited[newRow][newCol]) {
                            visited[newRow][newCol] = true;
                            queue.push({ row: newRow, col: newCol, path: [...path, direction] });
                        }
                    }
                }
                return [];
            }
        
            moveTowardsPlayer() {
                const path = this.findShortestPath(player.position.row, player.position.col);
                if (path.length > 0) {
                    const nextMove = path[0]; // Nästa rörelse mot spelaren
                    this.position.row += nextMove.row;
                    this.position.col += nextMove.col;
                    this.updateMonsterPosition(); // Uppdatera positionen i UI
                    this.checkCollision(); // Kontrollera om monstret har träffat spelaren
                }
            }
        
            startHunting() {
                this.huntInterval = setInterval(() => this.moveTowardsPlayer(), 500); // Starta jaktintervallet
            }
        
            updateMonsterPosition() {
                // Ta bort tidigare position av monstret i UI
                document.querySelectorAll(".monster").forEach(el => el.classList.remove("monster"));
                // Uppdatera positionen i DOM
                document.getElementById("maze").children[this.position.row].children[this.position.col].classList.add("monster");
            }
        
            checkCollision() {
                if (this.position.row === player.position.row && this.position.col === player.position.col) {
                    attempts--; // Minska antal försök
                    updateHUD(); // Uppdatera spelets UI
                    if (attempts > 0) {
                        // Om det finns försök kvar, starta om spelet/timern
                    } else {
                        showPopup(); // Visa popup när spelaren har slut på försök
                    }
                }
            }
        }
        
        // Globala variabler för spelet
        let level = 1;
        let attempts = 3;
        let timeLeft = 180;
        let timer;
        
        function startTimer() {
            clearInterval(timer); // Rensa eventuell befintlig timer
            timeLeft = 180; // Återställ tid
            updateHUD(); // Uppdatera spelets UI
            timer = setInterval(() => {
                timeLeft--; // Minska tiden
                updateHUD();
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    showPopup(); // Visa popup när tiden är ute
                }
            }, 1000);
        }
        
        function updateHUD() {
            document.getElementById("level_counter").textContent = level;
            document.getElementById("time_counter").textContent = timeLeft;
            document.getElementById("attempts_counter").textContent = attempts;
        }
        
        // Skapa och tillämpa CSS-stil för popup
        const style = document.createElement('style');
        style.innerHTML = `
            #popupOverlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center; /* Centrera både horisontellt och vertikalt */
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
        
            #popupOverlay.visible {
                opacity: 1;
                visibility: visible;
            }
        
            #popupOverlay.visible #popup {
                transform: translateY(0); /* Placera popup i centrum */
            }
        
            #popup h2 {
                margin: 0 0 10px;
                font-size: 1.5em;
                color: black;
            }
        
            #popup p {
                margin: 5px 0;
                color: black;
            }
        
            #closePopup {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 1.2em;
                cursor: pointer;
            }
        
            #closePopup:hover {
                color: #e00; /* Röd färg vid hovring */
            }
        
            #buy-attempts-button {
                margin-left: 40px;
            }
        `;
        document.head.appendChild(style);        

        async function showPopup() {
            // stanna spelaren
            player.disableMovement();
        
            // räkna ut tiden som tagits för att klara spelet
            const endTime = Date.now();
            const elapsedTimeInSeconds = Math.floor((endTime - startTime) / 1000);
            const averagetime = elapsedTimeInSeconds / level;
        
            // skapa popupen och innehållet
            const popupOverlay = document.createElement('div');
            popupOverlay.id = 'popupOverlay';
        
            if (!username) {
                popupOverlay.innerHTML = `
                    <div id="popup">
                        <button id="closePopup">&times;</button>
                        <h2>Game Over</h2>
                        <p>Level Reached: ${level}</p>
                        <p>Time Taken: ${elapsedTimeInSeconds} seconds</p>
                    </div>
                `;
            }
            
            if (username) {
                const userlevel = await fetchUserLevel(username);
                popupOverlay.innerHTML = `
                    <div id="popup">
                        <button id="closePopup">&times;</button>
                        <h2>Game Over</h2>
                        <p>Level Reached: ${level}</p>
                        <p>Time Taken: ${elapsedTimeInSeconds} seconds</p>
                        <p>EXP Earned: ${10 * userlevel * level}</p>
                        <p>Money Earned: ${10 * userlevel * level}</p>
                        <button id="buy-attempts-button">Buy 3 Attempts (Cost: <span id="cost">50</span> AP)</button>
                    </div>
                `;
            } else {
                popupOverlay.innerHTML = `
                    <div id="popup">
                        <button id="closePopup">&times;</button>
                        <h2>Game Over</h2>
                        <p>Level Reached: ${level}</p>
                        <p>Time Taken: ${elapsedTimeInSeconds} seconds</p>
                    </div>
                `;
            }
        
            document.body.appendChild(popupOverlay);
        
            // visa popupen efter en kort fördröjning 
            setTimeout(() => {
                popupOverlay.classList.add('visible');
            }, 10);
        
            // frys spelet 
            clearInterval(timer); // stanna timern
            if (monster) monster.stopHunting(); // stana monstret 
        
            // stäng popupen när användaren klickar på krysset eller bakgrunden
            popupOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'popupOverlay' || e.target.id === 'closePopup') {
                    window.location.reload();
                }
            });
        
            // Databas operationer för att uppdatera användarens data
            if (username) {
                const userlevel = await fetchUserLevel(username);
        
                const pengar = 10 * userlevel * level;
                const exp = 10 * userlevel * level;
        
                gainExp(exp);
        
                const userExists = await checkUserExists(username);
        
                if (!userExists) {
                    gainExp(2 * level * userlevel);  
                    await insertUser(username, level, userlevel, averagetime, pengar, exp);
                } else {
                    const currentData = await fetch(`http://samet-desktop.adm.huddinge.se:3000/mazerunner?username=${username}`);
                    const existingData = await currentData.json();
        
                    await updateUser(
                        username,
                        level,
                        userlevel,
                        averagetime,
                        10 * userlevel * level,
                        10 * userlevel * level
                    );
                }
            }
        
            if (username) {
                const buyButton = document.getElementById('buy-attempts-button');
                buyButton.style.display = 'block'; // visa alltid om användaren är inloggad
        
                // Funktion för att uppdatera knappens text
                const updateButtonText = () => {
                    document.getElementById('cost').textContent = currentCost;
                };
        
                updateButtonText(); // Updatera knappens text
        
                // Hantera knappklick
                buyButton.addEventListener('click', () => {
                    fetch("http://samet-desktop.adm.huddinge.se:3000/ekonomi")
                        .then(res => res.json())
                        .then(data => {
                            // Hitta användaren i tabellen
                            const user = data.find(user => user.username === username);
                            
                            if (!user) {
                                alert("User not found!");
                                return;
                            }
                
                            const userBalance = user.value;
                            console.log(userBalance);
                
                            if (userBalance >= currentCost) {
                                // ta bort kostnaden från användarens saldo
                                fetch('http://samet-desktop.adm.huddinge.se:3000/update-ekonomi2', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        username: username,
                                        cost: currentCost // minska kostnaden
                                    })
                                }).then(() => {
                                    // starta om spelet
                                    attempts = 3;
                                    timeLeft = 180;
                                    startTime = Date.now();
                
                                    // Nollställ spelarens och monstrets position
                                    player.position = { row: Maze.rows - 2, col: Maze.cols - 2 };
                                    monster.resetPosition();
        
                                    currentCost *= 2;
                
                                    //starta om Ui och spelet
                                    const popupOverlay = document.getElementById('popupOverlay');
                                    if (popupOverlay) popupOverlay.remove();
                                    updateHUD();
                                    startTimer();
                                    player.enableMovement(); // återaktivera spelarens rörelse
                                    updateButtonText(); // updatera knappens text med den nya kostnaden
                                });
                            } else {
                                alert("Not enough AP!");
                            }
                        });
                });                
            }
        }

        function resetGame() {
            attempts = 3;
            timeLeft = 180;
            startTime = Date.now();
            clearInterval(timer);
        
            // Återställ kostnaden för att köpa försök
            currentCost = baseCost;
        
            if (monster) {
                monster.stopHunting();
                monster.resetPosition();
            }
        
            if (player) {
                player.disableMovement(); // Inaktivera spelarens rörelse
                player.position = { row: Maze.rows - 2, col: Maze.cols - 2 };
                player.hasKey = false;
                player.updatePlayerPosition();
            }
        
            updateHUD();
        }
        

        function completeMaze() {
            level++;
            updateHUD();
            player.generateNewMaze();
            startTimer();
            
              // Återställ monsterpositionen för den nya nivån
            if (monster) {
                monster.stopHunting();
                monster.resetPosition();
                monster.startHunting();
            }
        }

        // Uppdatera eventlyssnaren för startknappen
        document.getElementById("start_button").addEventListener("click", () => {
            Maze = new MazeBuilder(40, 24);
            Maze.placeKey();
            Maze.display("maze_container");
        
            player = new Player(Maze);
            player.init();
            player.enableMovement(); //aktivera spelarens rörelse
        
            monster = new Monster(Maze);
            monster.init();
            monster.resetPosition();
        
            document.getElementById("start_page").style.display = "none";
            document.getElementById("maze_container").style.display = "block";
            document.getElementById("game_hud").style.display = "block";
            updateHUD();
        
            startTime = Date.now();  // Sätt starttiden när spelet börjar
            startTimer(); // Starta nedräkningstimern
        });

        // Eventlyssnare för menyknappen
        document.getElementById("menu_button").addEventListener("click", () => {
            resetGame(); // Completely reset the game state
            document.getElementById("start_page").style.display = "flex";
            document.getElementById("maze_container").style.display = "none";
            document.getElementById("game_hud").style.display = "none";
            localStorage.setItem("currentState", "start");
        });
        // Eventlyssnare för menyknappen för att dölja HUD
        document.getElementById("menu_button").addEventListener("click", function() {
            document.getElementById("game_hud").style.display = "none";  // Hide the container
        });
        
        // När 'Start!' knappen klickas på, visa spelets HUD-container
        document.getElementById("start_button").addEventListener("click", function() {
            document.getElementById("game_hud").style.display = "block";//Visa HUD-container
        });

        let Maze = new MazeBuilder(40,24);
        Maze.placeKey();
        Maze.display("maze_container");

        // Initialisera spelaren
        let player = new Player(Maze);
        player.init();

        let monster = new Monster(Maze);
        monster.init();
        updateHUD();

        document.addEventListener("DOMContentLoaded", () => {
            const currentState = localStorage.getItem("currentState");
            
           // Återställ spelstatus när sidan först laddas eller när användaren återgår till startsidan
            resetGame();
            
            if (currentState === "maze") {
                document.getElementById("start_page").style.display = "none";
                document.getElementById("maze_container").style.display = "block";
                document.getElementById("game_hud").style.display = "block";
                
                 // Skapa om spelstatus
                Maze = new MazeBuilder(40, 24);
                Maze.placeKey();
                Maze.display("maze_container");
                player = new Player(Maze);
                player.init();
                monster = new Monster(Maze);
                monster.init();
                updateHUD();
        
              // Initiera starttiden när spelet laddas
                startTime = Date.now(); // Sätt starttiden
                startTimer();// Starta nedräkningstimern
            }
        });

        //om antalet försök är mindre än eller lika med 0, visa popup
        if (attempts <= 0) {
            const buyAttemptsButton = document.getElementById('buy-attempts-button');
            buyAttemptsButton.style.display = 'block';
            updateBuyAttemptsButton();
        }
        
} else if (currentPhpFile === "topplista.php") {
    document.addEventListener("DOMContentLoaded", function () {
        const modes = [
            { text: "Memory - Topplista", tileTexts: ["Nivå", "Level", "Tid/Nivå", "Pengar tjänat i spel", "EXP tjänat i spel", "Netvärde"] },
            { text: "Squigglegolf - Topplista", tileTexts: ["Mängden slag", "Level", "Total tid", "Pengar tjänat i spel", "EXP tjänat i spel", "Netvärde"] },
            { text: "Colourvision - Topplista", tileTexts: ["Nivå", "Level", "Tid/Nivå", "Pengar tjänat i spel", "EXP tjänat i spel", "Netvärde"] },
            { text: "Maze Runner - Topplista", tileTexts: ["Nivå", "Level", "Tid/Nivå", "Pengar tjänat i spel", "EXP tjänat i spel", "Netvärde"] },
            { text: "Biljard - Topplista", tileTexts: ["Mängden slag", "Level", "Total tid", "Pengar tjänat i spel", "EXP tjänat i spel", "Netvärde"] },
        ];
    
        let currentMode = 0;
        const leftButton = document.getElementById("left-button");
        const rightButton = document.getElementById("right-button");
        const leaderboardText = document.getElementById("leaderboard-text");
        const tiles = document.querySelectorAll(".leaderboard-tile");
        
        // Uppdatera visningen av leaderboard baserat på valt mode
        function updateMode(userCounts, memoryData, levelsData, tidData, pengarData, expData, netvardeData) {
            leaderboardText.textContent = modes[currentMode].text;
    
            tiles.forEach((tile, index) => {
                tile.innerHTML = "";   // Rensa tidigare innehåll
    
                const container = document.createElement("div");
                container.style.display = "flex";
                container.style.flexDirection = "column";
                container.style.alignItems = "center";
                container.style.height = "100%";
                container.style.width = "100%";
    
                const outerText = document.createElement("div");
                outerText.textContent = modes[currentMode].tileTexts[index];
                outerText.style.textAlign = "center";
                outerText.style.marginBottom = "10px";
                outerText.style.fontWeight = "bold";
                container.appendChild(outerText);
    
                const innerTile = document.createElement("div");
                innerTile.classList.add("inner-tile");
                innerTile.style.backgroundColor = "rgba(22, 20, 20, 0.7)";
                innerTile.style.color = "white";
                innerTile.style.padding = "10px";
                innerTile.style.height = "85%";
                innerTile.style.width = "90%";
                innerTile.style.overflowY = "auto";
                innerTile.style.maxHeight = "100%";
                innerTile.style.borderRadius = "5px";
                innerTile.style.display = "flex";
                innerTile.style.flexDirection = "column";
                innerTile.style.justifyContent = "flex-start";
    
                 // Hantera specifika fall beroende på valt mode
                if (modes[currentMode].text === "Memory - Topplista") {
                    const memoryEndpoint = "http://samet-desktop.adm.huddinge.se:3000/memory";
                    const ekonomiEndpoint = "http://samet-desktop.adm.huddinge.se:3000/ekonomi";
                    const poangssystemEndpoint = "http://samet-desktop.adm.huddinge.se:3000/poangssystem";
                
                     // Hämta alla datasets parallellt med Promise.all
                    Promise.all([
                        fetch(memoryEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Memory data");
                            return response.json();
                        }),
                        fetch(ekonomiEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Ekonomi data");
                            return response.json();
                        }),
                        fetch(poangssystemEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Poängssystem data");
                            return response.json();
                        })
                    ])
                    .then(([memoryData, ekonomiData, poangssystemData]) => {
                        tiles.forEach((tile, index) => {
                            tile.innerHTML = ""; // Rensa tidigare innehåll
                
                            const container = document.createElement("div");
                            container.style.display = "flex";
                            container.style.flexDirection = "column";
                            container.style.alignItems = "center";
                            container.style.height = "100%";
                            container.style.width = "100%";
                
                            const outerText = document.createElement("div");
                            outerText.textContent = modes[currentMode].tileTexts[index];
                            outerText.style.textAlign = "center";
                            outerText.style.marginBottom = "10px";
                            outerText.style.fontWeight = "bold";
                            container.appendChild(outerText);
                
                            const innerTile = document.createElement("div");
                            innerTile.classList.add("inner-tile");
                            innerTile.style.backgroundColor = "rgba(22, 20, 20, 0.7)";
                            innerTile.style.color = "white";
                            innerTile.style.padding = "10px";
                            innerTile.style.height = "85%";
                            innerTile.style.width = "90%";
                            innerTile.style.overflowY = "auto";
                            innerTile.style.maxHeight = "100%";
                            innerTile.style.borderRadius = "5px";
                            innerTile.style.display = "flex";
                            innerTile.style.flexDirection = "column";
                            innerTile.style.justifyContent = "flex-start";
                
                             // Definiera kolumnnycklar för data
                            const columnKeys = ["nivå", "level", "tid", "pengar_tjanat", "exp_tjanat", "netvarde"];
                            const columnKey = columnKeys[index] || "score";  // Använd en säker kolumnnyckel

                
                            let dataToSort = [...memoryData];
                
                            if (columnKey === "level") {
                                dataToSort = memoryData.map(user => {
                                    const poangUser = poangssystemData.find(p => p.Namn === user.username);
                            
                                    return {
                                        ...user,
                                        level: poangUser && poangUser.Levels !== undefined ? poangUser.Levels : "N/A"// Sätt till "N/A" om level inte finns
                                    };
                                });
                            }
                            
                
                            if (columnKey === "netvarde") {
                                // Slå samman netvarde från ekonomi med användardata från memory
                                dataToSort = memoryData.map(user => {
                                    const ekonomiUser = ekonomiData.find(e => e.username === user.username);
                                    return {
                                        ...user,
                                        netvarde: ekonomiUser && ekonomiUser.networth !== undefined ? ekonomiUser.networth : 0 // Sätt netvarde till 0 om det inte finns
                                    };
                                });
                            }
                
                            // Justera sorteringsordning: Stigande för tile 3 (index 2), fallande för övriga
                            const isAscending = index === 2;
                            dataToSort
                                .filter(row => row[columnKey] !== undefined) // Se till att det inte finns några undefined värden i kolumnen
                                .sort((a, b) => isAscending ? a[columnKey] - b[columnKey] : b[columnKey] - a[columnKey])
                                .forEach((row, rank) => {
                                    const div = document.createElement("div");
                                    div.style.display = "flex";
                                    div.style.justifyContent = "space-between";
                                    div.style.margin = "5px 0";
                                    div.style.padding = "10px";
                                    div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                                    div.style.borderRadius = "3px";
                
                                    const leftSpan = document.createElement("span");
                                    leftSpan.textContent = `${rank + 1}. ${row.username ? row.username.charAt(0).toUpperCase() + row.username.slice(1) : "Unknown"}`;
                                    leftSpan.style.flex = "1";
                                    leftSpan.style.textAlign = "left";
                
                                    const rightSpan = document.createElement("span");
                                    rightSpan.textContent = row[columnKey] !== undefined ? row[columnKey] : "-";
                                    rightSpan.style.flex = "0";
                                    rightSpan.style.textAlign = "right";
                
                                    div.appendChild(leftSpan);
                                    div.appendChild(rightSpan);
                                    innerTile.appendChild(div);
                                });
                
                            container.appendChild(innerTile);
                            tile.appendChild(container);
                        });
                    })
                    .catch((error) => {
                        console.error("Error fetching data:", error);
                    });
                } else if (modes[currentMode].text === "Squigglegolf - Topplista") {
                    const squigglegolfEndpoint = "http://samet-desktop.adm.huddinge.se:3000/squigglegolf";
                    const ekonomiEndpoint = "http://samet-desktop.adm.huddinge.se:3000/ekonomi";
                    const poangssystemEndpoint = "http://samet-desktop.adm.huddinge.se:3000/poangssystem";
                
                   // Hämta alla datasets parallellt med Promise.all
                    Promise.all([
                        fetch(squigglegolfEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Squigglegolf data");
                            return response.json();
                        }),
                        fetch(ekonomiEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Ekonomi data");
                            return response.json();
                        }),
                        fetch(poangssystemEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Poängssystem data");
                            return response.json();
                        })
                    ])
                    .then(([squigglegolfData, ekonomiData, poangssystemData]) => {
                        tiles.forEach((tile, index) => {
                            tile.innerHTML = ""; // Rensa tidigare innehåll
                            
                            const container = document.createElement("div");
                            container.style.display = "flex";
                            container.style.flexDirection = "column";
                            container.style.alignItems = "center";
                            container.style.height = "100%";
                            container.style.width = "100%";
                
                            const outerText = document.createElement("div");
                            outerText.textContent = modes[currentMode].tileTexts[index];
                            outerText.style.textAlign = "center";
                            outerText.style.marginBottom = "10px";
                            outerText.style.fontWeight = "bold";
                            container.appendChild(outerText);
                
                            const innerTile = document.createElement("div");
                            innerTile.classList.add("inner-tile");
                            innerTile.style.backgroundColor = "rgba(22, 20, 20, 0.7)";
                            innerTile.style.color = "white";
                            innerTile.style.padding = "10px";
                            innerTile.style.height = "85%";
                            innerTile.style.width = "90%";
                            innerTile.style.overflowY = "auto";
                            innerTile.style.maxHeight = "100%";
                            innerTile.style.borderRadius = "5px";
                            innerTile.style.display = "flex";
                            innerTile.style.flexDirection = "column";
                            innerTile.style.justifyContent = "flex-start";
                
                             // Definiera kolumnnycklar för data
                            const columnKeys = ["slag", "level", "tid", "pengar_tjanat", "exp_tjanat", "netvarde"];
                            const columnKey = columnKeys[index];
                
                            let dataToSort = [...squigglegolfData];
                
                            if (columnKey === "netvarde") {
                                 // Slå samman netvarde från ekonomi med squigglegolf-data
                                dataToSort = squigglegolfData.map(user => {
                                    const ekonomiUser = ekonomiData.find(e => e.username === user.username);
                                    return {
                                        ...user,
                                        netvarde: ekonomiUser ? ekonomiUser.networth : 0 //sätt netvärde till 0 om användaren inte finns i ekonomi-data
                                    };
                                });
                            }
                
                            if (columnKey === "level") {
                                    // Slå samman nivåer från poängsystemet med hjälp av Namn
                                dataToSort = squigglegolfData.map(user => {
                                    const poangUser = poangssystemData.find(p => p.Namn === user.username);
                                    return {
                                        ...user,
                                        level: poangUser && poangUser.Levels !== undefined ? poangUser.Levels : "N/A"
                                    };
                                });
                            }
                
                            // Justera sorteringsordning: Stigande för tile 1 (index 0) och tile 3 (index 2), fallande för de andra
                            const isAscending = index === 0 || index === 2;
                            dataToSort
                                .sort((a, b) => isAscending ? a[columnKey] - b[columnKey] : b[columnKey] - a[columnKey])
                                .forEach((row, rank) => {
                                    const div = document.createElement("div");
                                    div.style.display = "flex";
                                    div.style.justifyContent = "space-between";
                                    div.style.margin = "5px 0";
                                    div.style.padding = "10px";
                                    div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                                    div.style.borderRadius = "3px";
                
                                    const leftSpan = document.createElement("span");
                                    leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                                    leftSpan.style.flex = "1";
                                    leftSpan.style.textAlign = "left";
                
                                    const rightSpan = document.createElement("span");
                                    rightSpan.textContent = `${row[columnKey]}`;
                                    rightSpan.style.flex = "0";
                                    rightSpan.style.textAlign = "right";
                
                                    div.appendChild(leftSpan);
                                    div.appendChild(rightSpan);
                                    innerTile.appendChild(div);
                                });
                
                            container.appendChild(innerTile);
                            tile.appendChild(container);
                        });
                    })
                    .catch((error) => {
                        console.error("Error fetching Squigglegolf data:", error);
                    });
                } else if (modes[currentMode].text === "Colourvision - Topplista") {
                    const colourvisionEndpoint = "http://samet-desktop.adm.huddinge.se:3000/colourvision";
                    const ekonomiEndpoint = "http://samet-desktop.adm.huddinge.se:3000/ekonomi";
                    const poangssystemEndpoint = "http://samet-desktop.adm.huddinge.se:3000/poangssystem";
                
                    // Hämta alla datasets parallellt med Promise.all
                    Promise.all([
                        fetch(colourvisionEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Colourvision data");
                            return response.json();
                        }),
                        fetch(ekonomiEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Ekonomi data");
                            return response.json();
                        }),
                        fetch(poangssystemEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Poängssystem data");
                            return response.json();
                        })
                    ])
                    .then(([colourvisionData, ekonomiData, poangssystemData]) => {
                        tiles.forEach((tile, index) => {
                            tile.innerHTML = "";// Rensa tidigare innehåll
                
                            const container = document.createElement("div");
                            container.style.display = "flex";
                            container.style.flexDirection = "column";
                            container.style.alignItems = "center";
                            container.style.height = "100%";
                            container.style.width = "100%";
                
                            const outerText = document.createElement("div");
                            outerText.textContent = modes[currentMode].tileTexts[index];
                            outerText.style.textAlign = "center";
                            outerText.style.marginBottom = "10px";
                            outerText.style.fontWeight = "bold";
                            container.appendChild(outerText);
                
                            const innerTile = document.createElement("div");
                            innerTile.classList.add("inner-tile");
                            innerTile.style.backgroundColor = "rgba(22, 20, 20, 0.7)";
                            innerTile.style.color = "white";
                            innerTile.style.padding = "10px";
                            innerTile.style.height = "85%";
                            innerTile.style.width = "90%";
                            innerTile.style.overflowY = "auto";
                            innerTile.style.maxHeight = "100%";
                            innerTile.style.borderRadius = "5px";
                            innerTile.style.display = "flex";
                            innerTile.style.flexDirection = "column";
                            innerTile.style.justifyContent = "flex-start";
                
                             // Definiera kolumnnycklar för data
                            const columnKeys = ["nivå", "level", "tid", "pengar_tjanat", "exp_tjanat", "netvarde"];
                            const columnKey = columnKeys[index];
                
                            let dataToSort = [...colourvisionData];
                
                            if (columnKey === "netvarde") {
                               // Slå samman netvarde från ekonomi med colourvision-data
                                dataToSort = colourvisionData.map(user => {
                                    const ekonomiUser = ekonomiData.find(e => e.username === user.username);
                                    return {
                                        ...user,
                                        netvarde: ekonomiUser ? ekonomiUser.networth : 0 // Default to 0 if not found
                                    };
                                });
                            }
                
                            if (columnKey === "level") {
                                // Slå samman nivåer från poängsystemet med hjälp av Namn
                                dataToSort = colourvisionData.map(user => {
                                    const poangUser = poangssystemData.find(p => p.Namn === user.username);
                                    return {
                                        ...user,
                                        level: poangUser && poangUser.Levels !== undefined ? poangUser.Levels : "N/A"
                                    };
                                });
                            }
                
                            // Justera sorteringsordning: Stigande för tile 3 (index 2), fallande för de andra
                            const isAscending = index === 2; // Stigande för "tid" 
                            dataToSort
                                .sort((a, b) => isAscending ? a[columnKey] - b[columnKey] : b[columnKey] - a[columnKey])
                                .forEach((row, rank) => {
                                    const div = document.createElement("div");
                                    div.style.display = "flex";
                                    div.style.justifyContent = "space-between";
                                    div.style.margin = "5px 0";
                                    div.style.padding = "10px";
                                    div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                                    div.style.borderRadius = "3px";
                
                                    const leftSpan = document.createElement("span");
                                    leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                                    leftSpan.style.flex = "1";
                                    leftSpan.style.textAlign = "left";
                
                                    const rightSpan = document.createElement("span");
                                    rightSpan.textContent = `${row[columnKey]}`;
                                    rightSpan.style.flex = "0";
                                    rightSpan.style.textAlign = "right";
                
                                    div.appendChild(leftSpan);
                                    div.appendChild(rightSpan);
                                    innerTile.appendChild(div);
                                });
                
                            container.appendChild(innerTile);
                            tile.appendChild(container);
                        });
                    })
                    .catch((error) => {
                        console.error("Error fetching Colourvision data:", error);
                    });
                } else if (modes[currentMode].text === "Maze Runner - Topplista") {
                    const mazerunnerEndpoint = "http://samet-desktop.adm.huddinge.se:3000/mazerunner";
                    const ekonomiEndpoint = "http://samet-desktop.adm.huddinge.se:3000/ekonomi";
                    const poangssystemEndpoint = "http://samet-desktop.adm.huddinge.se:3000/poangssystem";
                
                   // Hämta alla datasets parallellt med Promise.all
                    Promise.all([
                        fetch(mazerunnerEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Mazerunner data");
                            return response.json();
                        }),
                        fetch(ekonomiEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Ekonomi data");
                            return response.json();
                        }),
                        fetch(poangssystemEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Poängssystem data");
                            return response.json();
                        })
                    ])
                    .then(([mazerunnerData, ekonomiData, poangssystemData]) => {
                        tiles.forEach((tile, index) => {
                            tile.innerHTML = ""; // Rensa tidigare innehåll
                
                            const container = document.createElement("div");
                            container.style.display = "flex";
                            container.style.flexDirection = "column";
                            container.style.alignItems = "center";
                            container.style.height = "100%";
                            container.style.width = "100%";
                
                            const outerText = document.createElement("div");
                            outerText.textContent = modes[currentMode].tileTexts[index];
                            outerText.style.textAlign = "center";
                            outerText.style.marginBottom = "10px";
                            outerText.style.fontWeight = "bold";
                            container.appendChild(outerText);
                
                            const innerTile = document.createElement("div");
                            innerTile.classList.add("inner-tile");
                            innerTile.style.backgroundColor = "rgba(22, 20, 20, 0.7)";
                            innerTile.style.color = "white";
                            innerTile.style.padding = "10px";
                            innerTile.style.height = "85%";
                            innerTile.style.width = "90%";
                            innerTile.style.overflowY = "auto";
                            innerTile.style.maxHeight = "100%";
                            innerTile.style.borderRadius = "5px";
                            innerTile.style.display = "flex";
                            innerTile.style.flexDirection = "column";
                            innerTile.style.justifyContent = "flex-start";
                
                           // Definiera kolumnnycklar för data
                            const columnKeys = ["nivå", "level", "tid", "pengar_tjanat", "exp_tjanat", "netvarde"];
                            const columnKey = columnKeys[index];
                
                            let dataToSort = [...mazerunnerData];
                
                            if (columnKey === "netvarde") {
                                // Slå samman netvarde från ekonomi med mazerunner-data
                                dataToSort = mazerunnerData.map(user => {
                                    const ekonomiUser = ekonomiData.find(e => e.username === user.username);
                                    return {
                                        ...user,
                                        netvarde: ekonomiUser ? ekonomiUser.networth : 0 // Sätt netvarde till 0 om användaren inte finns i ekonomi-data
                                    };
                                });
                            }
                
                            if (columnKey === "level") {
                             // Slå samman nivådata från poängsystemet med användarnamn
                                dataToSort = mazerunnerData.map(user => {
                                    const poangUser = poangssystemData.find(p => p.Namn === user.username);
                                    return {
                                        ...user,
                                        level: poangUser && poangUser.Levels !== undefined ? poangUser.Levels : "N/A"
                                    };
                                });
                            }
                
                            // Justera sorteringsordning: stigande för "tid" (index 2), fallande för de andra
                            const isAscending = index === 2; // Stigande för "tid"
                            dataToSort
                                .sort((a, b) => isAscending ? a[columnKey] - b[columnKey] : b[columnKey] - a[columnKey])
                                .forEach((row, rank) => {
                                    const div = document.createElement("div");
                                    div.style.display = "flex";
                                    div.style.justifyContent = "space-between";
                                    div.style.margin = "5px 0";
                                    div.style.padding = "10px";
                                    div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                                    div.style.borderRadius = "3px";
                
                                    const leftSpan = document.createElement("span");
                                    leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                                    leftSpan.style.flex = "1";
                                    leftSpan.style.textAlign = "left";
                
                                    const rightSpan = document.createElement("span");
                                    rightSpan.textContent = `${row[columnKey]}`;
                                    rightSpan.style.flex = "0";
                                    rightSpan.style.textAlign = "right";
                
                                    div.appendChild(leftSpan);
                                    div.appendChild(rightSpan);
                                    innerTile.appendChild(div);
                                });
                
                            container.appendChild(innerTile);
                            tile.appendChild(container);
                        });
                    })
                    .catch((error) => {
                        console.error("Error fetching Mazerunner data:", error);
                    });
                } else if (modes[currentMode].text === "Biljard - Topplista") {
                    const biljardEndpoint = "http://samet-desktop.adm.huddinge.se:3000/biljard";
                    const ekonomiEndpoint = "http://samet-desktop.adm.huddinge.se:3000/ekonomi";
                    const poangssystemEndpoint = "http://samet-desktop.adm.huddinge.se:3000/poangssystem";
                
                    // Hämta alla datasets parallellt
                    Promise.all([
                        fetch(biljardEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Biljard data");
                            return response.json();
                        }),
                        fetch(ekonomiEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Ekonomi data");
                            return response.json();
                        }),
                        fetch(poangssystemEndpoint).then(response => {
                            if (!response.ok) throw new Error("Failed to fetch Poängssystem data");
                            return response.json();
                        })
                    ])
                    .then(([biljardData, ekonomiData, poangssystemData]) => {
                        tiles.forEach((tile, index) => {
                            tile.innerHTML = ""; // Rensa tidigare innehåll
                
                            const container = document.createElement("div");
                            container.style.display = "flex";
                            container.style.flexDirection = "column";
                            container.style.alignItems = "center";
                            container.style.height = "100%";
                            container.style.width = "100%";
                
                            const outerText = document.createElement("div");
                            outerText.textContent = modes[currentMode].tileTexts[index];
                            outerText.style.textAlign = "center";
                            outerText.style.marginBottom = "10px";
                            outerText.style.fontWeight = "bold";
                            container.appendChild(outerText);
                
                            const innerTile = document.createElement("div");
                            innerTile.classList.add("inner-tile");
                            innerTile.style.backgroundColor = "rgba(22, 20, 20, 0.7)";
                            innerTile.style.color = "white";
                            innerTile.style.padding = "10px";
                            innerTile.style.height = "85%";
                            innerTile.style.width = "90%";
                            innerTile.style.overflowY = "auto";
                            innerTile.style.maxHeight = "100%";
                            innerTile.style.borderRadius = "5px";
                            innerTile.style.display = "flex";
                            innerTile.style.flexDirection = "column";
                            innerTile.style.justifyContent = "flex-start";
                
                            // Definiera kolumnnycklar
                            const columnKeys = ["slag", "level", "tid", "pengar_tjanat", "exp_tjanat", "netvarde"];
                            const columnKey = columnKeys[index];
                
                            let dataToSort = [...biljardData];
                
                            if (columnKey === "netvarde") {
                                // Slå samman netvarde från ekonomi med biljarddata
                                dataToSort = biljardData.map(user => {
                                    const ekonomiUser = ekonomiData.find(e => e.username === user.username);
                                    return {
                                        ...user,
                                        netvarde: ekonomiUser ? ekonomiUser.networth : 0 // Sätt 0 om netvarde inte finns
                                    };
                                });
                            }
                
                            if (columnKey === "level") {
                                // Slå samman nivådata från poängsystemet med användarnamn
                                dataToSort = biljardData.map(user => {
                                    const poangUser = poangssystemData.find(p => p.Namn === user.username);
                                    return {
                                        ...user,
                                        level: poangUser && poangUser.Levels !== undefined ? poangUser.Levels : "N/A"
                                    };
                                });
                            }
                
                    // Justera sorteringsordningen: Stigande för tile 1 (index 0) och tile 3 (index 2), fallande för de andra
                            const isAscending = index === 0 || index === 2;
                            dataToSort
                                .sort((a, b) => isAscending ? a[columnKey] - b[columnKey] : b[columnKey] - a[columnKey])
                                .forEach((row, rank) => {
                                    const div = document.createElement("div");
                                    div.style.display = "flex";
                                    div.style.justifyContent = "space-between";
                                    div.style.margin = "5px 0";
                                    div.style.padding = "10px";
                                    div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                                    div.style.borderRadius = "3px";
                
                                    const leftSpan = document.createElement("span");
                                    leftSpan.textContent = `${rank + 1}. ${row.username.charAt(0).toUpperCase()}${row.username.slice(1)}`;
                                    leftSpan.style.flex = "1";
                                    leftSpan.style.textAlign = "left";
                
                                    const rightSpan = document.createElement("span");
                                    rightSpan.textContent = `${row[columnKey]}`;
                                    rightSpan.style.flex = "0";
                                    rightSpan.style.textAlign = "right";
                
                                    div.appendChild(leftSpan);
                                    div.appendChild(rightSpan);
                                    innerTile.appendChild(div);
                                });
                
                            container.appendChild(innerTile);
                            tile.appendChild(container);
                        });
                    })
                    .catch((error) => {
                        console.error("Error fetching Biljard data:", error);
                    });
                } else {
                        // Skapa tomma tiles om inga specifika data finns
                    const numberOfDivs = userCounts[modes[currentMode].text.toLowerCase().split(" - ")[0]] || 0;
                    for (let i = 1; i <= numberOfDivs; i++) {
                        const div = document.createElement("div");
                        div.textContent = `Tile ${i}`;
                        div.style.textAlign = "center";
                        div.style.margin = "5px 0";
                        div.style.padding = "10px";
                        div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        div.style.borderRadius = "3px";
                        innerTile.appendChild(div);
                    }
                }
    
                container.appendChild(innerTile);
                tile.appendChild(container);
            });
    
            leftButton.disabled = currentMode === 0;
            rightButton.disabled = currentMode === modes.length - 1;
        }
    // Funktion för att hämta leaderboard-data från servern
        function fetchLeaderboardData() {
            Promise.all([
                fetch("http://samet-desktop.adm.huddinge.se:3000/user-counts").then(res => {
                    if (!res.ok) throw new Error("Failed to fetch user counts");
                    return res.json();
                }),
                fetch("http://samet-desktop.adm.huddinge.se:3000/memory/niva").then(res => {
                    if (!res.ok) throw new Error("Failed to fetch memory levels");
                    return res.json();
                }),
                fetch("http://samet-desktop.adm.huddinge.se:3000/memory/levels").then(res => {
                    if (!res.ok) throw new Error("Failed to fetch memory levels");
                    return res.json();
                }),
                fetch("http://samet-desktop.adm.huddinge.se:3000/memory/tid").then(res => {
                    if (!res.ok) throw new Error("Failed to fetch memory time");
                    return res.json();
                }),
                fetch("http://samet-desktop.adm.huddinge.se:3000/memory/pengar").then(res => {
                    if (!res.ok) throw new Error("Failed to fetch memory money data");
                    return res.json();
                }),
                fetch("http://samet-desktop.adm.huddinge.se:3000/memory/exp").then(res => {
                    if (!res.ok) throw new Error("Failed to fetch memory EXP data");
                    return res.json();
                }),
                fetch("http://samet-desktop.adm.huddinge.se:3000/get-networth").then(res => {
                    if (!res.ok) throw new Error("Failed to fetch ekonomi net worth data");
                    return res.json();
                })
            ])
            .then(([userCounts, memoryData, levelsData, tidData, pengarData, expData, ekonomiData]) => {
        // Skapa en karta från ekonomiData med användarnamn som nyckel
                let ekonomiMap = new Map(ekonomiData.map(user => [user.username, user.networth]));
        
                // Eftersom memoryUsers inte längre hämtas, använd istället memoryData
                let updatedUsers = memoryData.map(user => ({
                    ...user,
                    networth: ekonomiMap.has(user.username) ? ekonomiMap.get(user.username) : 0
                }));
        
                 // Uppdatera leaderboarden med den hämtade och uppdaterade datan
                updateMode(userCounts, memoryData, levelsData, tidData, pengarData, expData, updatedUsers);
            })
            .catch(error => {
                console.error("Error fetching leaderboard data:", error);
            });
        }
        
              
    // Lägg till eventlyssnare för vänster och högerknapp för att navigera mellan modes
        leftButton.addEventListener("click", () => {
            if (currentMode > 0) {
                currentMode--;
                fetchLeaderboardData();
            }
        });
    
        rightButton.addEventListener("click", () => {
            if (currentMode < modes.length - 1) {
                currentMode++;
                fetchLeaderboardData();
            }
        });
    // Hämta initial leaderboard data vid sidans laddning
        fetchLeaderboardData();
    
        document.getElementById("logo").addEventListener("click", function () {
            redirect("../index.php");
        });
    });

    // Lägg till en eventlyssnare för logon som omdirigerar användaren till index-sidan
    document.getElementById("logo").addEventListener("click", function() {
        redirect('../index.php');
    });
    
    // Öppnar en modal med en specifik URL beroende på spelet som klickades
    function openModal(gameId) {
        const gameUrls = {
            game1: "game_display.php?gameId=game1",
            game2: "game_display.php?gameId=game2",
            game3: "game_display.php?gameId=game3",
            game4: "game_display.php?gameId=game4",
            game5: "game_display.php?gameId=game5"
        };
    
            // Om spelet finns i URL-objektet, omdirigera till spelets sida
        if (gameUrls[gameId]) {
            window.location.href = gameUrls[gameId];
        } else {
            // Hantera fall där spelet inte finns definierat (kan lämnas tomt eller läggas till logik)
        }
    }
    
    // Stänger modalen genom att animera bort overlay och modal
    function closeModal() {
        const overlay = document.getElementById("overlay");
        const modal = document.getElementById("modal");

        // Lägg till animationer för att stänga modal och overlay
        overlay.style.animation = "fadeOut 0.5s ease-out forwards";
        modal.style.animation = "modalResizeOut 1s cubic-bezier(0.25, 0.1, 0.25, 1.5) forwards";
    
        // Efter animationen, dölja overlay
        setTimeout(() => {
            overlay.style.display = "none";
        }, 500);
    }
    
// Växlar mellan fullskärmsläge när användaren klickar på ikonen
    function toggleFullScreen(event) {
        event.stopPropagation();
        const modal = document.getElementById("modal");
        const enterIcon = document.getElementById("enter-fullscreen-icon");
        const exitIcon = document.getElementById("exit-fullscreen-icon");
        const gameIframe = document.getElementById("game-iframe");
    
            // Om användaren inte är i fullskärm, aktivera fullskärm
        if (!document.fullscreenElement) {
            modal.requestFullscreen().then(() => {
                modal.classList.add("full-screen-mode");
                enterIcon.style.display = "none";
                exitIcon.style.display = "inline";
            });
        } else {
            // Om användaren är i fullskärm, stäng av fullskärm
            document.exitFullscreen().then(() => {
                modal.classList.remove("full-screen-mode");
                enterIcon.style.display = "inline";
                exitIcon.style.display = "none";
            });
        }
    }
    // Växlar sidomenyns öppning och stängning
    function toggleSidebar() {
        var sidebar = document.getElementById("sidebar");
        var toggleButton = document.getElementById("sidebar-toggle");
    
        sidebar.classList.toggle("open");
    
    // Justera sidomenyknappens position beroende på om sidomenyn är öppen eller stängd
        if (sidebar.classList.contains("open")) {
            toggleButton.style.left = "260px"; // Sidebar width (250px) + 10px margin
        } else {
            toggleButton.style.left = "10px"; // Reset to original position
        }
    }
    
    document.addEventListener("DOMContentLoaded", function() {
    // Hämta användarnamnet från data-attributet i PHP-koden
        const username = document.getElementById("php-file-info").getAttribute("data-username");
    
    // Skriv ut användarnamnet i konsolen
        console.log("Logged in user:", username);
    
    // Om det finns ett element för att visa användarnamnet, sätt det
        const usernameElement = document.getElementById("display-username");
        if (usernameElement) {
            usernameElement.textContent = username;
        }
    
    // Om användaren är "guest", stäng av klickmöjligheten på profilbilden
        const profileCircle = document.querySelector(".profile-circle");
        if (username.toLowerCase() === "guest") {
            profileCircle.style.pointerEvents = "none";  // Disable clicks
            profileCircle.style.cursor = "default";  // Change cursor to default
        }
    });
    
    // Funktion för att visa eller dölja profilrutan när man klickar på den
    function toggleProfile() {
        const profileSquare = document.getElementById('profileSquare');
    
        if (profileSquare.classList.contains('active')) {
            closeProfile();
        } else {
            profileSquare.classList.add('active');
            profileSquare.style.display = 'block';
            profileSquare.style.opacity = '1';
            profileSquare.style.transform = 'translateY(10px)';
        }
    }
    
// Funktion för att stänga profilrutan
    function closeProfile() {
        const profileSquare = document.getElementById('profileSquare');
    
        profileSquare.style.opacity = '0';
        profileSquare.style.transform = 'translateY(0px)';
    
    // Vänta på att animationen ska slutföras innan vi döljer den helt
        setTimeout(() => {
            profileSquare.classList.remove('active');
            profileSquare.style.display = 'none';
        }, 300); // Match the CSS transition duration
    
        // Remove the event listener
        document.removeEventListener('click', handleOutsideClick);
    }
    
// Hanterar klick utanför profilrutan för att stänga den
    function handleOutsideClick(event) {
        const profileSquare = document.getElementById('profileSquare');
        const searchProfileBtn = document.getElementById('searchProfileBtn');
        
    // Om klicket inte är på profilrutan, sökknappen, resultat eller meddelandeknappen, stäng profilen
        if (
            !profileSquare.contains(event.target) &&
            event.target !== searchProfileBtn &&
            !event.target.classList.contains('result-item') &&
            !event.target.classList.contains('close-button') &&
            !event.target.classList.contains('profile-image') &&
            event.target.id !== 'sidebar-toggle' &&
            !event.target.classList.contains('messagebutton')
        ) {
            closeProfile();
        }
    }
    
// Söker efter användare baserat på input och visar resultaten
    function searchProfiles() {
        const searchInput = document.getElementById('searchInput').value.trim();
    
        // Om sökfältet är tomt, rensa sökresultaten
        if (searchInput === '') {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }
    
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'sida.php?search=' + encodeURIComponent(searchInput), true);
    
        // När svaret från servern är klart
        xhr.onload = function() {
            if (xhr.status === 200) {
                console.log(JSON.parse(xhr.responseText));
                const results = JSON.parse(xhr.responseText);
                const searchResultsContainer = document.getElementById('searchResults');
                searchResultsContainer.innerHTML = '';
        
                // Om inga användare hittades, visa meddelandet
                if (results.message) {
                    const noUserFound = document.createElement('div');
                    noUserFound.classList.add('result-item');
                    noUserFound.textContent = results.message;
                    searchResultsContainer.appendChild(noUserFound);
                } else {

                    // För varje användare, skapa ett resultat och visa info
                    results.forEach(function(user) {
                        const profileImage = user.Profil_bild || '../pfp/default.png';
                        const resultItem = document.createElement('div');
                        resultItem.classList.add('result-item');
        
                     // Lägg till data för användarens nivå, EXP och EXP-gräns
                        resultItem.dataset.profileImage = profileImage;
                        resultItem.dataset.level = user.Levels;
                        resultItem.dataset.exp = user.EXP;
                        resultItem.dataset.expThreshold = user.EXP_GRÄNS;
        
                        const img = document.createElement('img');
                        img.classList.add('profile-image');
                        img.src = '../pfp/' + profileImage;
        
                        let username = document.createElement('span');
                        username.classList.add('username');
        
                        function capitalizeFirstLetter(str) {
                            if (!str) return str; // Hantera tomma eller felaktiga strings
                            return str.charAt(0).toUpperCase() + str.slice(1);
                        }
        
                        username.textContent = capitalizeFirstLetter(user.Namn);
                        username.style.color = "black";
        
                        resultItem.appendChild(img);
                        resultItem.appendChild(username); 
                        searchResultsContainer.appendChild(resultItem);
                    });
                }
            }
        };
    
        xhr.send();
    }

    
    // Funktion för att uppdatera profilinformationen i sökresultaten
function updateProfile(profileImageSrc, userName, userLevel, userExp, expThreshold) {
    const searchResultsContainer = document.getElementById('searchResults');
    
    // Rensa tidigare resultat
    searchResultsContainer.innerHTML = '';
    
    // Skapa en ny container för den valda profilen
    const selectedProfileContainer = document.createElement('div');
    selectedProfileContainer.style.display = 'flex';
    selectedProfileContainer.style.alignItems = 'center';
    selectedProfileContainer.style.flexDirection = 'column';
    selectedProfileContainer.style.textAlign = 'center';
    
    // Lägg till profilbild och användarnamn
    const profileCircle = document.createElement('img');
    profileCircle.src = '../pfp/' + profileImageSrc;
    profileCircle.classList.add('selected-profile-circle');
    
    const username = document.createElement('span');
    username.classList.add('username2');
    username.textContent = userName;
    
    // Skapa en sektion för level och EXP med detaljer som vanlig text
    const levelSection = document.createElement('div');
    levelSection.classList.add('level-section2');
    levelSection.innerHTML = `
        <h4>Level <span>${userLevel}</span></h4>
        <div class="exp-bar2">
            <div class="exp-progress2" style="width: ${(userExp / expThreshold) * 100}%;"></div>
        </div>
        <p>${userExp} / ${expThreshold} EXP</p>
    `;
    
    // Lägg till elementen i den nya profilcontainern
    selectedProfileContainer.appendChild(profileCircle);
    selectedProfileContainer.appendChild(username);
    selectedProfileContainer.appendChild(levelSection);
    
    // Lägg till den nya containern i sökresultatscontainern
    searchResultsContainer.appendChild(selectedProfileContainer);
    
    // Lägg till en stäng-knapp
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.classList.add('close-button');
    closeButton.addEventListener('click', function() {
        // Rensa sökresultaten och visa sökrutan igen
        searchResultsContainer.innerHTML = '';
        document.getElementById('searchInput').style.display = 'block'; // Visa sökrutan igen
        searchProfiles(); // Ladda om sökresultaten
    });
    selectedProfileContainer.appendChild(closeButton);
}

// Funktion för att öppna meddelandekontainern
function openMessageContainer() {
    const searchResultsContainer = document.getElementById('searchResults');
    searchResultsContainer.innerHTML = ''; // Rensa tidigare innehåll
    
    // Skapa och konfigurera "Stäng"-knappen
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.classList.add('close-button');
    closeButton.addEventListener('click', function() {
        // Gå tillbaka till sökrutan och ladda om sökresultaten
        document.getElementById('searchInput').style.display = 'block'; // Visa sökrutan
        searchResultsContainer.innerHTML = ''; // Rensa meddelandekontainern
        searchProfiles(); // Ladda om sökresultaten
    });
    
    // Område för att visa meddelanden
    const messageDisplay = document.createElement('div');
    messageDisplay.classList.add('message-display');
    
    // Inmatningsfält för att skriva nya meddelanden
    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.classList.add('message-input');
    messageInput.placeholder = 'Skriv ett meddelande...';
    
    // "Skicka"-knapp för att skicka meddelanden
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Skicka';
    sendButton.classList.add('send-button');
    
    // Lägg till elementen i meddelande-UI:n
    searchResultsContainer.classList.add('message-container'); // Applicera stilar för meddelandekontainern
    searchResultsContainer.appendChild(closeButton);
    searchResultsContainer.appendChild(messageDisplay);
    searchResultsContainer.appendChild(messageInput);
    searchResultsContainer.appendChild(sendButton);
}

// Eventlyssnare för att hantera profil- och meddelandeinteraktioner
document.addEventListener('click', function(event) {
    const searchResultsContainer = document.getElementById('searchResults');
    const searchBox = document.getElementById('searchInput');
    
    // Kontrollera om ett profilobjekt eller profilbild har klickats
    if (event.target.classList.contains('result-item') || event.target.classList.contains('profile-image')) {
        const clickedItem = event.target.closest('.result-item');
        const profileImageSrc = clickedItem.dataset.profileImage;
        const userName = clickedItem.querySelector('.username').textContent;
        const userLevel = clickedItem.dataset.level;
        const userExp = clickedItem.dataset.exp;
        const expThreshold = clickedItem.dataset.expThreshold;
    
        // Dölja sökrutan
        searchBox.style.display = 'none';
    
        // Visa den valda profilen med dess detaljer
        updateProfile(profileImageSrc, userName, userLevel, userExp, expThreshold);
    }
    
    // Kontrollera om "Meddelande"-knappen har klickats
    if (event.target.classList.contains('messagebutton')) {
        openMessageContainer();
    }
});

// Stäng meddelanden automatiskt efter 5 sekunder
setTimeout(() => {
    document.querySelectorAll('.message').forEach(msg => {
        msg.style.display = 'none';
    });
}, 5000);
}
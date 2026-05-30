document.addEventListener('DOMContentLoaded', () => {

    // Screens
    const startScreen = document.getElementById('start-screen');
    const introScreen = document.getElementById('intro-screen');
    const chatScreen = document.getElementById('chat-screen');

    // Intro Elements
    const caseTitle = document.getElementById('case-title');
    const caseSuicide = document.getElementById('case-suicide');
    const caseMurder = document.getElementById('case-murder');

    // Chat Elements
    const chatMessages = document.getElementById('chat-messages');
    const nameForm = document.getElementById('name-form');
    const nameInput = document.getElementById('name-input');
    const passwordForm = document.getElementById('password-form');
    const passwordInput = document.getElementById('password-input');
    const loginError = document.getElementById('login-error');

    // Audio
    const rainAudio = document.getElementById('rain-audio');
    rainAudio.volume = 0.5; // faint rain

    let userName = "";

    // Utilities
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    async function hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Replace with real Discord/Make webhook URL
    const PRESENCE_WEBHOOK_URL = "https://discord.com/api/webhooks/1510341931278798929/SIjllZXPQZrltgP17EjiVtVswCE3N-x53qnipUSpSEqMmQa6mJuMoMYCZipGeil4m_y8";
    
    function sendPresence(statusMessage) {
        if(!PRESENCE_WEBHOOK_URL.startsWith("http")) return;
        fetch(PRESENCE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `[${new Date().toISOString()}] ${statusMessage}` })
        }).catch(err => console.log("Webhook error", err));
    }

    // Main Sequence
    document.getElementById('start-btn').addEventListener('click', async () => {
        // Start audio & hide start screen
        rainAudio.play().catch(e => console.log("Audio play prevented"));
        startScreen.classList.remove('active');

        // Phase 1: Cinematic Intro
        introScreen.classList.add('active');

        await delay(1000);
        caseTitle.classList.remove('hidden');

        await delay(2000);
        caseSuicide.classList.remove('hidden');

        await delay(3000);
        caseSuicide.classList.add('strikethrough');

        await delay(1000);
        caseMurder.classList.remove('hidden');

        await delay(4000);
        introScreen.classList.remove('active');

        // Phase 2: Story
        await delay(2000);
        chatScreen.classList.add('active');
        
        await delay(1000);
        document.getElementById('wrap-1').classList.add('visible');
        
        await delay(2000);
        document.getElementById('wrap-2').classList.add('visible');
        
        await delay(2000);
        document.getElementById('wrap-3').classList.add('visible');
        
        await delay(2500);
        document.getElementById('wrap-3-1').classList.add('visible');
        
        await delay(2000);
        document.getElementById('wrap-3-2').classList.add('visible');
        
        await delay(2500);
        document.getElementById('wrap-3-3').classList.add('visible');
        
        await delay(2500);

        await delay(500);
        document.getElementById('wrap-name').classList.add('visible');
        nameInput.focus();
    });

    // Handle Name Submit
    nameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rawName = nameInput.value.trim().toLowerCase();
        if (rawName === "") return;

        const hashedName = await hashString(rawName);
        
        const allowedNames = ['arya', 'anirudh', 'harsha', 'ritvik', 'atri', 'karman', 'karan', 'arshit', 'ayush', 'vikram', 'gracy', 'kumudwini', 'jasmitha', 'advait', 'dhanunjay', 'snehitha'];
        
        if (!allowedNames.includes(rawName)) {
            nameInput.classList.add('error-flash');
            setTimeout(() => nameInput.classList.remove('error-flash'), 500);
            nameInput.value = "";
            return;
        }

        userName = rawName;
        nameInput.disabled = true; // Lock input
        document.getElementById('wrap-name').classList.remove('visible'); // smoothly shrinks
        
        await delay(1500); // wait for shrink and delay
        
        document.getElementById('wrap-password').classList.add('visible');
        passwordInput.focus();
    });

    // Handle Password Submit
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const pwd = passwordInput.value;
        const hashedPwd = await hashString(pwd);
        
        // Hash for "Wh0K1Ll5DM4YA"
        if (hashedPwd !== "56d7b4b1af913a6232ddc9d4bd91937183457ab11b42d36620b51d816aa75e75") {
            loginError.innerText = "Error: Invalid Access.";
            loginError.style.color = "var(--color-blood)";
            passwordInput.value = "";
        } else {
            loginError.innerText = "";
            passwordInput.disabled = true;
            
            // Automation Tool Presence Ping
            const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);
            sessionStorage.setItem("playerName", capitalizedName);
            sendPresence(`${capitalizedName} has entered the OSIRIS System (Chapter 1).`);
            sessionStorage.setItem("presenceActive", "true");
            
            // Glitch flash
            const glitch = document.getElementById('glitch-overlay');
            glitch.classList.add('flash');
            
            setTimeout(async () => {
                glitch.classList.remove('flash');
                document.getElementById('wrap-password').classList.remove('visible');
                
                await delay(1500);
                document.getElementById('wrap-4').classList.add('visible'); // Let's begin.
                
                await delay(3500); // Let it sink in
                
                // Fade out rain audio
                const rainAudio = document.getElementById('rain-audio');
                let vol = 1;
                const fadeAudio = setInterval(() => {
                    vol -= 0.1;
                    if (vol <= 0) {
                        clearInterval(fadeAudio);
                        rainAudio.pause();
                        rainAudio.volume = 1; // Reset for future
                    } else {
                        rainAudio.volume = vol;
                    }
                }, 200);
                
                // Fade to black
                chatScreen.classList.remove('active');
                await delay(2000); // Wait for fade out
                
                // Redirect to Dashboard
                window.location.href = 'dashboard.html';
                
            }, 100);
        }
    });
});

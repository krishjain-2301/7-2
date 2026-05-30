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
        
        const allowedHashes = [
            'b02e06485c54bb8d503d44ab75693665ccfb580a0d5cbd12c488d8c4aab51f37', // arya
            '77567c4f0cd9d99cc9aa598b2bb7f7532d5da3b242d360f866985e7b3ee20511', // anirudh
            '082f51aba47229235d342eb95be14ddf7b2acb03d9d27c4c22225c2ff8fd11f4', // harsha
            'a961998faf6865df361c0802b622f76aefa9cc93b8ccbb86ace88b1676216c8e', // ritvik
            'f66112448c73c57005461a10e1f975b65a37903c31d6b68661926875863c0a13', // atri
            'c5fa7b4dcf07033c0287feafb6730f7625f420653e880327dd2447b8ba839583', // karman
            '46ed260db5a4cb33871f0b308aae3e899602cd7f20c6841677e4079d8b9e5ec3', // karan
            '9ec511ea45cb4b20c5086edb481c034fd0e2c72d9bcbb8b9c372374c180092cc', // arshit
            '3848e9eff8d31953e3762251e377bb08f78099d2f2193740cd0523738da8b1a5', // ayush
            '4b7bb8c301065be38ebed64ed1e85e4ef6f6a06210b6c29abc5919619819b7c0', // vikram
            '62aeea5d7c6251b200e685d78d69031fc39cf1061a4c8fd1c8c0746a52b09565', // gracy
            'c7b3fec43d69b5a0e648f534eff656c1fd7e507fc730af47336a0d3587cb77eb', // kumudwini
            '682aadef54148f6c969fce014cca450975b72f982bf7e1f3afff1af82cae0b13', // jasmitha
            'abdd3ff29b9324bb375bf8e195349ac779693fa03a855b2788f30754ff77dee8', // advait
            '759797a57c1a4deeeb9f688914029794c85677dd53379f2023bf74d5796c64f5', // dhanunjay
            'c6b954680120ef4bcca51c7f307576bba6d20cf4272751536405d66723df70f6', // snehitha
            'b30a0e34683cf2594ffa4b9f9b2379d314ff57d48b9673a93ea2a29361805ef0', // jatin
            '2825a3abf211b3c12c5e1e08226528e27d0f819c394e65f3106d6a017d0e89b1', // hardik
            '1795aba0bc169c6eeabf09e4a6d5bf09e91bfcbb59bc36282fe2d3ba3b45f46b', // vinayak
            '23eb127b3caf920d3dd72f834b35b73e5b8bda870b0d7147838d182b5a9dd789'  // alvin
        ];
        
        if (!allowedHashes.includes(hashedName)) {
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

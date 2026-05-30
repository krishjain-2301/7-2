document.addEventListener('DOMContentLoaded', () => {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    const clickStart = document.getElementById('click-to-start');

    const clickSound = new Audio('keyboard_click.wav');
    clickSound.volume = 0.1;

    function playTypewriterClick() {
        const soundClone = clickSound.cloneNode();
        soundClone.volume = 0.1;
        soundClone.play().catch(e => {});
    }

    let hasStarted = false;
    clickStart.addEventListener('click', async () => {
        if (hasStarted) return;
        hasStarted = true;

        // Play silently to unlock audio context in some browsers
        clickSound.volume = 0;
        clickSound.play().catch(e => {});

        const typeContainer = document.getElementById('typewriter-container');
        const accessBtn = document.getElementById('access-files-btn');
        
        typeContainer.innerHTML = '';

        clickStart.style.opacity = '0';
        setTimeout(() => clickStart.style.display = 'none', 1500);

        await delay(1500); // Initial dark pause

        const htmlText = `<span style="color: var(--color-blood);">MAYA:</span>\n\nHey.\n\nIf you're reading this...\n\nthen something went really wrong.\n\nThe police think I killed myself.\n\nYou probably don't.\n\nGood.\n\nBecause I didn't.\n\nI need you to do something for me.\n\nDon't trust anyone.\n\nNot even me.\n\nStart with Aryan.\n\nI'll explain later.`;

        let isTag = false;
        let tagBuffer = '';

        for (let i = 0; i < htmlText.length; i++) {
            const char = htmlText.charAt(i);
            if (char === '<') {
                isTag = true;
                tagBuffer += char;
            } else if (char === '>') {
                isTag = false;
                tagBuffer += char;
                typeContainer.innerHTML += tagBuffer;
                tagBuffer = '';
            } else if (isTag) {
                tagBuffer += char;
            } else {
                typeContainer.innerHTML += char;
                if (char === '\n') {
                    await delay(300);
                } else if (char === '.') {
                    await delay(400);
                } else {
                    if (char.trim() !== '') playTypewriterClick();
                    await delay(30 + Math.random() * 30);
                }
                // Auto scroll down
                const chatContainer = document.getElementById('chat-container');
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }

        await delay(1000);
        
        // Show button
        accessBtn.style.display = 'inline-block';
        setTimeout(() => {
            accessBtn.style.opacity = 1;
        }, 50);

        accessBtn.addEventListener('click', () => {
            // HARD CUT TO CASEBOARD
            window.location.href = 'caseboard.html';
        });
    });
});

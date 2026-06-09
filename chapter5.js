document.addEventListener('DOMContentLoaded', () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    function openModal(modal) { modal.classList.add('active'); }
    function closeModal(modal) { modal.classList.remove('active'); }

    function addFragment(n, word) {
        let fragments = {};
        try { fragments = JSON.parse(localStorage.getItem('osiris_fragments') || '{}'); } catch (error) { fragments = {}; }
        fragments[n] = word;
        localStorage.setItem('osiris_fragments', JSON.stringify(fragments));
        return fragments;
    }

    const modals = {
        diary8: document.getElementById('modal-diary8'),
        priya: document.getElementById('modal-priya'),
        mira: document.getElementById('modal-mira'),
        board: document.getElementById('modal-board'),
        zara: document.getElementById('modal-zara'),
        zaraDm: document.getElementById('modal-zara-dm'),
        vaultKey: document.getElementById('modal-vault-key'),
        vault: document.getElementById('modal-vault-contents'),
        note: document.getElementById('modal-note'),
        summary: document.getElementById('modal-summary'),
    };

    document.getElementById('btn-diary8').addEventListener('click', () => openModal(modals.diary8));
    document.getElementById('btn-priya').addEventListener('click', () => openModal(modals.priya));
    document.getElementById('btn-mira').addEventListener('click', () => openModal(modals.mira));
    document.getElementById('btn-board').addEventListener('click', () => openModal(modals.board));
    document.getElementById('btn-zara').addEventListener('click', () => openModal(modals.zara));

    const btnNote = document.getElementById('btn-note');
    btnNote.addEventListener('click', () => openModal(modals.note));

    document.getElementById('btn-zara-dm').addEventListener('click', () => {
        closeModal(modals.zara);
        openModal(modals.zaraDm);
    });

    document.getElementById('btn-vault').addEventListener('click', () => {
        openModal(modals.vaultKey);
    });

    document.querySelectorAll('.close-modal').forEach((btn) => {
        btn.addEventListener('click', (event) => closeModal(event.target.closest('.modal')));
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) closeModal(event.target);
    });

    document.querySelectorAll('#modal-vault-contents .fcrack-file').forEach((file) => {
        file.addEventListener('click', () => file.classList.toggle('fcrack-expanded'));
    });

    // ---- Challenge 1 is the web-CTF (ctf-server.js locally / api/vault.js on Vercel) ----
    // (robots.txt -> /vault-7a9/ -> brute-force login zara:3rdparty -> reveals DROWN)
    // The brief lives in #modal-board; the answer is entered at quiz stage 'fragment'.
    // Show the CTF target relative to wherever the game is actually served.
    const ctfLink = document.getElementById('ctf-target-link');
    if (ctfLink) {
        ctfLink.href = window.location.origin + '/';
        ctfLink.textContent = window.location.origin + '/';
    }

    // ---- Vault key = what she used people for ----
    const vaultInput = document.getElementById('vault-input');
    const vaultSubmitBtn = document.getElementById('vault-submit-btn');
    const vaultError = document.getElementById('vault-error');
    const VAULT_HASHES = [
        '98c41dcd20b86b86830ec0794559835614458ceaae0f0ec77a3ed1cd3a1f7d55', // validation
        'e0787d272a439bb74b762d96f1cef3d04a18328a8d900f5c13a6e925d9da681c', // attention
    ];

    vaultSubmitBtn.addEventListener('click', async () => {
        const typed = vaultInput.value.trim().toLowerCase();
        const hashed = await hashString(typed);
        if (VAULT_HASHES.includes(hashed)) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch5 - vault key', typed, true);
            closeModal(modals.vaultKey);
            closeModal(modals.zara);
            openModal(modals.vault);
            vaultError.innerText = '';
        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch5 - vault key', typed, false);
            vaultError.innerText = 'ACCESS DENIED. INVALID KEY.';
            vaultInput.value = '';
        }
    });
    vaultInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') vaultSubmitBtn.click(); });

    // ---- Investigation quiz: who -> sin -> fragment ----
    const submitBtn = document.getElementById('submit-investigation');
    const inputField = document.getElementById('investigation-input');
    const feedbackText = document.getElementById('quiz-feedback');
    const overlay = document.getElementById('end-chapter-overlay');
    const sequenceText = document.getElementById('sequence-text');

    inputField.addEventListener('keypress', (event) => { if (event.key === 'Enter') submitBtn.click(); });

    const WHO_HASHES = [
        '1a637788c9e469bd4e4ef4bf05507d20d3fa2c37e046f21a43ca06ed650b36a4', // zara
        '9854803eccc87f8145d5c53b54662c5ce34723b54bc33de3992b0d0e07478459', // zara khan
    ];
    const SIN_HASH = '938b345cbdb06fd5ff6c3c2817c12f7b6ecba579640cdde2c37078dcaa543487'; // lust
    const FRAGMENT_HASH = '476342b3553fe919674e4d291c6a8848a147e0bbe1c948c9d4b0fc409458d9da'; // drown

    let quizState = 'who';

    submitBtn.addEventListener('click', async () => {
        const val = inputField.value.trim().toLowerCase();
        const hashed = await hashString(val);

        if (quizState === 'who' && WHO_HASHES.includes(hashed)) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch5 - who', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled = true;

            overlay.style.display = 'flex';
            overlay.classList.add('active');
            sequenceText.innerHTML = '<span class="highlight-green">SOURCE CONFIRMED</span>';
            await delay(1500);
            sequenceText.innerHTML = '<span class="highlight-green">MAYA_NOTE.TXT RECOVERED</span>';
            btnNote.style.display = 'flex';
            await delay(1500);

            overlay.classList.remove('active');
            overlay.style.display = 'none';
            sequenceText.innerHTML = '';

            openModal(modals.note);

            const noteCloseBtn = document.getElementById('note-close-btn');
            function triggerQ2(event) {
                if (event.currentTarget === noteCloseBtn || event.target === modals.note) {
                    noteCloseBtn.removeEventListener('click', triggerQ2);
                    modals.note.removeEventListener('click', triggerQ2);
                    quizState = 'sin';
                    document.querySelector('.quiz-label').innerHTML =
                        '<span class="highlight-red">SUBJECT CLASSIFICATION REQUIRED.</span><br><br>What was Zara\'s sin?';
                    inputField.value = '';
                    inputField.disabled = false;
                    submitBtn.disabled = false;
                    inputField.focus();
                }
            }
            noteCloseBtn.addEventListener('click', triggerQ2);
            modals.note.addEventListener('click', triggerQ2);
        } else if (quizState === 'sin' && hashed === SIN_HASH) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch5 - sin', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled = true;

            openModal(modals.summary);

            const sumCloseBtn = document.getElementById('summary-close-btn');
            const caseConfirmBtn = document.getElementById('case-confirm-btn');

            function advanceToFragment(event) {
                if (event.currentTarget === sumCloseBtn || event.currentTarget === caseConfirmBtn || event.target === modals.summary) {
                    sumCloseBtn.removeEventListener('click', advanceToFragment);
                    caseConfirmBtn.removeEventListener('click', advanceToFragment);
                    modals.summary.removeEventListener('click', advanceToFragment);
                    closeModal(modals.summary);

                    quizState = 'fragment';
                    document.querySelector('.quiz-label').innerHTML =
                        '<span class="highlight-terminal">CLASSIFICATION LOGGED.</span><br><br>' +
                        'Maya locked one word behind a login on the archive node.<br>' +
                        '<span style="color:#888; font-size:0.9rem;">Open archive_node.url: read /robots.txt, follow the hidden path, brute-force the login (user zara), and recover the word.</span>';
                    inputField.value = '';
                    inputField.disabled = false;
                    submitBtn.disabled = false;
                    inputField.focus();
                    document.getElementById('investigation-quiz').scrollIntoView({ behavior: 'smooth' });
                }
            }

            sumCloseBtn.addEventListener('click', advanceToFragment);
            caseConfirmBtn.addEventListener('click', advanceToFragment);
            modals.summary.addEventListener('click', advanceToFragment);
        } else if (quizState === 'fragment' && hashed === FRAGMENT_HASH) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch5 - hidden word', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled = true;

            addFragment(5, 'DROWN');

            overlay.style.display = 'flex';
            overlay.classList.add('active');

            sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-green">CASE #008 // CH.05 - FILE RECOVERY COMPLETE</h2></div>';
            await delay(2500);

            sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-red" style="letter-spacing:2px;">LUST IDENTIFIED.</h2><br><h2 style="color:#aaa; font-size:1.5rem;">SUBJECT:<br>ZARA KHAN</h2></div>';
            await delay(2500);

            sequenceText.innerHTML = '<div class="locked-state" style="line-height:2;"><p style="color:#333;">----------------------------</p><h2 style="color:#888;">Maya left 7 names.</h2><h2 class="highlight-green">You recovered 5.</h2><h2 class="highlight-red">2 remain.</h2><p style="color:#333;">----------------------------</p></div>';
            await delay(3000);

            let fragments = {};
            try { fragments = JSON.parse(localStorage.getItem('osiris_fragments') || '{}'); } catch (error) { fragments = {}; }
            const fragCount = Object.keys(fragments).length;
            sequenceText.innerHTML = `
                <div class="locked-state">
                    <p style="color:#888; text-transform:uppercase; letter-spacing:2px;">Hidden fragment recovered</p>
                    <h1 class="highlight-terminal" style="font-size:3rem; letter-spacing:6px; text-shadow:0 0 20px rgba(74,246,38,0.4);">DROWN</h1>
                    <p style="color:#666; font-family:monospace;">FRAGMENT 05 / 07</p>
                    <p style="color:#888; font-family:monospace; margin-top:10px;">MESSAGE FRAGMENTS COLLECTED: ${fragCount} / 7</p>
                    <p style="color:#555; max-width:460px; margin-top:18px; line-height:1.6;">WE &middot; ALL &middot; WATCHED &middot; HER &middot; DROWN &middot; ______ &middot; ______<br>Five words in. The sentence is almost a confession now.</p>
                </div>`;
            await delay(4500);

            document.body.classList.add('glitch-active');
            sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-terminal">RECOVERING NEXT SUBJECT...</h2><br><p style="font-family:monospace; color:#555; font-size:1.2rem; margin:20px 0;">[#############...] 84%</p><div style="color:#888; text-align:left; display:inline-block; line-height:1.6; font-size:1.1rem;">Name Found:<br><span class="highlight-red" style="font-size:1.3rem; font-weight:bold;">RHEA</span><br><br>Memory Integrity:<br><span style="color:#ff4444">03%</span><br><br>Status:<br><span class="highlight-red" style="font-weight:bold; letter-spacing:2px;">UNSTABLE</span></div></div>';
            await delay(1200);
            document.body.classList.remove('glitch-active');
            await delay(2800);

            sequenceText.innerHTML = '<div class="locked-state"><p style="color:#333;">----------------------------</p><br><p style="color:#888; text-transform:uppercase; letter-spacing:1px;">Final recovered fragment:</p><br><h2 style="font-style:italic; letter-spacing:1px; color:#fff; margin:20px 0;">"She read the message. She put the phone down. That was the whole crime."</h2><br><p style="color:#333;">----------------------------</p></div>';
            await delay(4000);

            sequenceText.innerHTML = `
                <div class="locked-state">
                    <h2 class="highlight-red" style="font-size:2.2rem; letter-spacing:4px;">NEXT RECOVERY:<br>RHEA</h2>
                    <a href="chapter6.html" class="terminal-btn" style="margin-top: 30px; text-decoration: none; display: inline-block;">[ DECRYPT RHEA ]</a>
                </div>`;

            const footerRec = document.getElementById('count-recovered');
            const footerLock = document.getElementById('count-locked');
            footerRec.innerText = '6';
            footerLock.innerText = '4';
            footerRec.style.color = '#0f0';
            setTimeout(() => { footerRec.style.color = ''; }, 500);

            setTimeout(() => {
                document.getElementById('case-footer').innerHTML = `
                    <div style="display:flex; gap:40px; align-items:center; justify-content:center; width:100%;">
                        <div class="status-box error"><span style="color:red">CONNECTION LOST.</span></div>
                    </div>`;
            }, 4000);
        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch5 - ' + quizState, val, false);
            feedbackText.innerText = 'No match found.';
            feedbackText.style.color = 'var(--color-blood)';
            inputField.value = '';
            inputField.classList.add('error-flash');
            setTimeout(() => inputField.classList.remove('error-flash'), 500);
        }
    });
});

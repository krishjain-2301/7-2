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
        try { fragments = JSON.parse(localStorage.getItem('osiris_fragments') || '{}'); } catch (e) { fragments = {}; }
        fragments[n] = word;
        localStorage.setItem('osiris_fragments', JSON.stringify(fragments));
        return fragments;
    }

    const modals = {
        diary9:   document.getElementById('modal-diary9'),
        phone:    document.getElementById('modal-phone'),
        thread:   document.getElementById('modal-thread'),
        script:   document.getElementById('modal-script'),
        rhea:     document.getElementById('modal-rhea'),
        rheaDm:   document.getElementById('modal-rhea-dm'),   // alias → thread
        vaultKey: document.getElementById('modal-vault-key'),
        vault:    document.getElementById('modal-vault-contents'),
        note:     document.getElementById('modal-note'),
        summary:  document.getElementById('modal-summary'),
    };

    document.getElementById('btn-diary9').addEventListener('click', () => openModal(modals.diary9));
    document.getElementById('btn-phone').addEventListener('click',  () => openModal(modals.phone));
    document.getElementById('btn-thread').addEventListener('click', () => openModal(modals.thread));
    document.getElementById('btn-script').addEventListener('click', () => openModal(modals.script));
    document.getElementById('btn-rhea').addEventListener('click',   () => openModal(modals.rhea));

    const btnNote = document.getElementById('btn-note');
    btnNote.addEventListener('click', () => openModal(modals.note));

    // Rhea folder inner buttons
    document.getElementById('btn-rhea-dm').addEventListener('click', () => {
        closeModal(modals.rhea);
        openModal(modals.thread);
    });
    document.getElementById('btn-vault').addEventListener('click', () => {
        openModal(modals.vaultKey);
    });

    document.querySelectorAll('.close-modal').forEach((btn) => {
        btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal')));
    });
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal(e.target);
    });
    document.querySelectorAll('#modal-vault-contents .fcrack-file').forEach((f) => {
        f.addEventListener('click', () => f.classList.toggle('fcrack-expanded'));
    });

    // ── RE CHALLENGE: XOR decode of grief_protocol.js ─────────────────────────
    // _mask = [0x36, 0x3c, 0x27, 0x37]
    // _data = [0x62, 0x74, 0x66, 0x63]
    // XOR each pair → [0x54, 0x48, 0x41, 0x54] → 'T','H','A','T' → "that"
    const reInput  = document.getElementById('re-answer-input');
    const reBtn    = document.getElementById('re-submit-btn');
    const reError  = document.getElementById('re-error');
    const reSuccess = document.getElementById('re-success');
    const RE_HASH  = '8e7fc0236af43df9340685fc16f1efe36543cc1707051220a103ad99cf69a2df'; // "that"

    async function tryRE() {
        const val    = reInput.value.trim().toLowerCase();
        const hashed = await hashString(val);
        if (hashed === RE_HASH) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch6 - RE grief_protocol', val, true);
            reError.innerText = '';
            reSuccess.style.display = 'block';
            reInput.disabled = true;
            reBtn.disabled = true;
        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch6 - RE grief_protocol', val, false);
            reError.innerText = 'OUTPUT MISMATCH. Re-check your XOR computation.';
            reInput.value = '';
        }
    }
    reBtn.addEventListener('click', tryRE);
    reInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') tryRE(); });

    // ── VAULT KEY: "invisible" (what Cass said Rhea made her feel) ────────────
    const vaultInput    = document.getElementById('vault-input');
    const vaultBtn      = document.getElementById('vault-submit-btn');
    const vaultError    = document.getElementById('vault-error');
    const VAULT_HASHES  = [
        'b75af7ef6c4de2b99053f7f6c005d549e95be118be0eb500f1cf86f36ec8f324', // invisible
        'e6c18fdbe59783dfefef3595cd288bcb7ce912d36854b5e8faaef31235d9031b', // silence
    ];

    vaultBtn.addEventListener('click', async () => {
        const val    = vaultInput.value.trim().toLowerCase();
        const hashed = await hashString(val);
        if (VAULT_HASHES.includes(hashed)) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch6 - vault key', val, true);
            closeModal(modals.vaultKey);
            closeModal(modals.rhea);
            openModal(modals.vault);
            vaultError.innerText = '';
        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch6 - vault key', val, false);
            vaultError.innerText = 'ACCESS DENIED. INVALID KEY.';
            vaultInput.value = '';
        }
    });
    vaultInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') vaultBtn.click(); });

    // ── INVESTIGATION QUIZ: who → sin → fragment ──────────────────────────────
    const submitBtn   = document.getElementById('submit-investigation');
    const inputField  = document.getElementById('investigation-input');
    const feedbackText = document.getElementById('quiz-feedback');
    const overlay     = document.getElementById('end-chapter-overlay');
    const seqText     = document.getElementById('sequence-text');

    inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitBtn.click(); });

    // Q1 — who sent the message
    const WHO_HASHES = [
        '27d9812ed83c1d618bf297e8a45a85d361bf9969eb9c75cf3ac9d6fb16e43338', // cassidy
        '6a812c6ed6dd0bff47c99428b04f6b2f8ad7dd437948e8a7d1858a69df1285a0', // cassidy park
        'cb6af909d62da685d06f86f9943884743430e2d9a1db4e7a1c76aa1d5da49635', // cass
    ];
    // Q2 — sin
    const SIN_HASHES = [
        'e7684586cdf72449493234ec76303972e86fe3d7ad824c8bfa520b45135ef559', // despair
        'f87fc5cd9bc5cd06f9be55fffd14bbec821bf7c24f52386652c75c2445ab8321', // apathy
    ];
    // Q3 — fragment = output of grief_protocol.js = "that"
    const FRAGMENT_HASH = '8e7fc0236af43df9340685fc16f1efe36543cc1707051220a103ad99cf69a2df'; // that

    let quizState = 'who';

    submitBtn.addEventListener('click', async () => {
        const val    = inputField.value.trim().toLowerCase();
        const hashed = await hashString(val);

        if (quizState === 'who' && WHO_HASHES.includes(hashed)) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch6 - who', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled   = true;

            overlay.style.display = 'flex';
            overlay.classList.add('active');
            seqText.innerHTML = '<span class="highlight-green">SENDER CONFIRMED</span>';
            await delay(1500);
            seqText.innerHTML = '<span class="highlight-green">MAYA_NOTE.TXT RECOVERED</span>';
            btnNote.style.display = 'flex';
            await delay(1500);

            overlay.classList.remove('active');
            overlay.style.display = 'none';
            seqText.innerHTML = '';

            openModal(modals.note);

            const noteCloseBtn = document.getElementById('note-close-btn');
            function triggerQ2(e) {
                if (e.currentTarget === noteCloseBtn || e.target === modals.note) {
                    noteCloseBtn.removeEventListener('click', triggerQ2);
                    modals.note.removeEventListener('click', triggerQ2);
                    quizState = 'sin';
                    document.querySelector('.quiz-label').innerHTML =
                        '<span class="highlight-red">SUBJECT CLASSIFICATION REQUIRED.</span><br><br>What was Rhea\'s sin?';
                    inputField.value   = '';
                    inputField.disabled = false;
                    submitBtn.disabled  = false;
                    inputField.focus();
                }
            }
            noteCloseBtn.addEventListener('click', triggerQ2);
            modals.note.addEventListener('click', triggerQ2);

        } else if (quizState === 'sin' && SIN_HASHES.includes(hashed)) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch6 - sin', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled   = true;

            openModal(modals.summary);

            const sumClose   = document.getElementById('summary-close-btn');
            const caseConfirm = document.getElementById('case-confirm-btn');

            function advanceToFragment(e) {
                if (e.currentTarget === sumClose || e.currentTarget === caseConfirm || e.target === modals.summary) {
                    sumClose.removeEventListener('click', advanceToFragment);
                    caseConfirm.removeEventListener('click', advanceToFragment);
                    modals.summary.removeEventListener('click', advanceToFragment);
                    closeModal(modals.summary);

                    quizState = 'fragment';
                    document.querySelector('.quiz-label').innerHTML =
                        '<span class="highlight-terminal">CLASSIFICATION LOGGED.</span><br><br>' +
                        'Cassidy encoded her last message with <em>grief_protocol.js</em>.<br>' +
                        '<span style="color:#888; font-size:0.9rem;">Reverse-engineer the XOR function. Run it in DevTools or trace manually. Enter what <code style="color:#4af626">_out</code> evaluates to.</span>';
                    inputField.value    = '';
                    inputField.disabled  = false;
                    submitBtn.disabled   = false;
                    inputField.focus();
                    document.getElementById('investigation-quiz').scrollIntoView({ behavior: 'smooth' });
                }
            }
            sumClose.addEventListener('click', advanceToFragment);
            caseConfirm.addEventListener('click', advanceToFragment);
            modals.summary.addEventListener('click', advanceToFragment);

        } else if (quizState === 'fragment' && hashed === FRAGMENT_HASH) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch6 - hidden word', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled   = true;

            addFragment(6, 'THAT');

            overlay.style.display = 'flex';
            overlay.classList.add('active');

            seqText.innerHTML = '<div class="locked-state"><h2 class="highlight-green">CASE #008 // CH.06 - FILE RECOVERY COMPLETE</h2></div>';
            await delay(2500);

            seqText.innerHTML = '<div class="locked-state"><h2 class="highlight-red" style="letter-spacing:2px;">DESPAIR IDENTIFIED.</h2><br><h2 style="color:#aaa; font-size:1.5rem;">SUBJECT:<br>RHEA SHARMA</h2></div>';
            await delay(2500);

            seqText.innerHTML = '<div class="locked-state" style="line-height:2;"><p style="color:#333;">----------------------------</p><h2 style="color:#888;">Maya left 7 names.</h2><h2 class="highlight-green">You recovered 6.</h2><h2 class="highlight-red">1 remains.</h2><p style="color:#333;">----------------------------</p></div>';
            await delay(3000);

            let frags = {};
            try { frags = JSON.parse(localStorage.getItem('osiris_fragments') || '{}'); } catch (e) { frags = {}; }
            const fragCount = Object.keys(frags).length;
            seqText.innerHTML = `
                <div class="locked-state">
                    <p style="color:#888; text-transform:uppercase; letter-spacing:2px;">Hidden fragment recovered</p>
                    <h1 class="highlight-terminal" style="font-size:3rem; letter-spacing:6px; text-shadow:0 0 20px rgba(74,246,38,0.4);">THAT</h1>
                    <p style="color:#666; font-family:monospace;">FRAGMENT 06 / 07</p>
                    <p style="color:#888; font-family:monospace; margin-top:10px;">MESSAGE FRAGMENTS COLLECTED: ${fragCount} / 7</p>
                    <p style="color:#555; max-width:460px; margin-top:18px; line-height:1.6;">WE &middot; ALL &middot; WATCHED &middot; HER &middot; DROWN &middot; THAT &middot; ______<br>Six words. The last one is still buried. Find Marcus.</p>
                </div>`;
            await delay(4500);

            document.body.classList.add('glitch-active');
            seqText.innerHTML = '<div class="locked-state"><h2 class="highlight-terminal">RECOVERING FINAL SUBJECT...</h2><br><p style="font-family:monospace; color:#555; font-size:1.2rem; margin:20px 0;">[###############.] 97%</p><div style="color:#888; text-align:left; display:inline-block; line-height:1.6; font-size:1.1rem;">Name Found:<br><span class="highlight-red" style="font-size:1.3rem; font-weight:bold;">MARCUS CHEN</span><br><br>Memory Integrity:<br><span style="color:#ff4444">01%</span><br><br>Status:<br><span class="highlight-red" style="font-weight:bold; letter-spacing:2px;">CRITICAL</span></div></div>';
            await delay(1200);
            document.body.classList.remove('glitch-active');
            await delay(2800);

            seqText.innerHTML = '<div class="locked-state"><p style="color:#333;">----------------------------</p><br><p style="color:#888; text-transform:uppercase; letter-spacing:1px;">Final recovered fragment:</p><br><h2 style="font-style:italic; letter-spacing:1px; color:#fff; margin:20px 0;">"She read the message. She put the phone down. That was the whole crime."</h2><br><p style="color:#333;">----------------------------</p></div>';
            await delay(4000);

            seqText.innerHTML = `
                <div class="locked-state">
                    <h2 class="highlight-red" style="font-size:2.2rem; letter-spacing:4px;">FINAL RECOVERY:<br>MARCUS CHEN</h2>
                    <a href="chapter7.html" class="terminal-btn" style="margin-top: 30px; text-decoration: none; display: inline-block;">[ DECRYPT MARCUS ]</a>
                </div>`;

            const footerRec  = document.getElementById('count-recovered');
            const footerLock = document.getElementById('count-locked');
            footerRec.innerText  = '7';
            footerLock.innerText = '3';
            footerRec.style.color = '#0f0';
            setTimeout(() => { footerRec.style.color = ''; }, 500);

            setTimeout(() => {
                document.getElementById('case-footer').innerHTML = `
                    <div style="display:flex; gap:40px; align-items:center; justify-content:center; width:100%;">
                        <div class="status-box error"><span style="color:red">CONNECTION LOST.</span></div>
                    </div>`;
            }, 4000);

        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch6 - ' + quizState, val, false);
            feedbackText.innerText = 'No match found.';
            feedbackText.style.color = 'var(--color-blood)';
            inputField.value = '';
            inputField.classList.add('error-flash');
            setTimeout(() => inputField.classList.remove('error-flash'), 500);
        }
    });
});

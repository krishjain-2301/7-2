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
        diary10:    document.getElementById('modal-diary10'),
        transcript: document.getElementById('modal-transcript'),
        dump:       document.getElementById('modal-dump'),
        obituary:   document.getElementById('modal-obituary'),
        marcus:     document.getElementById('modal-marcus'),
        marcusDm:   document.getElementById('modal-marcus-dm'),
        vaultKey:   document.getElementById('modal-vault-key'),
        vault:      document.getElementById('modal-vault-contents'),
        note:       document.getElementById('modal-note'),
        summary:    document.getElementById('modal-summary'),
    };

    document.getElementById('btn-diary10').addEventListener('click',    () => openModal(modals.diary10));
    document.getElementById('btn-transcript').addEventListener('click', () => openModal(modals.transcript));
    document.getElementById('btn-dump').addEventListener('click',       () => openModal(modals.dump));
    document.getElementById('btn-obituary').addEventListener('click',   () => openModal(modals.obituary));
    document.getElementById('btn-marcus').addEventListener('click',     () => openModal(modals.marcus));

    const btnNote = document.getElementById('btn-note');
    btnNote.addEventListener('click', () => openModal(modals.note));

    document.getElementById('btn-marcus-dm').addEventListener('click', () => {
        closeModal(modals.marcus);
        openModal(modals.marcusDm);
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

    // ── BINARY EXPLOITATION CHALLENGE ────────────────────────────────────────
    // Memory dump bytes at 0x0050–0x0054: 4e 49 47 48 54
    // 0x4e=78='N', 0x49=73='I', 0x47=71='G', 0x48=72='H', 0x54=84='T'
    // Answer: "night"
    const exploitInput = document.getElementById('exploit-input');
    const exploitBtn   = document.getElementById('exploit-btn');
    const exploitError = document.getElementById('exploit-error');
    const EXPLOIT_HASH = '176473d7313395b6e209bc6b1d57aa160b628706860aa0554d7af60a1d40ab87'; // "night"

    async function tryExploit() {
        const val    = exploitInput.value.trim().toLowerCase();
        const hashed = await hashString(val);
        if (hashed === EXPLOIT_HASH) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch7 - overflow bytes', val, true);
            exploitError.innerText = '';
            exploitError.style.color = 'var(--color-terminal)';
            exploitError.innerText = '✓ DECRYPTION SUCCESSFUL. Fragment confirmed in corrupted notes field.';
            exploitInput.disabled = true;
            exploitBtn.disabled   = true;
        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch7 - overflow bytes', val, false);
            exploitError.innerText = 'DECRYPTION FAILED. Did you XOR the encrypted bytes with the MAGIC key?';
            exploitError.style.color = 'var(--color-blood)';
            exploitInput.value = '';
        }
    }
    exploitBtn.addEventListener('click', tryExploit);
    exploitInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') tryExploit(); });

    // ── VAULT KEY: "leak" or "exposure" ──────────────────────────────────────
    const vaultInput   = document.getElementById('vault-input');
    const vaultBtn     = document.getElementById('vault-submit-btn');
    const vaultError   = document.getElementById('vault-error');
    const VAULT_HASHES = [
        '5f537b80f1f2b7d1cc179dba8d36aa88463eda6ac11cb8e60a4583e1bd16aa3c', // leak
        'b40356e6d1c6948bcb05c662bf5aa970a270424c9af61c9fc0c861f2e2269629', // exposure
        'd7ae9de750a5640adf6e724d72643767faa73bca2941781dae9d276ff2d4b4ca', // marcus (fallback)
    ];

    vaultBtn.addEventListener('click', async () => {
        const val    = vaultInput.value.trim().toLowerCase();
        const hashed = await hashString(val);
        if (VAULT_HASHES.includes(hashed)) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch7 - vault key', val, true);
            closeModal(modals.vaultKey);
            closeModal(modals.marcus);
            openModal(modals.vault);
            vaultError.innerText = '';
        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch7 - vault key', val, false);
            vaultError.innerText = 'ACCESS DENIED. INVALID KEY.';
            vaultInput.value = '';
        }
    });
    vaultInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') vaultBtn.click(); });

    // ── INVESTIGATION QUIZ: who → sin → fragment ──────────────────────────────
    const submitBtn    = document.getElementById('submit-investigation');
    const inputField   = document.getElementById('investigation-input');
    const feedbackText = document.getElementById('quiz-feedback');
    const overlay      = document.getElementById('end-chapter-overlay');
    const seqText      = document.getElementById('sequence-text');

    inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitBtn.click(); });

    // Q1 — whose career was destroyed
    const WHO_HASHES = [
        '17c1532ca6cff8f6a3a8200028af6c2580bf37f39e10cb0966e8a573e3b24a1f', // professor
        '0edea6ef6cb8abfb2c9972408ba0a9401f8c1bc61ed4e0c13f804503a7c6a214', // arjun mehta
        'ff06be44c7e8efa6589dc64541aa526f2db273ba4990375b8cdf360ddd421d32', // mehta
        '5179b709360c0a5e5fb46898495c2c589690c0cb566bd8817200d63cd3fd59bc', // prof mehta
        '90c112fc44d0d934a1cb504b1f725ce34210bd3a78bebc91e7f4f4dc83b8eeed', // professor mehta
        '4c98e762a4303176147119f04f212e22553cce228621fd36a34d39593febd119', // dr mehta
        '5236c06e4b5c0c4009891102946018339d17e25542c877329f6d94701040b9e8', // dr. mehta
        'fa4f7155e110eac164bda0f36b5d43f01d5d43d6afa190a317c5bec463f85764', // arjun
    ];
    // Q2 — sin
    const SIN_HASH = 'd3b57762d492f7cb36f5ec7ac8f0e18f9c574a0e14baca5695ac10d77ae86390'; // obsession
    // Q3 — fragment = overflow bytes = "night"
    const FRAGMENT_HASH = '176473d7313395b6e209bc6b1d57aa160b628706860aa0554d7af60a1d40ab87'; // night

    let quizState = 'who';

    submitBtn.addEventListener('click', async () => {
        const val    = inputField.value.trim().toLowerCase();
        const hashed = await hashString(val);

        if (quizState === 'who' && WHO_HASHES.includes(hashed)) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch7 - who', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled   = true;

            overlay.style.display = 'flex';
            overlay.classList.add('active');
            seqText.innerHTML = '<span class="highlight-green">SUBJECT CONFIRMED</span>';
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
                        '<span class="highlight-red">SUBJECT CLASSIFICATION REQUIRED.</span><br><br>What was Marcus\'s sin?';
                    inputField.value    = '';
                    inputField.disabled  = false;
                    submitBtn.disabled   = false;
                    inputField.focus();
                }
            }
            noteCloseBtn.addEventListener('click', triggerQ2);
            modals.note.addEventListener('click', triggerQ2);

        } else if (quizState === 'sin' && hashed === SIN_HASH) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch7 - sin', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled   = true;

            openModal(modals.summary);

            const sumClose    = document.getElementById('summary-close-btn');
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
                        'The crash dump holds the final fragment.<br>' +
                        '<span style="color:#888; font-size:0.9rem;">Open <strong>recording_system.core</strong>. Find the encrypted overflow bytes at 0x0058. Decrypt them using the MAGIC key.</span>';
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
            if (window.OSIRIS_notify) OSIRIS_notify('Ch7 - hidden word', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled   = true;

            addFragment(7, 'NIGHT');

            overlay.style.display = 'flex';
            overlay.classList.add('active');

            seqText.innerHTML = '<div class="locked-state"><h2 class="highlight-green">CASE #008 // CH.07 - FILE RECOVERY COMPLETE</h2></div>';
            await delay(2500);

            seqText.innerHTML = '<div class="locked-state"><h2 class="highlight-red" style="letter-spacing:2px;">OBSESSION IDENTIFIED.</h2><br><h2 style="color:#aaa; font-size:1.5rem;">SUBJECT:<br>MARCUS CHEN</h2></div>';
            await delay(2500);

            seqText.innerHTML = '<div class="locked-state" style="line-height:2;"><p style="color:#333;">----------------------------</p><h2 style="color:#888;">Maya left 7 names.</h2><h2 class="highlight-green">You recovered all 7.</h2><p style="color:#333;">----------------------------</p></div>';
            await delay(3000);

            let frags = {};
            try { frags = JSON.parse(localStorage.getItem('osiris_fragments') || '{}'); } catch (e) { frags = {}; }
            const fragCount = Object.keys(frags).length;
            const fragList  = Object.values(frags).join(' · ');
            seqText.innerHTML = `
                <div class="locked-state">
                    <p style="color:#888; text-transform:uppercase; letter-spacing:2px;">Final fragment recovered</p>
                    <h1 class="highlight-terminal" style="font-size:3rem; letter-spacing:6px; text-shadow:0 0 20px rgba(74,246,38,0.4);">NIGHT</h1>
                    <p style="color:#666; font-family:monospace;">FRAGMENT 07 / 07</p>
                    <p style="color:#888; font-family:monospace; margin-top:10px;">MESSAGE FRAGMENTS COLLECTED: ${fragCount} / 7</p>
                    <p style="color:#555; max-width:480px; margin-top:18px; line-height:1.7;">WE · ALL · WATCHED · HER · DROWN · THAT · NIGHT<br><span style="color:#888; font-style:italic;">Maya's message. Complete.</span></p>
                </div>`;
            await delay(5000);

            document.body.classList.add('glitch-active');
            await delay(800);
            document.body.classList.remove('glitch-active');
            await delay(1200);

            seqText.innerHTML = `
                <div class="locked-state" style="text-align:center; max-width:680px;">
                    <p style="color:#333; letter-spacing:2px;">────────────────────────────</p>
                    <br>
                    <h2 style="color:#888; text-transform:uppercase; letter-spacing:2px; font-size:1rem;">Seven cases. Seven names. One sentence.</h2>
                    <br>
                    <h1 style="color:#fff; font-size:2.4rem; letter-spacing:4px; line-height:1.4; font-style:italic;">"WE ALL WATCHED HER DROWN THAT NIGHT."</h1>
                    <br>
                    <p style="color:#555; font-family:monospace; font-size:0.88rem; line-height:1.7;">
                        PRIDE &middot; ENVY &middot; WRATH &middot; GREED &middot; LUST &middot; DESPAIR &middot; OBSESSION<br>
                        Seven people. Seven choices. One outcome.
                    </p>
                    <br>
                    <p style="color:#333;">────────────────────────────</p>
                    <br>
                    <p style="color:#8a0303; font-family:var(--font-typewriter); font-size:1rem; letter-spacing:1px;">
                        Maya Verma's case files: complete.
                    </p>
                    <br>
                    <a href="caseboard.html" class="terminal-btn" style="margin-top: 20px; text-decoration: none; display: inline-block;">[ RETURN TO CASE BOARD ]</a>
                </div>`;

            // Final footer
            const footerRec  = document.getElementById('count-recovered');
            const footerLock = document.getElementById('count-locked');
            if (footerRec)  { footerRec.innerText  = '7'; footerRec.style.color = '#0f0'; setTimeout(() => { footerRec.style.color = ''; }, 500); }
            if (footerLock) { footerLock.innerText  = '0'; }

        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch7 - ' + quizState, val, false);
            feedbackText.innerText = 'No match found.';
            feedbackText.style.color = 'var(--color-blood)';
            inputField.value = '';
            inputField.classList.add('error-flash');
            setTimeout(() => inputField.classList.remove('error-flash'), 500);
        }
    });
});

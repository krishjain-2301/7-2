document.addEventListener('DOMContentLoaded', () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Numbers may be typed as "$18,500" / "18 500" / "18500" — keep digits only.
    const digitsOnly = (str) => str.replace(/[^0-9]/g, '');

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
        diary7: document.getElementById('modal-diary7'),
        invoice: document.getElementById('modal-invoice'),
        ledger: document.getElementById('modal-ledger'),
        obituary: document.getElementById('modal-obituary'),
        noah: document.getElementById('modal-noah'),
        noahDm: document.getElementById('modal-noah-dm'),
        vaultKey: document.getElementById('modal-vault-key'),
        vault: document.getElementById('modal-vault-contents'),
        cipher: document.getElementById('modal-cipher'),
        summary: document.getElementById('modal-summary'),
    };

    document.getElementById('btn-diary7').addEventListener('click', () => openModal(modals.diary7));
    document.getElementById('btn-invoice').addEventListener('click', () => openModal(modals.invoice));
    document.getElementById('btn-ledger').addEventListener('click', () => openModal(modals.ledger));
    document.getElementById('btn-obituary').addEventListener('click', () => openModal(modals.obituary));
    document.getElementById('btn-noah').addEventListener('click', () => openModal(modals.noah));

    const btnCipher = document.getElementById('btn-cipher');
    btnCipher.addEventListener('click', () => openModal(modals.cipher));

    document.getElementById('btn-noah-dm').addEventListener('click', () => {
        closeModal(modals.noah);
        openModal(modals.noahDm);
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

    // ---- Challenge 1: reconcile the ledger (find the siphoned amount) ----
    const ledgerInput = document.getElementById('ledger-input');
    const ledgerBtn = document.getElementById('ledger-btn');
    const ledgerError = document.getElementById('ledger-error');
    const ledgerReveal = document.getElementById('ledger-reveal');
    const LEDGER_HASH = '0b31c0155c83c5fdbff532bfe3e43dfe547938df26dd9092df0eb46bd7900b0c'; // 18500

    async function tryLedger() {
        const typed = digitsOnly(ledgerInput.value.trim());
        const hashed = await hashString(typed);
        if (hashed === LEDGER_HASH) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch4 - ledger', ledgerInput.value.trim(), true);
            ledgerError.innerText = '';
            ledgerReveal.style.display = 'block';
            ledgerReveal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch4 - ledger', ledgerInput.value.trim(), false);
            ledgerError.innerText = 'DOES NOT RECONCILE. RE-CHECK THE THREE UNDEDUCTED TRANSFERS.';
            ledgerInput.value = '';
        }
    }
    ledgerBtn.addEventListener('click', tryLedger);
    ledgerInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') tryLedger(); });

    // ---- Challenge 2: vault key = the siphoned amount (digits) ----
    const vaultInput = document.getElementById('vault-input');
    const vaultSubmitBtn = document.getElementById('vault-submit-btn');
    const vaultError = document.getElementById('vault-error');
    const VAULT_HASH = '0b31c0155c83c5fdbff532bfe3e43dfe547938df26dd9092df0eb46bd7900b0c'; // 18500

    vaultSubmitBtn.addEventListener('click', async () => {
        const typed = digitsOnly(vaultInput.value.trim());
        const hashed = await hashString(typed);
        if (hashed === VAULT_HASH) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch4 - vault key', vaultInput.value.trim(), true);
            closeModal(modals.vaultKey);
            closeModal(modals.noah);
            openModal(modals.vault);
            vaultError.innerText = '';
        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch4 - vault key', vaultInput.value.trim(), false);
            vaultError.innerText = 'ACCESS DENIED. WRONG AMOUNT.';
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
        'cf3a3bbe331c3950d16a8e9917c5bb8340e7c0ef917da25d4a96f92d074bce05', // noah
        'c96db449ade477120486cccad79a0cc9278f5cd7b7db7bff11ebc24e0f16c051', // noah carter
    ];
    const SIN_HASH = '3fba7b30e1dec7eba0ed1b6052f6163650c29c243e39c595fdfffd295080b930'; // greed
    const FRAGMENT_HASH = '354cbfc814262a7a81d343f7d6ebc4adfb4266e5081a78f6a19ff16802dce8b2'; // her

    let quizState = 'who';

    submitBtn.addEventListener('click', async () => {
        const val = inputField.value.trim().toLowerCase();
        const hashed = await hashString(val);

        if (quizState === 'who' && WHO_HASHES.includes(hashed)) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch4 - who', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled = true;

            overlay.style.display = 'flex';
            overlay.classList.add('active');
            sequenceText.innerHTML = '<span class="highlight-green">RECIPIENT CONFIRMED</span>';
            await delay(1500);
            sequenceText.innerHTML = '<span class="highlight-green">NUMBERS_NOTE.TXT RECOVERED</span>';
            btnCipher.style.display = 'flex';
            await delay(1500);

            overlay.classList.remove('active');
            overlay.style.display = 'none';
            sequenceText.innerHTML = '';

            openModal(modals.cipher);

            const cipherCloseBtn = document.getElementById('cipher-close-btn');
            function triggerQ2(event) {
                if (event.currentTarget === cipherCloseBtn || event.target === modals.cipher) {
                    cipherCloseBtn.removeEventListener('click', triggerQ2);
                    modals.cipher.removeEventListener('click', triggerQ2);
                    quizState = 'sin';
                    document.querySelector('.quiz-label').innerHTML =
                        '<span class="highlight-red">SUBJECT CLASSIFICATION REQUIRED.</span><br><br>What was Noah\'s sin?';
                    inputField.value = '';
                    inputField.disabled = false;
                    submitBtn.disabled = false;
                    inputField.focus();
                }
            }
            cipherCloseBtn.addEventListener('click', triggerQ2);
            modals.cipher.addEventListener('click', triggerQ2);
        } else if (quizState === 'sin' && hashed === SIN_HASH) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch4 - sin', val, true);
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
                        'Maya hid one word inside the stolen transfers.<br>' +
                        '<span style="color:#888; font-size:0.9rem;">Decode the three reference codes in order (A=01, B=02 ... Z=26): 08 &middot; 05 &middot; 18.</span>';
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
            if (window.OSIRIS_notify) OSIRIS_notify('Ch4 - hidden word', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled = true;

            addFragment(4, 'HER');

            overlay.style.display = 'flex';
            overlay.classList.add('active');

            sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-green">CASE #008 // CH.04 - FILE RECOVERY COMPLETE</h2></div>';
            await delay(2500);

            sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-red" style="letter-spacing:2px;">GREED IDENTIFIED.</h2><br><h2 style="color:#aaa; font-size:1.5rem;">SUBJECT:<br>NOAH CARTER</h2></div>';
            await delay(2500);

            sequenceText.innerHTML = '<div class="locked-state" style="line-height:2;"><p style="color:#333;">----------------------------</p><h2 style="color:#888;">Maya left 7 names.</h2><h2 class="highlight-green">You recovered 4.</h2><h2 class="highlight-red">3 remain.</h2><p style="color:#333;">----------------------------</p></div>';
            await delay(3000);

            let fragments = {};
            try { fragments = JSON.parse(localStorage.getItem('osiris_fragments') || '{}'); } catch (error) { fragments = {}; }
            const fragCount = Object.keys(fragments).length;
            sequenceText.innerHTML = `
                <div class="locked-state">
                    <p style="color:#888; text-transform:uppercase; letter-spacing:2px;">Hidden fragment recovered</p>
                    <h1 class="highlight-terminal" style="font-size:3rem; letter-spacing:6px; text-shadow:0 0 20px rgba(74,246,38,0.4);">HER</h1>
                    <p style="color:#666; font-family:monospace;">FRAGMENT 04 / 07</p>
                    <p style="color:#888; font-family:monospace; margin-top:10px;">MESSAGE FRAGMENTS COLLECTED: ${fragCount} / 7</p>
                    <p style="color:#555; max-width:460px; margin-top:18px; line-height:1.6;">WE &middot; ALL &middot; WATCHED &middot; HER &middot; ______ &middot; ______ &middot; ______<br>The sentence is turning into something Maya never got to finish out loud.</p>
                </div>`;
            await delay(4500);

            document.body.classList.add('glitch-active');
            sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-terminal">RECOVERING NEXT SUBJECT...</h2><br><p style="font-family:monospace; color:#555; font-size:1.2rem; margin:20px 0;">[############....] 71%</p><div style="color:#888; text-align:left; display:inline-block; line-height:1.6; font-size:1.1rem;">Name Found:<br><span class="highlight-red" style="font-size:1.3rem; font-weight:bold;">ZARA KHAN</span><br><br>Memory Integrity:<br><span style="color:#ff4444">04%</span><br><br>Status:<br><span class="highlight-red" style="font-weight:bold; letter-spacing:2px;">UNSTABLE</span></div></div>';
            await delay(1200);
            document.body.classList.remove('glitch-active');
            await delay(2800);

            sequenceText.innerHTML = '<div class="locked-state"><p style="color:#333;">----------------------------</p><br><p style="color:#888; text-transform:uppercase; letter-spacing:1px;">Final recovered fragment:</p><br><h2 style="font-style:italic; letter-spacing:1px; color:#fff; margin:20px 0;">"He counted the money twice. He never counted the days she had left."</h2><br><p style="color:#333;">----------------------------</p></div>';
            await delay(4000);

            sequenceText.innerHTML = `
                <div class="locked-state">
                    <h2 class="highlight-red" style="font-size:2.2rem; letter-spacing:4px;">NEXT RECOVERY:<br>ZARA KHAN</h2>
                    <a href="chapter5.html" class="terminal-btn" style="margin-top: 30px; text-decoration: none; display: inline-block;">[ DECRYPT ZARA ]</a>
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
            if (window.OSIRIS_notify) OSIRIS_notify('Ch4 - ' + quizState, val, false);
            feedbackText.innerText = 'No match found.';
            feedbackText.style.color = 'var(--color-blood)';
            inputField.value = '';
            inputField.classList.add('error-flash');
            setTimeout(() => inputField.classList.remove('error-flash'), 500);
        }
    });
});

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
        diary5: document.getElementById('modal-diary5'),
        diary6: document.getElementById('modal-diary6'),
        notice: document.getElementById('modal-notice'),
        cache: document.getElementById('modal-cache'),
        hospital: document.getElementById('modal-hospital'),
        ethan: document.getElementById('modal-ethan'),
        ethanDm: document.getElementById('modal-ethan-dm'),
        password: document.getElementById('modal-password'),
        settlement: document.getElementById('modal-settlement-contents'),
        summary: document.getElementById('modal-summary'),
    };

    document.getElementById('btn-diary5').addEventListener('click', () => openModal(modals.diary5));
    document.getElementById('btn-notice').addEventListener('click', () => openModal(modals.notice));
    document.getElementById('btn-cache').addEventListener('click', () => openModal(modals.cache));
    document.getElementById('btn-hospital').addEventListener('click', () => openModal(modals.hospital));
    document.getElementById('btn-ethan').addEventListener('click', () => openModal(modals.ethan));

    const btnDiary6 = document.getElementById('btn-diary6');
    btnDiary6.addEventListener('click', () => openModal(modals.diary6));

    document.getElementById('btn-ethan-dm').addEventListener('click', () => {
        closeModal(modals.ethan);
        openModal(modals.ethanDm);
    });

    document.getElementById('btn-settlement').addEventListener('click', () => {
        openModal(modals.password);
    });

    document.querySelectorAll('.close-modal').forEach((btn) => {
        btn.addEventListener('click', (event) => closeModal(event.target.closest('.modal')));
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) closeModal(event.target);
    });

    document.querySelectorAll('#modal-settlement-contents .fcrack-file').forEach((file) => {
        file.addEventListener('click', () => file.classList.toggle('fcrack-expanded'));
    });

    const cacheRows = Array.from(document.querySelectorAll('.cache-row'));
    const cachePanels = Array.from(document.querySelectorAll('.cache-panel'));
    const cacheUrlInput = document.getElementById('cache-url-input');
    const cacheUrlBtn = document.getElementById('cache-url-btn');
    const cacheUrlError = document.getElementById('cache-url-error');
    const cacheArticle = document.getElementById('cache-article');
    const CACHE_ROUTE = '/metro/2025/10/riverside-hall-assault-report/';

    function setCacheView(view) {
        cacheRows.forEach((row) => {
            const active = row.dataset.cacheView === view;
            row.style.borderLeft = active ? '2px solid var(--color-terminal)' : '';
            row.style.background = active ? 'rgba(74, 246, 38, 0.06)' : '';
            row.style.color = active ? '#d7efe0' : '';
        });
        cachePanels.forEach((panel) => {
            panel.style.display = panel.dataset.cachePanel === view ? 'block' : 'none';
        });
    }

    function normalizeCacheRoute(value) {
        let normalized = value.trim().toLowerCase();
        normalized = normalized.replace(/^https?:\/\/[^/]+/, '');
        normalized = normalized.replace(/^[a-z0-9.-]+(?=\/)/, '');
        if (normalized !== '' && !normalized.startsWith('/')) normalized = '/' + normalized;
        normalized = normalized.replace(/\/+$/, '/');
        return normalized;
    }

    function tryCacheRoute() {
        const typed = cacheUrlInput.value.trim();
        const normalized = normalizeCacheRoute(typed);
        if (normalized === CACHE_ROUTE) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch3 - cache route', typed, true);
            cacheUrlError.innerText = '';
            cacheArticle.style.display = 'block';
            cacheArticle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch3 - cache route', typed, false);
            cacheUrlError.innerText = 'ROUTE NOT FOUND IN CACHE.';
            cacheUrlInput.value = '';
        }
    }

    cacheRows.forEach((row) => {
        row.addEventListener('click', () => setCacheView(row.dataset.cacheView));
    });
    cacheUrlBtn.addEventListener('click', tryCacheRoute);
    cacheUrlInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') tryCacheRoute(); });
    setCacheView('robots');

    const keySubmitBtn = document.getElementById('key-submit-btn');
    const keyPasswordInput = document.getElementById('key-password-input');
    const passwordError = document.getElementById('password-error');

    const UNLOCK_HASHES = [
        '9d11f4c46b5e0a39e48bfad365da09a18aea533363d124370d7dbfddd57e3468',
        'd03280eca83e205c8344da70f97743e7e4dfd90b7a8880830fdefe52816612c2',
    ];

    keySubmitBtn.addEventListener('click', async () => {
        const typed = keyPasswordInput.value.trim().toLowerCase();
        const hashed = await hashString(typed);
        if (UNLOCK_HASHES.includes(hashed)) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch3 - folder key', typed, true);
            closeModal(modals.password);
            closeModal(modals.ethan);
            openModal(modals.settlement);
            passwordError.innerText = '';
        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch3 - folder key', typed, false);
            passwordError.innerText = 'ACCESS DENIED. INVALID KEY.';
            keyPasswordInput.value = '';
        }
    });

    keyPasswordInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') keySubmitBtn.click(); });

    const submitBtn = document.getElementById('submit-investigation');
    const inputField = document.getElementById('investigation-input');
    const feedbackText = document.getElementById('quiz-feedback');
    const overlay = document.getElementById('end-chapter-overlay');
    const sequenceText = document.getElementById('sequence-text');

    inputField.addEventListener('keypress', (event) => { if (event.key === 'Enter') submitBtn.click(); });

    const WHO_HASHES = [
        '7b8bd6c0abf53d22888beafc48830e1156907dd4ec7e6ea31e55a0dd6dc5a969',
        'f28fddfa0e3ebbe970b56bff63d05edb079a7d963409bef505e79fa6e6d53eae',
    ];
    const SIN_HASH = '06583f324b6b4eaae0d50a2a4d997323f3180d08250c0b4292bc8f983d50ee0b';
    const FRAGMENT_HASH = '80adc17f4177175afa07b61686a3362867ba3bdea792c2dc7cd840615787de95';

    let quizState = 'who';

    submitBtn.addEventListener('click', async () => {
        const val = inputField.value.trim().toLowerCase();
        const hashed = await hashString(val);

        if (quizState === 'who' && WHO_HASHES.includes(hashed)) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch3 - who', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled = true;

            overlay.style.display = 'flex';
            overlay.classList.add('active');
            sequenceText.innerHTML = '<span class="highlight-green">IDENTITY CONFIRMED</span>';
            await delay(1500);
            sequenceText.innerHTML = '<span class="highlight-green">MAYA_DIARY_006 RECOVERED</span>';
            btnDiary6.style.display = 'flex';
            await delay(1500);

            overlay.classList.remove('active');
            overlay.style.display = 'none';
            sequenceText.innerHTML = '';

            openModal(modals.diary6);

            const d6CloseBtn = document.getElementById('diary6-close-btn');
            function triggerQ2(event) {
                if (event.currentTarget === d6CloseBtn || event.target === modals.diary6) {
                    d6CloseBtn.removeEventListener('click', triggerQ2);
                    modals.diary6.removeEventListener('click', triggerQ2);
                    quizState = 'sin';
                    document.querySelector('.quiz-label').innerHTML =
                        '<span class="highlight-red">SUBJECT CLASSIFICATION REQUIRED.</span><br><br>What was Ethan\'s sin?';
                    inputField.value = '';
                    inputField.disabled = false;
                    submitBtn.disabled = false;
                    inputField.focus();
                }
            }
            d6CloseBtn.addEventListener('click', triggerQ2);
            modals.diary6.addEventListener('click', triggerQ2);
        } else if (quizState === 'sin' && hashed === SIN_HASH) {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch3 - sin', val, true);
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
                        'Maya hid one word inside the page they deleted.<br>' +
                        '<span style="color:#888; font-size:0.9rem;">Use the cache files to rebuild the route, open the recovered article, then read the first letters.</span>';
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
            if (window.OSIRIS_notify) OSIRIS_notify('Ch3 - hidden word', val, true);
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled = true;

            addFragment(3, 'WATCHED');

            overlay.style.display = 'flex';
            overlay.classList.add('active');

            sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-green">CASE #008 // CH.03 - FILE RECOVERY COMPLETE</h2></div>';
            await delay(2500);

            sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-red" style="letter-spacing:2px;">WRATH IDENTIFIED.</h2><br><h2 style="color:#aaa; font-size:1.5rem;">SUBJECT:<br>ETHAN SMITH</h2></div>';
            await delay(2500);

            sequenceText.innerHTML = '<div class="locked-state" style="line-height:2;"><p style="color:#333;">----------------------------</p><h2 style="color:#888;">Maya left 7 names.</h2><h2 class="highlight-green">You recovered 3.</h2><h2 class="highlight-red">4 remain.</h2><p style="color:#333;">----------------------------</p></div>';
            await delay(3000);

            let fragments = {};
            try { fragments = JSON.parse(localStorage.getItem('osiris_fragments') || '{}'); } catch (error) { fragments = {}; }
            const fragCount = Object.keys(fragments).length;
            sequenceText.innerHTML = `
                <div class="locked-state">
                    <p style="color:#888; text-transform:uppercase; letter-spacing:2px;">Hidden fragment recovered</p>
                    <h1 class="highlight-terminal" style="font-size:3rem; letter-spacing:6px; text-shadow:0 0 20px rgba(74,246,38,0.4);">WATCHED</h1>
                    <p style="color:#666; font-family:monospace;">FRAGMENT 03 / 07</p>
                    <p style="color:#888; font-family:monospace; margin-top:10px;">MESSAGE FRAGMENTS COLLECTED: ${fragCount} / 7</p>
                    <p style="color:#555; max-width:460px; margin-top:18px; line-height:1.6;">Three words now hold together. Maya's message is starting to become impossible to ignore.</p>
                </div>`;
            await delay(4500);

            document.body.classList.add('glitch-active');
            sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-terminal">RECOVERING NEXT SUBJECT...</h2><br><p style="font-family:monospace; color:#555; font-size:1.2rem; margin:20px 0;">[##########......] 63%</p><div style="color:#888; text-align:left; display:inline-block; line-height:1.6; font-size:1.1rem;">Name Found:<br><span class="highlight-red" style="font-size:1.3rem; font-weight:bold;">[REDACTED]</span><br><br>Memory Integrity:<br><span style="color:#ff4444">05%</span><br><br>Status:<br><span class="highlight-red" style="font-weight:bold; letter-spacing:2px;">UNSTABLE</span></div></div>';
            await delay(1200);
            document.body.classList.remove('glitch-active');
            await delay(2800);

            sequenceText.innerHTML = '<div class="locked-state"><p style="color:#333;">----------------------------</p><br><p style="color:#888; text-transform:uppercase; letter-spacing:1px;">Final recovered fragment:</p><br><h2 style="font-style:italic; letter-spacing:1px; color:#fff; margin:20px 0;">"He called it an accident. Everyone else called it over."</h2><br><p style="color:#333;">----------------------------</p></div>';
            await delay(4000);

            sequenceText.innerHTML = `
                <div class="locked-state">
                    <h2 class="highlight-red" style="font-size:2.2rem; letter-spacing:4px;">NEXT RECOVERY:<br>CHAPTER 04</h2>
                    <p style="color:#555; font-family:monospace; margin-top:20px;">LOCKED</p>
                </div>`;

            const footerRec = document.getElementById('count-recovered');
            const footerLock = document.getElementById('count-locked');
            footerRec.innerText = '5';
            footerLock.innerText = '5';
            footerRec.style.color = '#0f0';
            setTimeout(() => { footerRec.style.color = ''; }, 500);

            setTimeout(() => {
                document.getElementById('case-footer').innerHTML = `
                    <div style="display:flex; gap:40px; align-items:center; justify-content:center; width:100%;">
                        <div class="status-box error"><span style="color:red">CONNECTION LOST.</span></div>
                    </div>`;
            }, 4000);
        } else {
            if (window.OSIRIS_notify) OSIRIS_notify('Ch3 - ' + quizState, val, false);
            feedbackText.innerText = 'No match found.';
            feedbackText.style.color = 'var(--color-blood)';
            inputField.value = '';
            inputField.classList.add('error-flash');
            setTimeout(() => inputField.classList.remove('error-flash'), 500);
        }
    });
});

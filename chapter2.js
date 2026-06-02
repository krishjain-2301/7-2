document.addEventListener('DOMContentLoaded', () => {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    async function hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ---- Modal helpers ----
    function openModal(modal) { modal.classList.add('active'); }
    function closeModal(modal) { modal.classList.remove('active'); }

    const modals = {
        diary3: document.getElementById('modal-diary3'),
        diary4: document.getElementById('modal-diary4'),
        offer: document.getElementById('modal-offer'),
        withdrawn: document.getElementById('modal-withdrawn'),
        portalLog: document.getElementById('modal-portal-log'),
        lookup: document.getElementById('modal-lookup'),
        archive: document.getElementById('modal-archive'),
        olivia: document.getElementById('modal-olivia'),
        oliviaDm: document.getElementById('modal-olivia-dm'),
        password: document.getElementById('modal-password'),
        reports: document.getElementById('modal-reports-contents'),
        summary: document.getElementById('modal-summary'),
    };

    // ---- Simple evidence cards ----
    document.getElementById('btn-diary3').addEventListener('click', () => openModal(modals.diary3));
    document.getElementById('btn-offer').addEventListener('click', () => openModal(modals.offer));
    document.getElementById('btn-withdrawn').addEventListener('click', () => openModal(modals.withdrawn));
    document.getElementById('btn-portal-log').addEventListener('click', () => openModal(modals.portalLog));
    document.getElementById('btn-lookup').addEventListener('click', () => openModal(modals.lookup));
    document.getElementById('btn-archive').addEventListener('click', () => openModal(modals.archive));
    document.getElementById('btn-olivia').addEventListener('click', () => openModal(modals.olivia));

    const btnDiary4 = document.getElementById('btn-diary4');
    btnDiary4.addEventListener('click', () => openModal(modals.diary4));

    // ---- Olivia folder explorer ----
    document.getElementById('btn-olivia-dm').addEventListener('click', () => {
        closeModal(modals.olivia);
        openModal(modals.oliviaDm);
    });
    document.getElementById('btn-reports-zip').addEventListener('click', () => {
        openModal(modals.password);
    });

    // ---- Generic close handlers ----
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal')));
    });
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal(e.target);
    });

    // Expand evidence files inside /Reports/
    document.querySelectorAll('#modal-reports-contents .fcrack-file').forEach(file => {
        file.addEventListener('click', () => file.classList.toggle('fcrack-expanded'));
    });

    // =====================================================
    //  OSINT TOOL 1 — USERNAME LOOKUP
    // =====================================================
    const lookupInput = document.getElementById('lookup-input');
    const lookupBtn = document.getElementById('lookup-btn');
    const lookupResults = document.getElementById('lookup-results');

    function renderLookup() {
        const q = lookupInput.value.trim().toLowerCase().replace(/^@/, '');
        lookupResults.innerHTML = '';

        if (q === '') return;

        if (q === 'vireo_truth') {
            lookupResults.innerHTML = `
                <div class="osint-hit private">
                    <div class="osint-hit-head"><span class="osint-plat">🐦 Chirp</span>
                        <span class="osint-handle">@vireo_truth</span></div>
                    <div class="osint-status locked">🔒 ACCOUNT PRIVATE</div>
                    <div class="osint-note">Cannot view posts. <em>Was this account ever public? Try the web archive.</em></div>
                </div>

                <div class="osint-hit live" id="hit-devhub">
                    <div class="osint-hit-head"><span class="osint-plat">💻 DevHub</span>
                        <span class="osint-handle">vireo_truth</span></div>
                    <div class="osint-status open">● PUBLIC</div>
                    <div class="osint-note">1 public repository &middot; <span class="osint-link">click to inspect &raquo;</span></div>
                </div>

                <div class="osint-hit dead">
                    <div class="osint-hit-head"><span class="osint-plat">🎨 PixVault</span>
                        <span class="osint-handle">vireo_truth</span></div>
                    <div class="osint-status gone">✖ 404 — account deleted</div>
                </div>`;

            // DevHub drill-down: git history leaks the author identity
            document.getElementById('hit-devhub').addEventListener('click', () => {
                const dh = document.getElementById('hit-devhub');
                if (dh.querySelector('.devhub-detail')) return;
                const detail = document.createElement('div');
                detail.className = 'devhub-detail';
                detail.innerHTML = `
                    <div class="repo-line">📦 <strong>vireo_truth / dotfiles</strong> &nbsp;<span style="color:#666;">(public)</span></div>
                    <pre class="git-log">$ git log --format=full -1

commit 9c1a4f7e2b8d3a601c0f5e9d77a1b4c83fe21d0a
Author: olivia.reed &lt;olivia.reed@ashwood.edu&gt;
Date:   Wed Oct 16 23:41:08 2026

    remove real name from about page (oops)</pre>
                    <div class="osint-note" style="color:#9fe89f;">↳ the alias forgot to scrub the commit author. <strong>olivia.reed</strong></div>`;
                dh.appendChild(detail);
                dh.classList.add('expanded');
            });
        } else {
            lookupResults.innerHTML = `<div class="osint-empty">No accounts found for "<strong>${escapeHtml(q)}</strong>".</div>`;
        }
    }

    lookupBtn.addEventListener('click', renderLookup);
    lookupInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') renderLookup(); });

    // =====================================================
    //  OSINT TOOL 2 — WEB ARCHIVE
    // =====================================================
    const archiveInput = document.getElementById('archive-input');
    const archiveBtn = document.getElementById('archive-btn');
    const archiveResults = document.getElementById('archive-results');

    function renderArchive() {
        const q = archiveInput.value.trim().toLowerCase().replace(/^@/, '').replace(/^chirp\.com\//, '');
        archiveResults.innerHTML = '';

        if (q === '') return;

        if (q === 'vireo_truth') {
            archiveResults.innerHTML = `
                <div class="archive-snap">
                    <div class="archive-bar">📁 chirp.com/vireo_truth &nbsp;—&nbsp; cached snapshot
                        <span style="color:#888;">2026-10-14 21:07</span></div>
                    <div class="snap-profile">
                        <div class="snap-pfp" title="profile photo">🌿</div>
                        <div class="snap-meta">
                            <div class="snap-name">🌿 O</div>
                            <div class="snap-handle">@vireo_truth</div>
                            <div class="snap-bio">accountability &gt; everything. ashwood '26.</div>
                        </div>
                    </div>
                    <div class="snap-post">
                        <div class="snap-post-text">some people get things they don't deserve. fixed that. 🙂</div>
                        <div class="snap-post-date">Oct 14, 2026 — the same week Maya's offer was pulled</div>
                    </div>
                    <div class="osint-note" style="color:#9fe89f; border-top:1px dashed #333; padding-top:12px;">
                        ↳ REVERSE-IMAGE MATCH: this profile photo is byte-identical to the one on the public account
                        <strong>@livreed</strong> (Olivia Reed). The alias and the real account are the same person.
                    </div>
                </div>`;
        } else if (q === 'livreed') {
            archiveResults.innerHTML = `
                <div class="archive-snap">
                    <div class="archive-bar">📁 chirp.com/livreed &nbsp;—&nbsp; cached snapshot</div>
                    <div class="snap-profile">
                        <div class="snap-pfp" title="profile photo">🌿</div>
                        <div class="snap-meta">
                            <div class="snap-name">Olivia Reed</div>
                            <div class="snap-handle">@livreed</div>
                            <div class="snap-bio">bio &amp; chem @ ashwood 🧪</div>
                        </div>
                    </div>
                    <div class="osint-note">↳ same profile photo as <strong>@vireo_truth</strong>.</div>
                </div>`;
        } else {
            archiveResults.innerHTML = `<div class="osint-empty">No cached snapshots for "<strong>${escapeHtml(q)}</strong>".</div>`;
        }
    }

    archiveBtn.addEventListener('click', renderArchive);
    archiveInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') renderArchive(); });

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // =====================================================
    //  REPORTS.ZIP — PASSWORD GATE (the OSINT payoff)
    // =====================================================
    const keySubmitBtn = document.getElementById('key-submit-btn');
    const keyPasswordInput = document.getElementById('key-password-input');
    const passwordError = document.getElementById('password-error');

    // accepted unlock keys: olivia.reed | olivia.reed@ashwood.edu
    const UNLOCK_HASHES = [
        'eadf0992f080d58f23a0d0cc822696d796a72bc90440193f45c2bd34d37890fb',
        '6f140feabb7aefe933a6c3caefc8db02212246310b22ab19b1f8dadb9fd880b2',
    ];

    keySubmitBtn.addEventListener('click', async () => {
        const hashed = await hashString(keyPasswordInput.value.trim().toLowerCase());
        if (UNLOCK_HASHES.includes(hashed)) {
            closeModal(modals.password);
            closeModal(modals.olivia);
            openModal(modals.reports);
            passwordError.innerText = '';
        } else {
            passwordError.innerText = 'ACCESS DENIED. INVALID KEY.';
            keyPasswordInput.value = '';
        }
    });
    keyPasswordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') keySubmitBtn.click(); });

    // =====================================================
    //  INVESTIGATION QUIZ — two gates (who → sin)
    // =====================================================
    const submitBtn = document.getElementById('submit-investigation');
    const inputField = document.getElementById('investigation-input');
    const feedbackText = document.getElementById('quiz-feedback');
    const overlay = document.getElementById('end-chapter-overlay');
    const sequenceText = document.getElementById('sequence-text');

    inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitBtn.click(); });

    // gate 1 (who): olivia | olivia reed
    const WHO_HASHES = [
        'b2471d941bf888366cf43813752ea2ebfef08254773cf116187cdd6d0463a50a',
        'fcfb335f0da2f6f9b19bb83561a455d82bbcdcca74762a49c506c9c31a230968',
    ];
    // gate 2 (sin): envy
    const SIN_HASH = 'fc91368f2036677b48a4ff19f9fd89f613ae0597090e509f534868b6d78df702';

    let quizState = 'who';

    submitBtn.addEventListener('click', async () => {
        const val = inputField.value.trim().toLowerCase();
        const hashed = await hashString(val);

        if (quizState === 'who' && WHO_HASHES.includes(hashed)) {
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled = true;

            overlay.style.display = 'flex';
            overlay.classList.add('active');
            sequenceText.innerHTML = '<span class="highlight-green">IDENTITY CONFIRMED</span>';
            await delay(1500);
            sequenceText.innerHTML = '<span class="highlight-green">MAYA_DIARY_004 RECOVERED</span>';
            btnDiary4.style.display = 'flex';
            await delay(1500);

            overlay.classList.remove('active');
            overlay.style.display = 'none';
            sequenceText.innerHTML = '';

            openModal(modals.diary4);

            const d4CloseBtn = document.getElementById('diary4-close-btn');
            function triggerQ2(e) {
                if (e.currentTarget === d4CloseBtn || e.target === modals.diary4) {
                    d4CloseBtn.removeEventListener('click', triggerQ2);
                    modals.diary4.removeEventListener('click', triggerQ2);
                    quizState = 'sin';
                    document.querySelector('.quiz-label').innerHTML =
                        '<span class="highlight-red">SUBJECT CLASSIFICATION REQUIRED.</span><br><br>What was Olivia\'s sin?';
                    inputField.value = '';
                    inputField.disabled = false;
                    submitBtn.disabled = false;
                    inputField.focus();
                }
            }
            d4CloseBtn.addEventListener('click', triggerQ2);
            modals.diary4.addEventListener('click', triggerQ2);

        } else if (quizState === 'sin' && hashed === SIN_HASH) {
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled = true;

            openModal(modals.summary);

            const sumCloseBtn = document.getElementById('summary-close-btn');
            const caseConfirmBtn = document.getElementById('case-confirm-btn');

            async function triggerEnding(e) {
                if (e.currentTarget === sumCloseBtn || e.currentTarget === caseConfirmBtn || e.target === modals.summary) {
                    sumCloseBtn.removeEventListener('click', triggerEnding);
                    caseConfirmBtn.removeEventListener('click', triggerEnding);
                    modals.summary.removeEventListener('click', triggerEnding);

                    overlay.style.display = 'flex';
                    overlay.classList.add('active');

                    sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-green">CASE #008 // CH.02 — FILE RECOVERY COMPLETE</h2></div>';
                    await delay(2500);

                    sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-red" style="letter-spacing:2px;">ENVY IDENTIFIED.</h2><br><h2 style="color:#aaa; font-size:1.5rem;">SUBJECT:<br>OLIVIA REED</h2></div>';
                    await delay(2500);

                    sequenceText.innerHTML = '<div class="locked-state" style="line-height:2;"><p style="color:#333;">────────────────────────────</p><h2 style="color:#888;">Maya left 7 names.</h2><h2 class="highlight-green">You recovered 2.</h2><h2 class="highlight-red">5 remain.</h2><p style="color:#333;">────────────────────────────</p></div>';
                    await delay(3000);

                    document.body.classList.add('glitch-active');
                    sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-terminal">RECOVERING NEXT SUBJECT...</h2><br><p style="font-family:monospace; color:#555; font-size:1.2rem; margin:20px 0;">[████████░░░░░░░░] 47%</p><div style="color:#888; text-align:left; display:inline-block; line-height:1.6; font-size:1.1rem;">Name Found:<br><span class="highlight-red" style="font-size:1.3rem; font-weight:bold;">[REDACTED]</span><br><br>Memory Integrity:<br><span style="color:#ff4444">08%</span><br><br>Status:<br><span class="highlight-red" style="font-weight:bold; letter-spacing:2px;">CORRUPTED</span></div></div>';
                    await delay(1200);
                    document.body.classList.remove('glitch-active');
                    await delay(2800);

                    sequenceText.innerHTML = '<div class="locked-state"><p style="color:#333;">────────────────────────────</p><br><p style="color:#888; text-transform:uppercase; letter-spacing:1px;">Final recovered fragment:</p><br><h2 style="font-style:italic; letter-spacing:1px; color:#fff; margin:20px 0;">"The next one smiled the most."</h2><br><p style="color:#333;">────────────────────────────</p></div>';
                    await delay(4000);

                    sequenceText.innerHTML = `
                        <div class="locked-state">
                            <h2 class="highlight-red" style="font-size:2.2rem; letter-spacing:4px;">NEXT RECOVERY:<br>[REDACTED]</h2>
                            <p style="color:#555; font-family:monospace; margin-top:20px;">CHAPTER 03 — LOCKED</p>
                        </div>`;

                    const footerRec = document.getElementById('count-recovered');
                    const footerLock = document.getElementById('count-locked');
                    footerRec.innerText = '5';
                    footerLock.innerText = '5';
                    footerRec.style.color = '#0f0';
                    setTimeout(() => footerRec.style.color = '', 500);

                    setTimeout(() => {
                        document.getElementById('case-footer').innerHTML = `
                        <div style="display:flex; gap:40px; align-items:center; justify-content:center; width:100%;">
                            <div class="status-box error"><span style="color:red">CONNECTION LOST.</span></div>
                        </div>`;
                    }, 4000);
                }
            }

            sumCloseBtn.addEventListener('click', triggerEnding);
            caseConfirmBtn.addEventListener('click', triggerEnding);
            modals.summary.addEventListener('click', triggerEnding);

        } else {
            feedbackText.innerText = 'No match found.';
            feedbackText.style.color = 'var(--color-blood)';
            inputField.value = '';
            inputField.classList.add('error-flash');
            setTimeout(() => inputField.classList.remove('error-flash'), 500);
        }
    });
});

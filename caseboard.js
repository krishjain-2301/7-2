document.addEventListener('DOMContentLoaded', () => {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // Cryptography
    async function hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Automation Presence System
    const PRESENCE_WEBHOOK_URL = "https://discord.com/api/webhooks/1510341931278798929/SIjllZXPQZrltgP17EjiVtVswCE3N-x53qnipUSpSEqMmQa6mJuMoMYCZipGeil4m_y8";
    function sendPresence(statusMessage) {
        if(!PRESENCE_WEBHOOK_URL.startsWith("http")) return;
        fetch(PRESENCE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `[${new Date().toISOString()}] ${statusMessage}` })
        }).catch(err => {});
    }

    if (sessionStorage.getItem("presenceActive") === "true") {
        const playerName = sessionStorage.getItem("playerName") || "Arya";
        setInterval(() => {
            sendPresence(`${playerName} is still active on OSIRIS (Chapter 1).`);
        }, 60000); // Heartbeat every 60s
        
        window.addEventListener("beforeunload", () => {
            sendPresence(`${playerName} has disconnected.`);
        });
    }

    // Modals
    const btnDiary = document.getElementById('btn-diary');
    const btnPhoto = document.getElementById('btn-photo');
    const btnAryan = document.getElementById('btn-aryan');
    
    const modalDiary = document.getElementById('modal-diary');
    const modalDiary2 = document.getElementById('modal-diary2');
    const modalPhoto = document.getElementById('modal-photo');
    const modalAryan = document.getElementById('modal-aryan');
    const modalChatExport = document.getElementById('modal-chat-export');
    const modalPassword = document.getElementById('modal-password');
    const modalFcrackContents = document.getElementById('modal-fcrack-contents');

    function openModal(modal) {
        modal.classList.add('active');
    }

    function closeModal(modal) {
        modal.classList.remove('active');
    }

    btnDiary.addEventListener('click', () => openModal(modalDiary));
    btnPhoto.addEventListener('click', () => openModal(modalPhoto));
    btnAryan.addEventListener('click', () => openModal(modalAryan));
    
    const btnDiary2 = document.getElementById('btn-diary2');
    if (btnDiary2) btnDiary2.addEventListener('click', () => openModal(modalDiary2));

    // Explorer buttons
    const btnChatExport = document.getElementById('btn-chat-export');
    const btnFcrack = document.getElementById('btn-fcrack');

    btnChatExport.addEventListener('click', () => {
        closeModal(modalAryan);
        openModal(modalChatExport);
    });

    btnFcrack.addEventListener('click', () => {
        openModal(modalPassword);
    });

    // Password Logic
    const keySubmitBtn = document.getElementById('key-submit-btn');
    const keyPasswordInput = document.getElementById('key-password-input');
    const passwordError = document.getElementById('password-error');

    keySubmitBtn.addEventListener('click', async () => {
        const hashed = await hashString(keyPasswordInput.value.trim());
        // Accept M4Y4{ARYAN_PR1DE} or M4Y4{ARYAN_PRIDE}
        if (hashed === 'b8e44625a4e3e7a42db83b31a2fb9a5aa35b241aafdb1063740e2cd0468e0ba6' || 
            hashed === '1f46e89e912bde9234a01ed461d42ebf24b67190c142d397a9d07dd7e88c6bc8') {
            closeModal(modalPassword);
            closeModal(modalAryan);
            openModal(modalFcrackContents);
            passwordError.innerText = '';
        } else {
            passwordError.innerText = 'ACCESS DENIED. INVALID KEY.';
            keyPasswordInput.value = '';
        }
    });

    keyPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') keySubmitBtn.click();
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            closeModal(e.target.closest('.modal'));
        });
    });

    const fcrackFiles = document.querySelectorAll('.fcrack-file');
    fcrackFiles.forEach(file => {
        file.addEventListener('click', () => {
            file.classList.toggle('fcrack-expanded');
        });
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Photo Tooltips removed (image is now pure).
    
    // Quiz Logic
    const submitBtn = document.getElementById('submit-investigation');
    const inputField = document.getElementById('investigation-input');
    const feedbackText = document.getElementById('quiz-feedback');
    const overlay = document.getElementById('end-chapter-overlay');
    const sequenceText = document.getElementById('sequence-text');

    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });

    let quizState = 'investigating';

    submitBtn.addEventListener('click', async () => {
        const val = inputField.value.trim().toLowerCase();
        const hashed = await hashString(val);
        
        // Hash for "aryan"
        if (quizState === 'investigating' && hashed === 'f177e7f92ca0491c7b15e54133fe430b1cb90bf169fd433f15d4b29dfcdef33d') {
            // Correct Answer 1
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled = true;
            
            overlay.style.display = 'flex';
            overlay.classList.add('active');
            
            sequenceText.innerHTML = '<span class="highlight-green">ACCESS LEVEL UPDATED</span>';
            await delay(1500);
            
            sequenceText.innerHTML = '<span class="highlight-green">MAYA_DIARY_002 RECOVERED</span>';
            
            // Unhide the diary 2 icon on dashboard permanently
            if (btnDiary2) btnDiary2.style.display = 'flex';
            
            await delay(1500);
            
            overlay.classList.remove('active');
            overlay.style.display = 'none';
            sequenceText.innerHTML = '';
            
            // Open Diary 2
            const modalDiary2 = document.getElementById('modal-diary2');
            openModal(modalDiary2);
            
            // Wait for user to close Diary 2
            const d2CloseBtn = document.getElementById('diary2-close-btn');
            function triggerQ2(e) {
                if (e.currentTarget === d2CloseBtn || e.target === modalDiary2) {
                    d2CloseBtn.removeEventListener('click', triggerQ2);
                    modalDiary2.removeEventListener('click', triggerQ2);
                    quizState = 'sin';
                    document.querySelector('.quiz-label').innerHTML = '<span class="highlight-red">SUBJECT CLASSIFICATION REQUIRED.</span><br><br>What was Aryan\'s sin?';
                    inputField.value = '';
                    inputField.disabled = false;
                    submitBtn.disabled = false;
                    inputField.focus();
                }
            }
            d2CloseBtn.addEventListener('click', triggerQ2);
            modalDiary2.addEventListener('click', triggerQ2);

        // Hash for "pride"
        } else if (quizState === 'sin' && hashed === '470664bd59f587f32e6d933f058464084d1810ee2b3a81b0d4d59d6dd9623da2') {
            // Correct Answer 2
            feedbackText.innerText = '';
            inputField.disabled = true;
            submitBtn.disabled = true;
            
            // Open Chapter Summary Screen
            document.getElementById('summary-subject').innerText = 'SUBJECT: ARYAN';
            document.getElementById('summary-classification').innerText = 'CLASSIFICATION: PRIDE';
            
            const modalSummary = document.getElementById('modal-summary');
            openModal(modalSummary);
            
            const sumCloseBtn = document.getElementById('summary-close-btn');
            const caseConfirmBtn = document.getElementById('case-confirm-btn');
            
            async function triggerEnding(e) {
                if (e.currentTarget === sumCloseBtn || e.currentTarget === caseConfirmBtn || e.target === modalSummary) {
                    sumCloseBtn.removeEventListener('click', triggerEnding);
                    caseConfirmBtn.removeEventListener('click', triggerEnding);
                    modalSummary.removeEventListener('click', triggerEnding);
                    
                    overlay.style.display = 'flex';
                    overlay.classList.add('active');
                
                    sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-green">CASE #008 - FILE RECOVERY COMPLETE</h2></div>';
                    await delay(2500);
                    
                    sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-red" style="letter-spacing: 2px;">PRIDE IDENTIFIED.</h2><br><h2 style="color:#aaa; font-size: 1.5rem;">SUBJECT:<br>ARYAN SHARMA</h2></div>';
                    await delay(2500);
                    
                    sequenceText.innerHTML = '<div class="locked-state" style="line-height: 2;"><p style="color:#333;">────────────────────────────</p><h2 style="color:#888;">Maya left 7 names.</h2><h2 class="highlight-green">You recovered 1.</h2><h2 class="highlight-red">6 remain.</h2><p style="color:#333;">────────────────────────────</p></div>';
                    await delay(3000);

                    document.body.classList.add('glitch-active');
                    sequenceText.innerHTML = '<div class="locked-state"><h2 class="highlight-terminal">RECOVERING NEXT SUBJECT...</h2><br><p style="font-family: monospace; color:#555; font-size: 1.2rem; margin: 20px 0;">[██████░░░░░░░░░░░░] 31%</p><div style="color:#888; text-align: left; display: inline-block; line-height: 1.6; font-size: 1.1rem;">Name Found:<br><span class="highlight-red" style="font-size:1.3rem; font-weight:bold;">OLIVIA</span><br><br>Memory Integrity:<br><span style="color:#ff4444">12%</span><br><br>Status:<br><span class="highlight-red" style="font-weight:bold; letter-spacing: 2px;">CORRUPTED</span></div></div>';
                    await delay(1200);
                    document.body.classList.remove('glitch-active');
                    await delay(2800);

                    sequenceText.innerHTML = '<div class="locked-state"><p style="color:#333;">────────────────────────────</p><br><p style="color:#888; text-transform: uppercase; letter-spacing: 1px;">Final recovered fragment:</p><br><h2 style="font-style: italic; letter-spacing: 1px; color:#fff; margin: 20px 0;">"She knew before all of us."</h2><br><p style="color:#333;">────────────────────────────</p></div>';
                    await delay(4000);

                    sequenceText.innerHTML = `
                        <div class="locked-state">
                            <h2 class="highlight-red" style="font-size: 2.2rem; letter-spacing: 4px;">NEXT RECOVERY:<br>OLIVIA</h2>
                        </div>
                    `;
                    
                    // Update Footer with flash
                    const footerRec = document.getElementById('count-recovered');
                    const footerLock = document.getElementById('count-locked');
                    footerRec.innerText = '4';
                    footerLock.innerText = '6';
                    footerRec.style.color = '#0f0';
                    setTimeout(() => footerRec.style.color = '', 500);
                    
                    document.getElementById('next-recovery-box').style.display = 'block';
                    
                    setTimeout(() => {
                        document.getElementById('case-footer').innerHTML = `
                        <div style="display: flex; gap: 40px; align-items: center; justify-content: center; width: 100%;">
                            <div class="status-box error">
                                <span style="color:red">CONNECTION LOST.</span>
                            </div>
                        </div>`;
                    }, 4000);
                }
            }
            
            sumCloseBtn.addEventListener('click', triggerEnding);
            caseConfirmBtn.addEventListener('click', triggerEnding);
            modalSummary.addEventListener('click', triggerEnding);

        } else {
            // Wrong Answer
            feedbackText.innerText = 'No match found.';
            feedbackText.style.color = 'var(--color-blood)';
            inputField.value = '';
            
            // Flash red
            inputField.classList.add('error-flash');
            setTimeout(() => inputField.classList.remove('error-flash'), 500);
        }
    });
});

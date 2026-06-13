// ============================================================
// OSIRIS // auth.js
// ============================================================
//
// SETUP INSTRUCTIONS — complete these 3 steps before deploying:
//
//  STEP 1: Replace SUPABASE_URL with your project URL
//          Found at: Supabase Dashboard → Project Settings → API
//          e.g. https://abcdefghijk.supabase.co
//
//  STEP 2: Replace SUPABASE_ANON_KEY with your project's anon/public key
//          Found at: Supabase Dashboard → Project Settings → API → anon key
//
//  STEP 3: Set up Google OAuth in Supabase Dashboard:
//          Authentication → Providers → Google → Enable
//          Add your Google OAuth Client ID and Client Secret there.
//          (Your Google Client ID lives in the Supabase dashboard, not in this file)
//
// ============================================================

const SUPABASE_URL      = 'https://rbfjazaxaaasgpeayobi.supabase.co';       // 🔧 Replace
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZmphemF4YWFhc2dwZWF5b2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjE5NDIsImV4cCI6MjA5NjkzNzk0Mn0.gMMhrgBqBDMK_2YIKGN-1Ky5cccvN5ab_sIAYfhhj3k';  // 🔧 Replace
const POST_LOGIN_URL    = 'index.html';               // Where to go after login

// ---- Init Supabase client ----
const { createClient } = window.supabase;
const supabaseClient   = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// Session check on load — skip login if already authenticated
// ============================================================
(async function checkExistingSession() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            window.location.replace(POST_LOGIN_URL);
        }
    } catch (_) {
        // Credentials not configured yet — stay on login page silently
    }
})();

// ============================================================
// DOM — Wire up forms and buttons (Sign In + Sign Up)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // ── Sign In elements ──
    const signinForm    = document.getElementById('signin-form');
    const siEmail       = document.getElementById('si-email');
    const siPassword    = document.getElementById('si-password');
    const siSubmit      = document.getElementById('si-submit');
    const siGoogle      = document.getElementById('si-google');
    const siError       = document.getElementById('si-error');

    // ── Sign Up elements ──
    const signupForm    = document.getElementById('signup-form');
    const suName        = document.getElementById('su-name');
    const suEmail       = document.getElementById('su-email');
    const suPassword    = document.getElementById('su-password');
    const suSubmit      = document.getElementById('su-submit');
    const suGoogle      = document.getElementById('su-google');
    const suError       = document.getElementById('su-error');
    const suSuccess     = document.getElementById('su-success');

    // ── Helpers ──

    function showMsg(el, msg, type = 'error') {
        el.textContent = msg;
        el.classList.add('show');
        if (type === 'error')   el.style.color = 'var(--red, #c41a1a)';
        if (type === 'success') el.style.color = 'var(--green, #4af626)';
    }

    function clearMsg(el) {
        el.textContent = '';
        el.classList.remove('show');
    }

    function setLoading(btn, loading, originalHTML) {
        btn.disabled = loading;
        if (loading) {
            btn.innerHTML = '<span class="spinner"></span> Please wait...';
        } else {
            btn.innerHTML = originalHTML;
        }
    }

    function flashErr(inputs) {
        inputs.forEach(el => {
            if (!el) return;
            el.classList.add('err');
            setTimeout(() => el.classList.remove('err'), 1400);
        });
    }

    // ── Sign In — Email / Password ──
    if (signinForm) {
        const origHTML = siSubmit.innerHTML;
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMsg(siError);

            const email    = siEmail.value.trim();
            const password = siPassword.value;

            if (!email || !password) {
                showMsg(siError, 'Email and password are required.');
                flashErr([siEmail, siPassword]);
                return;
            }

            setLoading(siSubmit, true, origHTML);

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;
                window.location.replace(POST_LOGIN_URL);
            } catch (err) {
                showMsg(siError, (err.message || 'Sign in failed. Check your credentials.').toUpperCase());
                flashErr([siEmail, siPassword]);
                setLoading(siSubmit, false, origHTML);
            }
        });
    }

    // ── Sign In — Google OAuth ──
    if (siGoogle) {
        const origHTML = siGoogle.innerHTML;
        siGoogle.addEventListener('click', async () => {
            clearMsg(siError);
            setLoading(siGoogle, true, origHTML);
            try {
                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/${POST_LOGIN_URL}` },
                });
                if (error) throw error;
                // Browser redirects to Google — no further action needed
            } catch (err) {
                showMsg(siError, (err.message || 'Google sign-in failed.').toUpperCase());
                setLoading(siGoogle, false, origHTML);
            }
        });
    }

    // ── Sign Up — Email / Password ──
    if (signupForm) {
        const origHTML = suSubmit.innerHTML;
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMsg(suError);
            clearMsg(suSuccess);

            const name     = suName  ? suName.value.trim()  : '';
            const email    = suEmail.value.trim();
            const password = suPassword.value;

            if (!email || !password) {
                showMsg(suError, 'Email and password are required.');
                flashErr([suEmail, suPassword]);
                return;
            }

            if (password.length < 8) {
                showMsg(suError, 'Password must be at least 8 characters.');
                flashErr([suPassword]);
                return;
            }

            setLoading(suSubmit, true, origHTML);

            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: name || '' },
                    },
                });

                if (error) throw error;

                // If email confirmation is enabled in Supabase, user gets an email.
                // If disabled (local/immediate), session is created directly.
                if (data.session) {
                    // Immediate access — redirect to game
                    window.location.replace(POST_LOGIN_URL);
                } else {
                    // Confirmation email sent
                    showMsg(suSuccess, '✓ Check your email — a confirmation link has been sent.', 'success');
                    setLoading(suSubmit, false, origHTML);
                }

            } catch (err) {
                showMsg(suError, (err.message || 'Sign up failed. Please try again.').toUpperCase());
                flashErr([suEmail, suPassword]);
                setLoading(suSubmit, false, origHTML);
            }
        });
    }

    // ── Sign Up — Google OAuth ──
    if (suGoogle) {
        const origHTML = suGoogle.innerHTML;
        suGoogle.addEventListener('click', async () => {
            clearMsg(suError);
            setLoading(suGoogle, true, origHTML);
            try {
                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/${POST_LOGIN_URL}` },
                });
                if (error) throw error;
            } catch (err) {
                showMsg(suError, (err.message || 'Google sign-in failed.').toUpperCase());
                setLoading(suGoogle, false, origHTML);
            }
        });
    }

});

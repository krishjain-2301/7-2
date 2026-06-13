// ============================================================
// OSIRIS // guard.js
// ============================================================
//
// Drop this script onto EVERY protected page (index.html,
// caseboard.html, chapter*.html, dashboard.html).
//
// Place it as the VERY FIRST <script> tag in <body>, AFTER
// the Supabase CDN:
//
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="guard.js"></script>
//
// ============================================================
//
// Supabase schema required — run this SQL in your Supabase
// SQL Editor (Dashboard → SQL Editor → New Query):
//
//   -- 1. Profiles table
//   create table public.profiles (
//     id          uuid references auth.users on delete cascade primary key,
//     full_name   text,
//     has_paid    boolean default false,
//     paid_at     timestamptz,
//     payment_id  text,
//     created_at  timestamptz default now()
//   );
//
//   -- 2. Row Level Security
//   alter table public.profiles enable row level security;
//
//   create policy "read_own_profile" on public.profiles
//     for select using (auth.uid() = id);
//
//   create policy "update_own_profile" on public.profiles
//     for update using (auth.uid() = id);
//
//   -- 3. Auto-create profile when a new user signs up
//   create or replace function public.handle_new_user()
//   returns trigger language plpgsql security definer
//   set search_path = public as $$
//   begin
//     insert into public.profiles (id, full_name)
//     values (
//       new.id,
//       coalesce(new.raw_user_meta_data->>'full_name', '')
//     );
//     return new;
//   end;
//   $$;
//
//   create trigger on_auth_user_created
//     after insert on auth.users
//     for each row execute procedure public.handle_new_user();
//
// ============================================================

(async function osirisGuard() {

    // ---- Config (must match auth.js) ----
    const SUPABASE_URL      = 'https://rbfjazaxaaasgpeayobi.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZmphemF4YWFhc2dwZWF5b2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjE5NDIsImV4cCI6MjA5NjkzNzk0Mn0.gMMhrgBqBDMK_2YIKGN-1Ky5cccvN5ab_sIAYfhhj3k';

    // Pages to redirect to
    const LOGIN_URL   = 'login.html';
    const PAYMENT_URL = 'payment.html';

    // ---- Show a blocking overlay immediately so users don't see page flash ----
    const overlay = document.createElement('div');
    overlay.id = 'osiris-guard-overlay';
    overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'background:#030304',
        'z-index:99999',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'font-family:monospace',
        'color:rgba(255,255,255,0.25)',
        'font-size:0.8rem',
        'letter-spacing:4px',
        'text-transform:uppercase',
    ].join(';');
    overlay.textContent = 'Verifying Access...';
    document.documentElement.appendChild(overlay);

    // ---- Check configuration ----
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        // Not configured yet — remove overlay and allow access (dev mode)
        console.warn('[OSIRIS Guard] Supabase not configured. Running in dev mode (access unrestricted).');
        overlay.remove();
        return;
    }

    try {
        const { createClient } = window.supabase;
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // ── Step 1: Check session ──
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            // Not logged in → go to login page
            window.location.replace(LOGIN_URL);
            return;
        }

        // ── Step 2: Check payment ──
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('has_paid, full_name')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            // Profile doesn't exist yet (race condition on first sign-up)
            // Redirect to payment page to be safe
            window.location.replace(`${PAYMENT_URL}?reason=noprofile`);
            return;
        }

        if (!profile?.has_paid) {
            // Authenticated but not paid → send to payment page
            window.location.replace(`${PAYMENT_URL}?reason=unpaid`);
            return;
        }

        // ── Step 3: Access granted ──
        // Store name for in-game use (optional)
        if (profile.full_name) {
            sessionStorage.setItem('osiris_user_name', profile.full_name);
        }
        sessionStorage.setItem('osiris_user_id', session.user.id);
        sessionStorage.setItem('osiris_user_email', session.user.email || '');

        overlay.remove();
        console.log('[OSIRIS] Access granted.');

    } catch (err) {
        // Unexpected error — remove overlay so page isn't permanently blocked in dev
        console.error('[OSIRIS Guard] Error:', err);
        overlay.remove();
    }

})();

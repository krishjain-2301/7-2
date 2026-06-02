// Server-side relay to Discord. The webhook URL lives ONLY here, in an
// environment variable (DISCORD_WEBHOOK_URL) — never in client code, so it
// is never exposed to players who view the page source.
//
// Set it in Vercel: Project → Settings → Environment Variables
//   DISCORD_WEBHOOK_URL = https://discord.com/api/webhooks/XXXX/YYYY
// For local `vercel dev`, put the same line in a gitignored .env file.
//
// Abuse hardening:
//   1. Allowlist — the reported player name must hash to one of the known
//      players (same list as the login screen). Random/forged junk is rejected.
//   2. Rate limit — per-IP cap so a single client can't flood the channel.

import { createHash } from 'node:crypto';

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// SHA-256 of each allowed player name (lower-cased) — mirrors main.js.
const ALLOWED_PLAYERS = new Set([
    'b02e06485c54bb8d503d44ab75693665ccfb580a0d5cbd12c488d8c4aab51f37',
    '77567c4f0cd9d99cc9aa598b2bb7f7532d5da3b242d360f866985e7b3ee20511',
    '082f51aba47229235d342eb95be14ddf7b2acb03d9d27c4c22225c2ff8fd11f4',
    'a961998faf6865df361c0802b622f76aefa9cc93b8ccbb86ace88b1676216c8e',
    'f66112448c73c57005461a10e1f975b65a37903c31d6b68661926875863c0a13',
    'c5fa7b4dcf07033c0287feafb6730f7625f420653e880327dd2447b8ba839583',
    '46ed260db5a4cb33871f0b308aae3e899602cd7f20c6841677e4079d8b9e5ec3',
    '9ec511ea45cb4b20c5086edb481c034fd0e2c72d9bcbb8b9c372374c180092cc',
    '3848e9eff8d31953e3762251e377bb08f78099d2f2193740cd0523738da8b1a5',
    '4b7bb8c301065be38ebed64ed1e85e4ef6f6a06210b6c29abc5919619819b7c0',
    '62aeea5d7c6251b200e685d78d69031fc39cf1061a4c8fd1c8c0746a52b09565',
    'c7b3fec43d69b5a0e648f534eff656c1fd7e507fc730af47336a0d3587cb77eb',
    '682aadef54148f6c969fce014cca450975b72f982bf7e1f3afff1af82cae0b13',
    'abdd3ff29b9324bb375bf8e195349ac779693fa03a855b2788f30754ff77dee8',
    '759797a57c1a4deeeb9f688914029794c85677dd53379f2023bf74d5796c64f5',
    'c6b954680120ef4bcca51c7f307576bba6d20cf4272751536405d66723df70f6',
    'b30a0e34683cf2594ffa4b9f9b2379d314ff57d48b9673a93ea2a29361805ef0',
    '2825a3abf211b3c12c5e1e08226528e27d0f819c394e65f3106d6a017d0e89b1',
    '1795aba0bc169c6eeabf09e4a6d5bf09e91bfcbb59bc36282fe2d3ba3b45f46b',
    '23eb127b3caf920d3dd72f834b35b73e5b8bda870b0d7147838d182b5a9dd789',
]);

// Per-IP sliding-window rate limit. Kept on globalThis so it survives across
// invocations on a warm serverless instance (best-effort, not a hard guarantee).
const RL_WINDOW_MS = 60 * 1000;
const RL_MAX = 25; // max events per IP per window
const rl = globalThis.__osirisRL || (globalThis.__osirisRL = new Map());

function rateLimited(ip) {
    const now = Date.now();
    const hits = (rl.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
    if (hits.length >= RL_MAX) { rl.set(ip, hits); return true; }
    hits.push(now);
    rl.set(ip, hits);
    return false;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'method not allowed' });
        return;
    }

    // Body may arrive parsed (Vercel) or as a raw string (sendBeacon).
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    // --- Hardening 1: player must be a known, allow-listed name ---
    const rawPlayer = String(body.player ?? '').trim();
    if (!rawPlayer || !ALLOWED_PLAYERS.has(sha256(rawPlayer.toLowerCase()))) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    // --- Hardening 2: per-IP rate limit ---
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (rateLimited(ip)) {
        res.status(429).json({ error: 'rate limited' });
        return;
    }

    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (!webhook) {
        // Not configured yet — succeed silently so gameplay is never blocked.
        res.status(204).end();
        return;
    }

    const clean = (v, max) => String(v ?? '').replace(/`/g, "'").slice(0, max);
    const player = clean(rawPlayer, 80);
    const field = clean(body.field || 'unknown', 120);
    const guess = clean(body.guess, 300);
    const isLogin = body.event === 'login';
    const correct = body.correct === true ? true : body.correct === false ? false : null;

    let payload;
    if (isLogin) {
        payload = {
            content: `🟢 **${player}** entered OSIRIS.`,
            allowed_mentions: { parse: [] },
        };
    } else {
        const mark = correct === true ? '✅' : correct === false ? '❌' : 'ℹ️';
        const color = correct === true ? 0x4af626 : correct === false ? 0x8a0303 : 0x888888;
        payload = {
            embeds: [{
                color,
                description: `${mark} **${player}** — *${field}*`,
                fields: [{ name: 'Guess', value: '```\n' + (guess || '(empty)') + '\n```' }],
                timestamp: new Date().toISOString(),
            }],
            allowed_mentions: { parse: [] },
        };
    }

    try {
        await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (e) {
        // Swallow — never break the player's experience over a logging hiccup.
    }
    res.status(204).end();
}

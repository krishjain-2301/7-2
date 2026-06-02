// Server-side relay to Discord. The webhook URL lives ONLY here, in an
// environment variable (DISCORD_WEBHOOK_URL) — never in client code, so it
// is never exposed to players who view the page source.
//
// Set it in Vercel: Project → Settings → Environment Variables
//   DISCORD_WEBHOOK_URL = https://discord.com/api/webhooks/XXXX/YYYY
// For local `vercel dev`, put the same line in a gitignored .env file.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'method not allowed' });
        return;
    }

    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (!webhook) {
        // Not configured yet — succeed silently so gameplay is never blocked.
        res.status(204).end();
        return;
    }

    // Body may arrive parsed (Vercel) or as a raw string (sendBeacon).
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const clean = (v, max) => String(v ?? '').replace(/`/g, "'").slice(0, max);
    const player = clean(body.player || 'Unknown', 80);
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

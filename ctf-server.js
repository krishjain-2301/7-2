// Local dev server for OSIRIS. Serves the static site AND the Chapter 5
// web-CTF routes (robots.txt -> hidden path -> brute-forceable login -> DROWN).
//
//   node ctf-server.js
//
// Challenge flow:
//   GET  /robots.txt          -> discloses Disallow: /vault-7a9/
//   GET  /vault-7a9/          -> login form
//   POST /vault-7a9/login     -> username=zara & password=3rdparty => 200 + DROWN
//                                 anything else                    => 401 + "Invalid credentials"
//
// '3rdparty' is an entry in the custom /passwords.txt (76 candidates, line 36),
// linked from the Ch5 brief, so the login is brute-forceable with ffuf / hydra / Burp.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const HOST = '127.0.0.1';
const PORT = 8000;

const HIDDEN_PATH = '/vault-7a9';
const CTF_USER = 'zara';
const CTF_PASS = '3rdparty';
const FRAGMENT = 'DROWN';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

function send(res, status, body, type = 'text/html; charset=utf-8', extraHeaders = {}) {
    res.writeHead(status, Object.assign({ 'Content-Type': type }, extraHeaders));
    res.end(body);
}

const PAGE_SHELL = (inner) => `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>OSIRIS // ARCHIVE NODE</title>
<style>
  body{background:#05080a;color:#9fe89f;font-family:'Courier New',monospace;display:flex;
       min-height:100vh;align-items:center;justify-content:center;margin:0;}
  .box{border:1px solid #1d3a24;background:#08120c;padding:34px 40px;max-width:440px;width:90%;
       box-shadow:0 0 40px rgba(74,246,38,0.08);}
  h1{font-size:1rem;letter-spacing:3px;color:#4af626;margin:0 0 18px;text-transform:uppercase;}
  label{display:block;font-size:0.75rem;color:#5a7a60;margin:14px 0 4px;letter-spacing:1px;}
  input{width:100%;box-sizing:border-box;background:#02060300;border:1px solid #1d3a24;color:#cdeccd;
        padding:10px;font-family:inherit;font-size:0.95rem;}
  button{margin-top:20px;width:100%;background:#0c1f12;border:1px solid #2e6b3a;color:#9fe89f;
         padding:11px;font-family:inherit;letter-spacing:2px;cursor:pointer;}
  button:hover{background:#123018;}
  .err{color:#ff5555;font-size:0.82rem;margin-top:14px;}
  .frag{font-size:3rem;letter-spacing:10px;color:#4af626;text-align:center;margin:10px 0 6px;
        text-shadow:0 0 24px rgba(74,246,38,0.5);}
  .muted{color:#5a7a60;font-size:0.8rem;line-height:1.6;}
</style></head><body><div class="box">${inner}</div></body></html>`;

const loginPage = (error) => PAGE_SHELL(`
  <h1>ARCHIVE NODE // LOCKED</h1>
  <p class="muted">Recovered from Maya's machine. Credentials required.</p>
  <form method="POST" action="${HIDDEN_PATH}/login">
    <label>USERNAME</label>
    <input name="username" autocomplete="off" autofocus>
    <label>PASSWORD</label>
    <input name="password" type="password" autocomplete="off">
    <button type="submit">AUTHENTICATE</button>
    ${error ? `<div class="err">${error}</div>` : ''}
  </form>`);

const successPage = () => PAGE_SHELL(`
  <h1>ACCESS GRANTED</h1>
  <p class="muted">Maya left one word behind this login. Fragment recovered:</p>
  <div class="frag">${FRAGMENT}</div>
  <p class="muted">Enter it in the Chapter 5 investigation prompt to log the fragment.</p>`);

const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname); }
    catch (e) { return send(res, 400, 'Bad request', 'text/plain'); }

    // --- CTF: robots.txt discloses the hidden path ---
    if (pathname === '/robots.txt') {
        return send(res, 200,
            `User-agent: *\nDisallow: ${HIDDEN_PATH}/\n`,
            'text/plain; charset=utf-8');
    }

    // --- CTF: login form ---
    if (pathname === HIDDEN_PATH || pathname === HIDDEN_PATH + '/') {
        return send(res, 200, loginPage(null));
    }

    // --- CTF: login handler (brute-force target) ---
    if (pathname === HIDDEN_PATH + '/login') {
        if (req.method !== 'POST') return send(res, 405, 'Method Not Allowed', 'text/plain');
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
            if (data.length > 10000) req.destroy();
        });
        req.on('end', () => {
            const params = new URLSearchParams(data);
            const u = (params.get('username') || '').trim();
            const p = (params.get('password') || '').trim();
            if (u === CTF_USER && p === CTF_PASS) {
                return send(res, 200, successPage());
            }
            return send(res, 401, loginPage('Invalid credentials'));
        });
        return;
    }

    // --- Static files ---
    let rel = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.normalize(path.join(ROOT, rel));
    if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden', 'text/plain');

    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) return send(res, 404, 'Not found', 'text/plain');
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`OSIRIS server running:  http://${HOST}:${PORT}/`);
    console.log(`Chapter 5 CTF target :  http://${HOST}:${PORT}/  (check /robots.txt)`);
    console.log(`Hidden login         :  http://${HOST}:${PORT}${HIDDEN_PATH}/  [zara : ${CTF_PASS}]`);
});

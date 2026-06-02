// Tiny fire-and-forget reporter. Posts a guess (or login event) to the
// server-side /api/notify relay, which forwards it to Discord. Never throws,
// never blocks the UI — if the endpoint is missing (e.g. local static server)
// it simply fails silently.
(function () {
    function post(data) {
        try {
            var player = sessionStorage.getItem('playerName') || 'Unknown';
            data.player = player;
            var json = JSON.stringify(data);
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/notify', new Blob([json], { type: 'application/json' }));
            } else {
                fetch('/api/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: json,
                    keepalive: true,
                }).catch(function () {});
            }
        } catch (e) { /* ignore */ }
    }

    // OSIRIS_notify('Ch2: folder key', 'olivia.reed', true)
    window.OSIRIS_notify = function (field, guess, correct) {
        post({ field: field, guess: guess, correct: correct });
    };

    // OSIRIS_login()  — call once the player is authenticated
    window.OSIRIS_login = function () {
        post({ event: 'login' });
    };
})();

const CACHE_NAME = 'kariyer-ai-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/js/main.js',
    '/js/state.js',
    '/js/ui.js',
    '/js/api.js',
    '/js/pdf.js',
    '/assets/logo.png',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    // Activate new SW immediately
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Network-first for navigation (HTML) to ensure users get latest app shell
    if (req.mode === 'navigate' || (req.headers && req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetch(req).then((res) => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                return res;
            }).catch(() => caches.match(req))
        );
        return;
    }

    // For JS/CSS/images use cache-first then network fallback
    // Do NOT cache API responses (paths starting with /api) to avoid serving stale user data
    try {
        const url = new URL(req.url);
        const isApi = url.pathname.startsWith('/api') || url.pathname.startsWith('/submit') || url.pathname.startsWith('/start');

        if (isApi) {
            event.respondWith(fetch(req));
            return;
        }

        event.respondWith(
            caches.match(req).then((cached) => cached || fetch(req).then((res) => {
                if (req.method === 'GET' && req.url.startsWith(self.location.origin)) {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
                }
                return res;
            }))
        );
    } catch (e) {
        event.respondWith(fetch(req));
    }
});

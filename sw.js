/**
 * Service Worker — Cache-First Strategy
 *
 * Caches the app shell on install so it works offline.
 * IndexedDB data is already client-side — this caches the HTML/CSS/JS.
 *
 * Cache invalidation: bump CACHE_VERSION when files change.
 */

const CACHE_VERSION = 'v5';
const CACHE_NAME = `speech-practice-${CACHE_VERSION}`;

const APP_SHELL = [
    '/',
    '/index.html',
    '/styles/index.css',
    '/styles/components.css',
    '/styles/screens.css',
    '/js/app.js',
    '/js/db.js',
    '/js/session.js',
    '/js/utils.js',
    '/js/speech.js',
    '/js/recorder.js',
    '/js/data/nouns.js',
    '/js/data/verbs.js',
    '/js/data/pronouns.js',
    '/js/data/numbers.js',
    '/js/data/phrases.js',
    '/js/data/sentences.js',
    '/js/data/sequences.js',
    '/js/screens/comm-board.js',
    '/js/screens/session-setup.js',
    '/js/screens/words-select.js',
    '/js/screens/word-retrieval.js',
    '/js/screens/sequences.js',
    '/js/screens/pronunciation.js',
    '/js/screens/sentence-builder.js',
    '/js/screens/verbs-pronouns.js',
    '/js/screens/conversation.js',
    '/js/screens/session-complete.js',
    '/js/screens/progress.js',
    '/js/screens/settings.js',
    '/js/screens/family-mode.js',
    '/manifest.json',
];

/* ── Install — cache app shell ────────────────────────── */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

/* ── Activate — clean old caches ──────────────────────── */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k.startsWith('speech-practice-') && k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

/* ── Fetch — cache-first, fall back to network ────────── */
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests (fonts, etc.)
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                // Cache successful responses for future offline use
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Offline and not cached — return offline page for navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                return new Response('', { status: 503, statusText: 'Offline' });
            });
        })
    );
});

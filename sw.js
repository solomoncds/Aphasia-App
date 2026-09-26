/**
 * Service Worker — Cache-First Strategy
 *
 * Caches the app shell on install so it works offline.
 * IndexedDB data is already client-side — this caches the HTML/CSS/JS.
 *
 * Cache invalidation: bump CACHE_VERSION when files change.
 */

const CACHE_VERSION = 'v15';
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
    '/js/screens/pronoun-nouns.js',
    '/js/screens/verbs-pronouns.js',
    '/js/screens/conversation.js',
    '/js/screens/session-complete.js',
    '/js/screens/progress.js',
    '/js/screens/settings.js',
    '/js/screens/family-mode.js',
    '/manifest.json',
];

const IMAGE_ASSETS = [
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    // ── Noun Images (86) ──
    '/assets/images/nouns/arm.png',
    '/assets/images/nouns/bag.png',
    '/assets/images/nouns/bed.png',
    '/assets/images/nouns/belt.png',
    '/assets/images/nouns/bike.png',
    '/assets/images/nouns/blanket.png',
    '/assets/images/nouns/book.png',
    '/assets/images/nouns/bowl.png',
    '/assets/images/nouns/box.png',
    '/assets/images/nouns/bread.png',
    '/assets/images/nouns/bus.png',
    '/assets/images/nouns/cap.png',
    '/assets/images/nouns/car.png',
    '/assets/images/nouns/chair.png',
    '/assets/images/nouns/clock.png',
    '/assets/images/nouns/comb.png',
    '/assets/images/nouns/computer.png',
    '/assets/images/nouns/cup.png',
    '/assets/images/nouns/door.png',
    '/assets/images/nouns/dress.png',
    '/assets/images/nouns/ear.png',
    '/assets/images/nouns/egg.png',
    '/assets/images/nouns/eye.png',
    '/assets/images/nouns/fan.png',
    '/assets/images/nouns/finger.png',
    '/assets/images/nouns/flower.png',
    '/assets/images/nouns/foot.png',
    '/assets/images/nouns/fork.png',
    '/assets/images/nouns/fridge.png',
    '/assets/images/nouns/fruit.png',
    '/assets/images/nouns/garden.png',
    '/assets/images/nouns/glass.png',
    '/assets/images/nouns/grass.png',
    '/assets/images/nouns/hand.png',
    '/assets/images/nouns/house.png',
    '/assets/images/nouns/jacket.png',
    '/assets/images/nouns/juice.png',
    '/assets/images/nouns/kettle.png',
    '/assets/images/nouns/key.png',
    '/assets/images/nouns/knife.png',
    '/assets/images/nouns/lamp.png',
    '/assets/images/nouns/leg.png',
    '/assets/images/nouns/light.png',
    '/assets/images/nouns/meat.png',
    '/assets/images/nouns/medicine.png',
    '/assets/images/nouns/milk.png',
    '/assets/images/nouns/mirror.png',
    '/assets/images/nouns/money.png',
    '/assets/images/nouns/mouth.png',
    '/assets/images/nouns/nose.png',
    '/assets/images/nouns/pan.png',
    '/assets/images/nouns/pan_1.png',
    '/assets/images/nouns/pan_2.png',
    '/assets/images/nouns/pan_3.png',
    '/assets/images/nouns/paper.png',
    '/assets/images/nouns/pen.png',
    '/assets/images/nouns/phone.png',
    '/assets/images/nouns/pillow.png',
    '/assets/images/nouns/plate.png',
    '/assets/images/nouns/pot.png',
    '/assets/images/nouns/rain.png',
    '/assets/images/nouns/remote.png',
    '/assets/images/nouns/road.png',
    '/assets/images/nouns/shirt.png',
    '/assets/images/nouns/shoes.png',
    '/assets/images/nouns/shower.png',
    '/assets/images/nouns/sink.png',
    '/assets/images/nouns/sky.png',
    '/assets/images/nouns/soap.png',
    '/assets/images/nouns/socks.png',
    '/assets/images/nouns/soup.png',
    '/assets/images/nouns/spoon.png',
    '/assets/images/nouns/stove.png',
    '/assets/images/nouns/sun.png',
    '/assets/images/nouns/table.png',
    '/assets/images/nouns/tea.png',
    '/assets/images/nouns/television.png',
    '/assets/images/nouns/tire.png',
    '/assets/images/nouns/toilet.png',
    '/assets/images/nouns/toothbrush.png',
    '/assets/images/nouns/towel.png',
    '/assets/images/nouns/tree.png',
    '/assets/images/nouns/trouser.png',
    '/assets/images/nouns/water.png',
    '/assets/images/nouns/water-1.png',
    '/assets/images/nouns/window.png',
    // ── Verb Images (26) ──
    '/assets/images/verbs/call.png',
    '/assets/images/verbs/clean.png',
    '/assets/images/verbs/close.png',
    '/assets/images/verbs/cook.png',
    '/assets/images/verbs/drink.png',
    '/assets/images/verbs/eat.png',
    '/assets/images/verbs/give.png',
    '/assets/images/verbs/hear.png',
    '/assets/images/verbs/help.png',
    '/assets/images/verbs/like.png',
    '/assets/images/verbs/look.png',
    '/assets/images/verbs/open.png',
    '/assets/images/verbs/push.png',
    '/assets/images/verbs/put.png',
    '/assets/images/verbs/read.png',
    '/assets/images/verbs/run.png',
    '/assets/images/verbs/sit.png',
    '/assets/images/verbs/sleep.png',
    '/assets/images/verbs/stand.png',
    '/assets/images/verbs/stop.png',
    '/assets/images/verbs/wait.png',
    '/assets/images/verbs/wake.png',
    '/assets/images/verbs/walk.png',
    '/assets/images/verbs/wash.png',
    '/assets/images/verbs/work.png',
    '/assets/images/verbs/write.png',
];

/* ── Install — cache app shell and pre-cache all images ────────── */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // 1. Critical App Shell
            await cache.addAll(APP_SHELL);

            // 2. Pre-cache all images in batches of 10
            const batchSize = 10;
            for (let i = 0; i < IMAGE_ASSETS.length; i += batchSize) {
                const batch = IMAGE_ASSETS.slice(i, i + batchSize);
                await Promise.allSettled(
                    batch.map(url =>
                        fetch(url)
                            .then(res => {
                                if (res.ok) return cache.put(url, res);
                            })
                            .catch(err => console.warn('[sw] Pre-cache skipped:', url, err))
                    )
                );
            }
        }).then(() => self.skipWaiting())
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
        caches.match(event.request, { ignoreSearch: true }).then(cached => {
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

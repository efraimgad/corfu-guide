// Basic offline support: stale-while-revalidate for the app shell (this
// file's own assets) and everything else same-origin, and a deliberate
// pass-through (no caching at all) for Supabase API calls and third-party
// images — the app already has its own offline queue for Supabase writes
// (see js/sync.js), and pexels/unsplash/loremflickr photos are too
// numerous to be worth the storage, with the broken-image SVG fallback
// in js/init.js already covering a failed fetch either way.

// Bump this on every deploy that changes any APP_SHELL file — the SW
// cache is otherwise not invalidated, and returning visitors would stay
// pinned to the old cached JS/CSS indefinitely.
const CACHE_NAME = 'corfu-guide-v4';

const APP_SHELL = [
    'index.html',
    'tailwind-production.css',
    'css/corfu.css',
    'js/locations-data.js',
    'js/cards.js',
    'js/search.js',
    'js/filters.js',
    'js/favorites.js',
    'js/itinerary.js',
    'js/dashboard.js',
    'js/map.js',
    'js/tools.js',
    'js/ui.js',
    'js/init.js',
    'js/supabase-config.js',
    'js/database.js',
    'js/storage.js',
    'js/sync.js',
    'manifest.json',
    'images/icons/icon-192.png',
    'images/icons/icon-512.png',
    'images/icons/icon-192-maskable.png',
    'images/icons/icon-512-maskable.png',
    'https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&family=Frank+Ruhl+Libre:wght@400;500;700;900&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => Promise.allSettled(
                // cache.addAll() is all-or-nothing: one failed request (a
                // blocked font CDN, an ad-blocker, a transient network hiccup)
                // would sink the entire precache. Cache each entry
                // independently instead, so the rest still get cached.
                APP_SHELL.map((url) => cache.add(url).catch(() => {}))
            ))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

function isSupabaseRequest(url) {
    return url.hostname.endsWith('.supabase.co');
}

function isThirdPartyImage(url) {
    return /pexels\.com|unsplash\.com|loremflickr\.com/.test(url.hostname);
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return; // never cache writes

    const url = new URL(request.url);

    // Supabase API calls: always go to the network untouched. The app's
    // own sync queue (js/sync.js) already handles offline queueing for
    // these; a service-worker cache would only serve stale data.
    if (isSupabaseRequest(url)) return;

    // Third-party hotlinked photos: too numerous to be worth caching, and
    // a failed fetch already gets a graceful on-brand fallback in JS.
    if (isThirdPartyImage(url)) return;

    const sameOrigin = url.origin === self.location.origin;

    if (sameOrigin && APP_SHELL.some((path) => request.url.endsWith(path))) {
        // App shell: stale-while-revalidate, so the page still loads
        // instantly offline/on a slow connection, but a returning visitor
        // gets updated JS/CSS in the background instead of being pinned
        // to whatever was cached on their first visit.
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) =>
                cache.match(request).then((cached) => {
                    const networkFetch = fetch(request)
                        .then((response) => {
                            if (response && response.ok) cache.put(request, response.clone());
                            return response;
                        })
                        .catch(() => cached);
                    return cached || networkFetch;
                })
            )
        );
        return;
    }

    // Everything else same-origin (and the Google Fonts stylesheet/files):
    // stale-while-revalidate — serve the cached copy immediately if there
    // is one, while updating the cache in the background for next time.
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) =>
            cache.match(request).then((cached) => {
                const networkFetch = fetch(request)
                    .then((response) => {
                        if (response && response.ok) cache.put(request, response.clone());
                        return response;
                    })
                    .catch(() => cached);
                return cached || networkFetch;
            })
        )
    );
});

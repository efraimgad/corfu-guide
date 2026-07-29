// Basic offline support: stale-while-revalidate for the app shell (this
// file's own assets) and everything else same-origin, a deliberate
// pass-through (no caching at all) for Supabase API calls — the app has
// its own offline queue for those (see js/sync.js) — and a bounded
// cache-on-view store for the hotlinked pexels/unsplash/loremflickr
// photos.
//
// That last one used to be a pass-through too, on the grounds that ~176
// photos are "too numerous to be worth the storage" with the
// broken-image SVG fallback in js/init.js covering a miss. That holds
// for precaching all of them upfront, which is what it would have meant
// then. It doesn't hold for the actual use case: this is a travel guide,
// so the likeliest time to open it offline is on the island, on airplane
// mode or a dead foreign SIM — exactly when every photo the visitor
// already browsed at the hotel would silently turn into a placeholder.
//
// So: photos are cached only once they've actually been fetched and
// displayed, capped at MAX_IMAGE_ENTRIES with oldest-out eviction, which
// answers the storage objection directly rather than by not caching. The
// cap is deliberately larger than one category's worth of cards but far
// below the full set.

// Bump this on every deploy that changes any APP_SHELL file — the SW
// cache is otherwise not invalidated, and returning visitors would stay
// pinned to the old cached JS/CSS indefinitely.
const CACHE_NAME = 'corfu-guide-v6';

// Versioned separately and NOT tied to CACHE_NAME: photos are immutable
// per URL, so an app-shell deploy has no reason to make a returning
// visitor re-download every image they'd already cached.
const IMAGE_CACHE_NAME = 'corfu-guide-images-v1';
const MAX_IMAGE_ENTRIES = 120;

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
                // The image cache is intentionally exempt: it's versioned
                // on its own and holds immutable per-URL photos, so an
                // app-shell deploy shouldn't force a re-download of
                // everything the visitor already has offline.
                names
                    .filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE_NAME)
                    .map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

// Keeps the photo cache from growing without bound. cache.keys() returns
// entries in insertion order, so the oldest additions are evicted first.
async function trimImageCache(cache) {
    const keys = await cache.keys();
    const excess = keys.length - MAX_IMAGE_ENTRIES;
    for (let i = 0; i < excess; i++) {
        await cache.delete(keys[i]);
    }
}

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

    // Third-party hotlinked photos: cache-first against the bounded photo
    // cache. Cache-first rather than stale-while-revalidate because these
    // URLs are immutable (a pexels photo id always returns the same
    // image), so revalidating would spend a returning visitor's cellular
    // data to re-fetch bytes that cannot have changed.
    //
    // <img> loads are no-cors, so the response here is opaque: status 0
    // and response.ok false even on success. That's still a perfectly
    // usable cache entry, so opaque responses are stored explicitly
    // instead of being filtered out by the usual response.ok check. A
    // genuine network failure rejects, and js/init.js's broken-image
    // fallback covers it exactly as before.
    if (isThirdPartyImage(url)) {
        event.respondWith(
            caches.open(IMAGE_CACHE_NAME).then((cache) =>
                cache.match(request).then((cached) => {
                    if (cached) return cached;
                    return fetch(request).then((response) => {
                        if (response && (response.ok || response.type === 'opaque')) {
                            cache.put(request, response.clone()).then(() => trimImageCache(cache));
                        }
                        return response;
                    });
                })
            )
        );
        return;
    }

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

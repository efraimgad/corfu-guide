// Basic offline support: stale-while-revalidate for the app shell (this
// file's own assets) and everything else same-origin; cache-first (capped,
// own cache each) for third-party Pexels/Unsplash photos AND OpenStreetMap
// map tiles; and a deliberate pass-through (no caching at all) for Supabase
// API calls — the app already has its own offline queue for those writes
// (see js/sync.js). The broken-image SVG fallback in js/init.js still
// covers any fetch that fails even after a cache-first attempt.

// Bump this on every deploy that changes any APP_SHELL file — the SW
// cache is otherwise not invalidated, and returning visitors would stay
// pinned to the old cached JS/CSS indefinitely.
const CACHE_NAME = 'corfu-guide-v8';

// Photos live in their own cache so they can be evicted (and capped)
// independently of the app shell, and so bumping CACHE_NAME for a code
// change does not throw away a trip's worth of already-downloaded images.
const IMAGE_CACHE_NAME = 'corfu-guide-images-v1';
const IMAGE_CACHE_MAX = 200;

// Map tiles get their own capped cache too, same reasoning as photos - and
// a higher cap, since a tile is a few KB (not a few hundred KB like a
// photo) and panning/zooming around Corfu across three separate map
// instances (home/beaches/explore) touches far more distinct tile URLs
// than the handful of photos on any one screen.
const TILE_CACHE_NAME = 'corfu-guide-tiles-v1';
const TILE_CACHE_MAX = 600;

const APP_SHELL = [
    'index.html',
    'tailwind-production.css',
    'css/design-system.css',
    'js/html-utils.js',
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
    'images/cards/history.svg',
    'images/cards/nature.svg',
    'images/cards/beach.svg',
    'images/cards/village.svg',
    'images/cards/family.svg',
    'images/cards/food.svg',
    'images/cards/banner-attractions.svg',
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
                names.filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE_NAME && name !== TILE_CACHE_NAME)
                     .map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

function isSupabaseRequest(url) {
    return url.hostname.endsWith('.supabase.co');
}

function isThirdPartyImage(url) {
    return /(^|\.)images\.pexels\.com$|(^|\.)pexels\.com$|(^|\.)unsplash\.com$/.test(url.hostname);
}

// js/map.js's own tile layer always requests this exact host (no {s}
// subdomain sharding - see that file's own comment on why) - matching it
// directly, rather than a broader *.openstreetmap.org pattern, keeps this
// from accidentally intercepting an unrelated OSM API call in the future.
function isMapTile(url) {
    return url.hostname === 'tile.openstreetmap.org';
}

// Keeps a capped cache from growing without bound: FIFO eviction, oldest
// entries first (cache.keys() preserves insertion order). Shared by the
// photo and tile caches - same policy, different cap/cache per media type.
async function trimCappedCache(cache, max) {
    const keys = await cache.keys();
    if (keys.length <= max) return;
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return; // never cache writes

    const url = new URL(request.url);

    // Supabase API calls: always go to the network untouched. The app's
    // own sync queue (js/sync.js) already handles offline queueing for
    // these; a service-worker cache would only serve stale data.
    if (isSupabaseRequest(url)) return;

    // Third-party photos: cache-first, into a dedicated capped cache.
    //
    // These USED to be skipped entirely, which meant that the one situation
    // this PWA exists for — standing on a Corfu beach with no data — was
    // exactly when every image on the page broke. Cache-first means a photo
    // seen once while planning is still there on the island, and the cap
    // stops a long trip from filling the device.
    if (isThirdPartyImage(url)) {
        event.respondWith(
            caches.open(IMAGE_CACHE_NAME).then((cache) =>
                cache.match(request).then((cached) => {
                    if (cached) return cached;
                    return fetch(request)
                        .then((response) => {
                            // Opaque cross-origin responses (status 0) are still
                            // worth storing: the browser can replay them into an
                            // <img> even though we cannot inspect them.
                            if (response && (response.ok || response.type === 'opaque')) {
                                cache.put(request, response.clone()).then(() => trimCappedCache(cache, IMAGE_CACHE_MAX));
                            }
                            return response;
                        })
                        .catch(() => cached);
                })
            )
        );
        return;
    }

    // Map tiles: same cache-first/capped treatment as third-party photos,
    // in their own cache. Without this they fell into the generic
    // "everything else" stale-while-revalidate branch below, sharing
    // CACHE_NAME with the app shell - functionally similar, but a flaky
    // mobile connection got no benefit from a tile already seen (no
    // cache-first short-circuit) and a full trip's worth of tiles isn't
    // something a shared, uncapped cache should be soaking up.
    if (isMapTile(url)) {
        event.respondWith(
            caches.open(TILE_CACHE_NAME).then((cache) =>
                cache.match(request).then((cached) => {
                    if (cached) return cached;
                    return fetch(request)
                        .then((response) => {
                            if (response && (response.ok || response.type === 'opaque')) {
                                cache.put(request, response.clone()).then(() => trimCappedCache(cache, TILE_CACHE_MAX));
                            }
                            return response;
                        })
                        .catch(() => cached);
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

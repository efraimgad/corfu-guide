// Basic offline support: stale-while-revalidate for the app shell (this
// file's own assets) and everything else same-origin; cache-first (capped,
// own cache) for third-party Pexels/Unsplash photos; and a deliberate
// pass-through (no caching at all) for map tiles (see TILE_HOSTS) and Supabase
// API calls — the app already has its own offline queue for those writes
// (see js/sync.js). The broken-image SVG fallback in js/init.js still
// covers any fetch that fails even after a cache-first attempt.

// Bump this on every deploy that changes any APP_SHELL file — the SW
// cache is otherwise not invalidated, and returning visitors would stay
// pinned to the old cached JS/CSS indefinitely.
const CACHE_NAME = 'corfu-guide-v35';

// Photos live in their own cache so they can be evicted (and capped)
// independently of the app shell, and so bumping CACHE_NAME for a code
// change does not throw away a trip's worth of already-downloaded images.
const IMAGE_CACHE_NAME = 'corfu-guide-images-v1';
const IMAGE_CACHE_MAX = 200;

// NOTE: there is deliberately no tile cache any more - see the fetch
// handler's own note on why tiles bypass this worker entirely. The old
// 'corfu-guide-tiles-v1' cache is intentionally left OUT of the activate
// handler's keep-list below so it gets deleted, taking any bad entries
// stored while tiles were being intercepted with it.

const APP_SHELL = [
    'index.html',
    'tailwind-production.css',
    'css/design-system.css',
    'js/html-utils.js',
    'js/destination-registry.js',
    'js/destination-chrome.js',
    'js/destination-gate.js',
    'data/destinations/corfu.js',
    'data/destinations/testdest.js',
    'data/destinations/paxos.js',
    'data/destinations/empty.js',
    'js/locations-data.js',
    'js/testdest-locations.js',
    'js/paxos-locations.js',
    'js/corfu-faq.js',
    'js/testdest-faq.js',
    'js/paxos-faq.js',
    'js/corfu-activities.js',
    'js/testdest-activities.js',
    'js/paxos-activities.js',
    'js/corfu-weather.js',
    'js/testdest-weather.js',
    'js/paxos-weather.js',
    'js/corfu-about.js',
    'js/testdest-about.js',
    'js/paxos-about.js',
    'js/corfu-language.js',
    'js/testdest-language.js',
    'js/paxos-language.js',
    'js/location-shared.js',
    'js/search.js',
    'js/faq-filters.js',
    'js/activities.js',
    'js/health-safety.js',
    'js/trip-planning.js',
    'js/about.js',
    'js/language.js',
    'js/favorites.js',
    'js/notes-favorites.js',
    'js/itinerary-data.js',
    'js/testdest-itinerary.js',
    'js/paxos-itinerary.js',
    'js/itinerary.js',
    'js/solar.js',
    'js/itinerary-view.js',
    'js/reservations.js',
    'js/packing.js',
    // Loaded by index.html but intentionally untracked (personal hotel/flight
    // details, not committed to the repo). Listing it here is still correct:
    // install() below caches each APP_SHELL entry independently and swallows
    // per-URL failures, so it gets precached for anyone who has created their
    // own copy, and the 404 is caught and ignored for anyone who has not -
    // it does not sink the rest of the precache.
    'js/trip-private.js',
    'js/dashboard.js',
    'js/map.js',
    'js/explore.js',
    'js/tools.js',
    'js/ui.js',
    'js/init.js',
    'js/app-shell.js',
    'js/guide.js',
    'js/tools-fab.js',
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
        // MUST match index.html's <link> byte for byte — a different query string
    // is a different cache key. This used to precache a URL that also asked
    // for Frank Ruhl Libre, a family referenced nowhere in the CSS, while the
    // URL the page actually requests was absent from APP_SHELL entirely.
    'https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&display=swap',

    // Phase E: Leaflet + the marker-cluster plugin (js/map.js loadLeafletThen()) are lazy-loaded from cdnjs on first map open rather
    // than blocking every page view on a map library most visits never use.
    // That is the right call for load performance, but it left exactly the
    // gap this PWA exists to close: the "everything else" stale-while-
    // revalidate branch below only caches a URL AFTER its first successful
    // fetch, so a map opened offline for the very first time - no prior
    // online visit to have primed that cache entry - got nothing. Not a
    // stale map, no map at all: initExploreMap()/initHomeMap() see L still
    // undefined and fall back to their empty-state UI.
    //
    // Listing these five URLs here guarantees that first successful fetch
    // happens during install() - i.e. whenever the PWA itself was installed
    // or last updated, which by definition happened online - so the very
    // first map open on the island, offline, already has them cached. The
    // version numbers (1.9.4 / 1.5.3) are intentionally hardcoded to match
    // js/map.js own <script>/<link> tags exactly; the two must be bumped
    // together or a mismatch would silently precache a version nothing
    // requests.
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js'
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
                names.filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE_NAME)
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

// The exact tile hosts js/map.js's GT_TILE_PROVIDERS can request (it fails
// over between them, so both must bypass this worker). Matched by exact
// hostname rather than a broad *.openstreetmap.org / *.cartocdn.com
// pattern, so this can't accidentally exempt an unrelated API call on a
// sibling subdomain later.
const TILE_HOSTS = ['basemaps.cartocdn.com', 'tile.openstreetmap.org'];
function isMapTile(url) {
    return TILE_HOSTS.includes(url.hostname);
}

// Keeps a capped cache from growing without bound: FIFO eviction, oldest
// entries first (cache.keys() preserves insertion order).
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

    // Map tiles: DELIBERATELY not intercepted - straight to the network,
    // same hands-off treatment as Supabase above.
    //
    // Tiles rendered blank on a real device across two entirely different
    // CDNs (OpenStreetMap, then Carto) in both light and dark mode, while
    // markers/clustering - which need no network - drew correctly. Two
    // unrelated hosts failing identically means the provider was never the
    // variable; the one thing every tile request had in common was passing
    // through this worker (first via the generic branch below, later via a
    // cache-first branch here). A respondWith() that resolves to undefined
    // - which is what any throw inside these handlers produces, since the
    // .catch() fell back to an undefined `cached` - surfaces to an <img> as
    // a network error, i.e. exactly a blank tile.
    //
    // Not caching tiles costs little: the cache-first path never actually
    // served a tile here (none were ever stored), so there is no offline
    // capability being given up, only one that never worked. Photos and the
    // app shell keep their caching; only tiles opt out.
    if (isMapTile(url)) return;

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

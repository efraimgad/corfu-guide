// Interactive map of all beaches/food/attractions/gems - built from
// window.CORFU_LOCATIONS (js/locations-data.js), the same data source
// that renders the cards themselves (js/explore.js; previously js/cards.js,
// deleted in Phase C2), instead of four
// separate hardcoded arrays that could silently drift out of sync with
// the cards. Markers are keyed by data-id rather than by Hebrew display
// name, so a card and its marker can never mismatch on a name typo.

// Phase C2 removed the #beaches section and its map. beachMapInstance was
// never reassigned after this initialiser once initBeachMap() went, and
// mapLayerGroups had zero references anywhere in the repo — both are gone.
// The live instances are exploreMapInstance and homeMapInstance, declared
// beside their own init functions below.

// Loads Leaflet + the marker-cluster plugin on first use only (they
// used to load unconditionally from head tags on every page view).
// Safe to call every time toggleBeachMap() runs - after the first
// successful load it just calls back immediately.
let leafletLoadPromise = null;
function loadLeafletThen(callback) {
    if (typeof L !== 'undefined') { callback(); return; }
    if (!leafletLoadPromise) {
        leafletLoadPromise = new Promise((resolve, reject) => {
            // No `integrity`/`crossOrigin` here (unlike the two <script>
            // tags below, deliberately): a stylesheet is not executable, so
            // pinning it to an exact byte hash trades a small supply-chain
            // guarantee for a much worse failure mode - if cdnjs ever
            // reserves/re-serves these bytes any differently (a legitimate
            // repack, a different compression pass, anything), the browser
            // silently refuses to apply the file with no error event to
            // hook into, no console warning by default, nothing - just a
            // map that renders its marker layer (self-styled, doesn't need
            // this CSS) over completely unstyled/invisible tile images.
            // That exact silent-failure shape is what motivated this
            // rewrite. onerror below at least surfaces it if it ever
            // recurs for an unrelated reason (CDN outage, ad/tracker
            // blocker, etc).
            const addCss = (href) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onerror = () => console.warn('[map] stylesheet failed to load, map tiles may render unstyled:', href);
                document.head.appendChild(link);
            };
            addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
            addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css');
            addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css');

            const leafletScript = document.createElement('script');
            leafletScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
            // VERIFIED against the live cdnjs bytes (2026-08-10): this hash is
            // correct and Leaflet loads in production. Note that npm's leaflet
            // package ships NO leaflet.min.js — cdnjs builds that variant itself —
            // so hashing npm's dist/leaflet.js gives a DIFFERENT, legitimate value
            // (sha384-cxOPjt7s...). Do not "correct" this pin to that one.
            // Re-verify after any Leaflet version bump:
            //   curl -sfL <this url> -o /tmp/l.js && node -e 'const c=require("crypto"),f=require("fs");console.log("sha384-"+c.createHash("sha384").update(f.readFileSync("/tmp/l.js")).digest("base64"))'
            leafletScript.integrity = 'sha384-NElt3Op+9NBMCYaef5HxeJmU4Xeard/Lku8ek6hoPTvYkQPh3zLIrJP7KiRocsxO';
            leafletScript.crossOrigin = 'anonymous';
            leafletScript.onload = () => {
                const clusterScript = document.createElement('script');
                clusterScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js';
                clusterScript.integrity = 'sha384-eXVCORTRlv4FUUgS/xmOyr66XBVraen8ATNLMESp92FKXLAMiKkerixTiBvXriZr';
                clusterScript.crossOrigin = 'anonymous';
                clusterScript.onload = resolve;
                clusterScript.onerror = () => { console.error('[map] leaflet.markercluster.js failed to load'); reject(); };
                document.head.appendChild(clusterScript);
            };
            leafletScript.onerror = () => { console.error('[map] leaflet.min.js failed to load'); reject(); };
            document.head.appendChild(leafletScript);
        });
    }
    // Callback runs even on failure: initExploreMap()/initHomeMap() each
    // re-check `typeof L === "undefined"` as their first line and paint the
    // Hebrew "map unavailable" fallback themselves, so invoking it IS what
    // makes that fallback appear. (This used to credit initBeachMap(), which
    // was deleted in Phase C2 along with the #beaches section.)
    leafletLoadPromise.then(callback).catch(() => callback());
}

// Phase C2: toggleBeachMap() deleted — its #beach-map-container lived inside the deleted #beaches.


// Lookup index so cards can find their marker (and vice versa) by
// layerKey + data-id.
const mapMarkerIndex = {};

// ---------------------------------------------------------------------------
// Category colours are READ FROM THE DESIGN TOKENS, not hardcoded.
//
// css/design-system.css states its --gt-cat-* tokens are "identical to
// js/map.js pin colors" and lists #2563eb/#ea580c/#9333ea/#059669. That was
// true when written, but a later contrast pass darkened the tokens to
// #2160eb/#bb460a/#9230ea/#047b56 and this file was never updated - so the
// legend chips and the map pins drifted to visibly different colours, with
// the old literals repeated in 13 places across three init functions.
// Reading the token at runtime means there is now exactly one source of
// truth, and any future token change follows automatically.
// ---------------------------------------------------------------------------
// Fallback color if a category's colorVar token isn't defined in CSS for
// some reason - a generic neutral blue, not tied to any one category.
const GT_CAT_FALLBACK_COLOR = '#2160eb';
let gtCatColorCache = null;
function gtCategoryColor(layerKey) {
    if (!gtCatColorCache) {
        const cs = getComputedStyle(document.documentElement);
        const categories = (window.DESTINATION && window.DESTINATION.categories) || [];
        gtCatColorCache = {};
        categories.forEach(cat => {
            const value = (cs.getPropertyValue(cat.colorVar) || '').trim();
            gtCatColorCache[cat.key] = value || GT_CAT_FALLBACK_COLOR;
        });
    }
    return gtCatColorCache[layerKey] || GT_CAT_FALLBACK_COLOR;
}

// Builds one category layer group per window.DESTINATION.categories entry,
// for one map instance. Replaces what used to be four near-identical
// buildLayerGroup() calls copy-pasted into each of initExploreMap/initHomeMap
// (and the since-deleted initBeachMap) - now driven by however many
// categories the active destination actually has (2 for testdest, 4 for
// Corfu, or any other count a future destination defines).
function gtBuildCategoryLayers(groups, indexStore, onTap) {
    const categories = (window.DESTINATION && window.DESTINATION.categories) || [];
    const locations = (window.DESTINATION && window.DESTINATION.locations) || {};
    categories.forEach(cat => {
        groups[cat.key] = buildLayerGroup(locations[cat.key] || [], gtCategoryColor(cat.key), cat.key, indexStore, onTap);
    });
    return groups;
}

// The single "home base" marker, previously duplicated verbatim in
// initExploreMap() and initHomeMap().
function gtBuildHotelLayer() {
    const hotelIcon = L.divIcon({
        html: '<div style="background:#e11d48;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"><span style="transform:rotate(45deg);font-size:14px;">🏨</span></div>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    const hotelName = (window.DEFAULT_HOTEL && window.DEFAULT_HOTEL.name) || 'המלון שלכם';
    const homeBase = (window.DESTINATION && window.DESTINATION.map && window.DESTINATION.map.homeBase) || {};
    const homeBaseLatLng = [homeBase.lat, homeBase.lon];
    const mapsQuery = homeBase.mapsQuery || homeBase.name || '';
    return L.layerGroup([
        L.marker(homeBaseLatLng, { icon: hotelIcon, title: hotelName, alt: hotelName, keyboard: true }).bindPopup(
            `<strong>${escapeHtml(hotelName)}</strong><br>${escapeHtml(homeBase.name || '')} - מקום הלינה שלכם<br>` +
            `<a href="https://maps.google.com/?q=${encodeURIComponent(hotelName + ' ' + mapsQuery)}" target="_blank" rel="noopener noreferrer">📍 נווט לשם</a>`
        )
    ]);
}

// Shared L.map() factory. Two behaviours every instance needs and none of
// them had:
//  1. scrollWheelZoom starts DISABLED. All three maps are embedded in a
//     long scrolling page, so a wheel scroll that happened to cross the map
//     zoomed the map instead of scrolling the page - the classic embedded-map
//     scroll trap. One click (or keyboard focus) arms it; leaving disarms it.
//  2. maxBounds keeps Corfu on screen. Without it a stray pinch could pan
//     into empty ocean with no way back short of reloading.
// Read from window.DESTINATION rather than hardcoded to Corfu - map.js runs
// after destination-registry.js has set window.DESTINATION (see index.html's
// script-order comment), so this is safe at module scope.
const GT_CORFU_CENTER = (window.DESTINATION && window.DESTINATION.map && window.DESTINATION.map.center) || [39.62, 19.85];
// Bounds are built INSIDE gtCreateMap(), not at module scope: js/map.js is
// parsed on page load but Leaflet is lazy-loaded on first map use, so any
// top-level reference to `L` throws "L is not defined" on every page view.
const GT_CORFU_BOUNDS_LATLNG = (window.DESTINATION && window.DESTINATION.map && window.DESTINATION.map.bounds) || [[39.20, 19.30], [39.95, 20.40]];

// Tile providers, in preference order, with automatic failover.
//
// Why a list and not one hardcoded URL: the map rendered its markers
// correctly (so Leaflet's JS AND CSS were both fine - unstyled panes would
// have stacked every marker at the top-left instead of positioning them
// geographically) while every tile image came back blank, identically on
// wifi and cellular. That combination points at the tile host refusing the
// requests rather than anything device- or network-side, which is a real
// operational risk with openstreetmap.org's tile service: its usage policy
// explicitly reserves the right to block origins it considers heavy users,
// and a public GitHub Pages site is exactly the shape of origin that gets
// caught by that.
//
// Carto's basemaps are first because they're explicitly provisioned for
// this kind of embedded web use; OSM stays as the fallback. Both are
// keyless and both ultimately render OpenStreetMap data, so the map looks
// materially the same either way. Nothing else in this file (markers,
// clustering, popups, bounds, the day-route lines) touches the tile layer,
// so swapping providers is inert with respect to the rest of the map.
const GT_TILE_PROVIDERS = [
    {
        name: 'carto-voyager',
        url: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20
    },
    {
        name: 'osm',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }
];

// Adds providers[index], watching for tileerror. Leaflet fires tileerror
// per failed tile, so a provider that's being refused outright produces a
// burst of them - a handful (not one, which can just be a transient miss)
// is the signal to give up on it and try the next one. maxBounds already
// keeps the viewport over Corfu, so there are no legitimately-missing
// out-of-coverage tiles to confuse this count.
const GT_TILE_ERROR_THRESHOLD = 4;

// Tiles as <div> + background-image instead of Leaflet's default <img>.
//
// Built from the one pattern that has held through every attempt at the
// blank-basemap bug: markers render perfectly and tiles never do, across
// two unrelated CDNs, both colour schemes, and every fix tried. The only
// structural difference between them is the element type - every marker in
// this file is an L.divIcon (a <div>), every default Leaflet tile is an
// <img>. Device evidence also showed the tiles were downloading fine and
// simply not painting (the no-tiles notice below stays silent, which only
// happens once Leaflet's tileload event has fired), so this is a rendering
// problem, not a fetch one. Rather than keep guessing which rule breaks
// <img> inside this particular map, draw tiles as the element type that is
// already proven to work here.
//
// L.GridLayer handles all the positioning/zoom/pruning; only tile creation
// is overridden. The Image() probe exists so this still reports real
// load/error state through GridLayer's own done() callback - that keeps the
// provider-failover and diagnostic logic below working unchanged, which a
// bare background-image (which fires no events) would have silently broken.
// Built lazily, never at module scope: js/map.js is parsed on page load but
// Leaflet is lazy-loaded on first map use, so a top-level L.GridLayer.extend()
// throws "L is not defined" on every page view - the same trap the
// GT_CORFU_BOUNDS_LATLNG comment above already calls out.
let gtDivTileLayerClass = null;
function gtGetDivTileLayerClass() {
    if (gtDivTileLayerClass) return gtDivTileLayerClass;
    gtDivTileLayerClass = L.GridLayer.extend({
        createTile: function (coords, done) {
            const tile = document.createElement('div');
            tile.className = 'gt-div-tile';
            const url = L.Util.template(this.options.tileUrl, {
                z: coords.z, x: coords.x, y: coords.y, s: 'a'
            });
            const probe = new Image();
            probe.onload = () => {
                tile.style.backgroundImage = 'url("' + url + '")';
                done(null, tile);
            };
            probe.onerror = () => done(new Error('tile load failed'), tile);
            probe.src = url;
            return tile;
        }
    });
    return gtDivTileLayerClass;
}

function gtAddTileLayerWithFallback(map, index) {
    index = index || 0;
    const provider = GT_TILE_PROVIDERS[index];
    // Out of providers: leave the last layer attached rather than stripping
    // the map bare, so markers still sit on *something* and the failure
    // reads as "tiles didn't load" instead of "the map is broken".
    if (!provider) return;

    const DivTileLayer = gtGetDivTileLayerClass();
    const layer = new DivTileLayer({
        tileUrl: provider.url,
        attribution: provider.attribution,
        maxZoom: provider.maxZoom
    });

    let errorCount = 0;
    let switched = false;
    layer.on('tileerror', () => {
        errorCount++;
        if (switched || errorCount < GT_TILE_ERROR_THRESHOLD) return;
        switched = true;
        const next = GT_TILE_PROVIDERS[index + 1];
        console.warn(`[map] tile provider "${provider.name}" failed (${errorCount} tile errors)` +
            (next ? `, falling back to "${next.name}"` : ' - no fallback provider left'));
        if (!next) return;
        map.removeLayer(layer);
        gtAddTileLayerWithFallback(map, index + 1);
    });

    // Tiles have now failed on a real device across two unrelated CDNs while
    // being impossible to reproduce from the dev environment (its egress
    // proxy blocks every tile host, so the map can never be exercised for
    // real here). This surfaces the diagnosis ON the map instead: if not one
    // tile has loaded a few seconds in, say so in place of an unexplained
    // blank rectangle, and include the facts needed to tell the causes apart
    // - which provider, whether a service worker is intercepting, and one
    // real failing URL - so a single screenshot answers it.
    let anyTileLoaded = false;
    layer.on('tileload', () => { anyTileLoaded = true; gtClearTileDiagnostic(map); });
    setTimeout(() => {
        // Two genuinely different failures look identical to a user (blank
        // map), so report which one this is rather than assuming:
        //   - nothing loaded  -> a fetch/provider problem
        //   - loaded but blank -> a rendering problem, and then the tile's
        //     own measured geometry/paint properties say which one, instead
        //     of another round of guess-fix-redeploy.
        const tile = map.getContainer().querySelector('.gt-div-tile');
        let painted = null;
        if (tile) {
            const cs = getComputedStyle(tile);
            const r = tile.getBoundingClientRect();
            painted = {
                box: Math.round(r.width) + '×' + Math.round(r.height),
                opacity: cs.opacity, visibility: cs.visibility, display: cs.display,
                maxWidth: cs.maxWidth, transform: cs.transform === 'none' ? 'none' : 'set',
                bg: cs.backgroundImage === 'none' ? 'none' : 'set'
            };
        }
        if (anyTileLoaded && painted && painted.box !== '0×0' && painted.opacity !== '0') return;
        gtShowTileDiagnostic(map, {
            provider: provider.name,
            errors: errorCount,
            loaded: anyTileLoaded,
            tilesInDom: map.getContainer().querySelectorAll('.gt-div-tile').length,
            painted: painted,
            swControlled: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
            sampleUrl: provider.url.replace('{z}', 10).replace('{x}', 570).replace('{y}', 400)
        });
    }, 6000);

    layer.addTo(map);
}

// Deliberately plain DOM over the map container rather than an L.Control:
// it has to be able to render even if Leaflet's own CSS never applied,
// which is one of the failure modes it exists to report on.
function gtTileDiagnosticEl(map, create) {
    const container = map.getContainer();
    let el = container.querySelector('.gt-tile-diagnostic');
    if (!el && create) {
        el = document.createElement('div');
        el.className = 'gt-tile-diagnostic';
        el.setAttribute('role', 'status');
        container.appendChild(el);
    }
    return el;
}
function gtShowTileDiagnostic(map, info) {
    const el = gtTileDiagnosticEl(map, true);
    if (!el) return;
    const p = info.painted;
    el.innerHTML = `<strong>${info.loaded ? 'האריחים נטענו אך לא מוצגים' : 'מפת הרקע לא נטענה'}</strong>` +
        `<span>ספק: ${escapeHtml(info.provider)} · שגיאות: ${info.errors} · ` +
        `אריחים ב-DOM: ${info.tilesInDom} · SW: ${info.swControlled ? 'פעיל' : 'לא'}</span>` +
        (p
            ? `<span dir="ltr">box ${escapeHtml(p.box)} · opacity ${escapeHtml(p.opacity)} · ` +
              `${escapeHtml(p.visibility)}/${escapeHtml(p.display)} · max-w ${escapeHtml(p.maxWidth)}</span>` +
              `<span dir="ltr">bg-image ${escapeHtml(p.bg)} · transform ${escapeHtml(p.transform)}</span>`
            : `<span>לא נמצא אריח ב-DOM</span>`) +
        `<span dir="ltr" style="word-break:break-all;opacity:.75;">${escapeHtml(info.sampleUrl)}</span>` +
        `<span>הסמנים והניווט פועלים כרגיל.</span>`;
    console.warn('[map] tile diagnostic', info);
}
function gtClearTileDiagnostic(map) {
    const el = gtTileDiagnosticEl(map, false);
    if (el) el.remove();
}

function gtCreateMap(elId, opts) {
    const destMap = (window.DESTINATION && window.DESTINATION.map) || {};
    const map = L.map(elId, Object.assign({
        scrollWheelZoom: false,
        maxBounds: L.latLngBounds(GT_CORFU_BOUNDS_LATLNG[0], GT_CORFU_BOUNDS_LATLNG[1]),
        maxBoundsViscosity: 0.7,
        minZoom: destMap.minZoom != null ? destMap.minZoom : 9
    }, opts || {})).setView(GT_CORFU_CENTER, destMap.defaultZoom != null ? destMap.defaultZoom : 10);

    gtAddTileLayerWithFallback(map);

    // Click-to-activate wheel zoom (see note 1 above).
    map.on('click focus', () => map.scrollWheelZoom.enable());
    map.on('mouseout blur', () => map.scrollWheelZoom.disable());

    return map;
}

// Attraction titles look like "27. מערות הים של פלאוקסטריצה 🚤" (a
// leading list index and a trailing emoji) - strip both for a clean
// marker popup label, matching how the other three categories' plain
// "name" field already reads.
function cleanAttractionTitle(title) {
    return title
        .replace(/^\d+\.\s*/, '')
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}‍]+$/gu, '')
        .trim();
}

// `indexStore` (Phase 4, batch 2): defaults to the module-level
// mapMarkerIndex used by the whole-island map on the old beaches tab, but
// the new Explore tab's map (see initExploreMap() below) needs its OWN
// index - its markers belong to a second, separate L.Map instance, and a
// Leaflet marker can only ever belong to one map at a time. Writing both
// maps' markers into the same mapMarkerIndex would let whichever map built
// its layer group last silently overwrite the other's entries (same
// layerKey + id), breaking showOnMap()/openCardFromMap() on the older map.
// `onTap` (Phase 4, batch 4): replaces the old marker.bindPopup(...) - a
// marker tap now calls onTap(item, layerKey) instead of opening a Leaflet
// popup, so the caller (initBeachMap/initExploreMap below) can route every
// tap through the shared selection-ring + .gt-sheet mechanism
// (gtOnMarkerTap()) instead of each map instance growing its own popup
// content. See that function's own comment for why a popup was replaced.
function buildLayerGroup(items, color, layerKey, indexStore, onTap) {
    indexStore = indexStore || mapMarkerIndex;
    // Use marker clustering when the plugin is available; fall back to a plain layer group otherwise
    const group = (typeof L.markerClusterGroup === 'function')
        ? L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => L.divIcon({
                html: `<div style="background:${color};color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);">${cluster.getChildCount()}</div>`,
                className: '',
                iconSize: [36, 36]
            })
        })
        : L.layerGroup();

    items.forEach(item => {
        if (item.lat == null || item.lon == null) return; // no matched coordinates - skip rather than a marker at (undefined, undefined)
        const marker = L.circleMarker([item.lat, item.lon], {
            radius: 7, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.9
        });
        if (onTap) marker.on('click', () => onTap(item, layerKey));
        group.addLayer(marker);
        indexStore[layerKey + '::' + item.id] = marker;
    });
    return group;
}

// Phase C2: initBeachMap() deleted — it built the map inside <section id="beaches">, now deleted.


// Marker popup -> jump back to the matching card in its tab. Every card
// (beaches/food/attractions/gems) carries data-id, so this is now a
// single reliable lookup instead of the old data-name/heading-text
// fallback that only worked for beaches.
function openCardFromMap(layerKey, id) {
    // Every category's legacy tab id equals its own key (see
    // window.DESTINATION.categories) - falls back to the first category if
    // layerKey is somehow unrecognized.
    const categories = (window.DESTINATION && window.DESTINATION.categories) || [];
    const tabId = categories.some(c => c.key === layerKey) ? layerKey : ((categories[0] && categories[0].key) || layerKey);
    switchTab(tabId, true);
    setTimeout(() => {
        const card = document.querySelector(`#${tabId} [data-id="${CSS.escape(id)}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('search-highlight');
            setTimeout(() => card.classList.remove('search-highlight'), 2000);
        }
    }, 60);
}

// Card -> highlight its marker on the map (opens map if needed, pans, selects
// it - pulsing ring + .gt-sheet, same as a direct tap on the pin).
// Phase C2: showOnMap() deleted — its only callers were the legacy cards (js/cards.js, deleted); Explore uses showOnExploreMap().


// Phase C2: updateMapLayers() deleted — it read the layer-* checkboxes inside the deleted #beaches.


// Per-day map button (the 🗺️ button on each itinerary day card). Used to
// just open the same whole-island map every day; now it actually filters
// to that day's stops when js/itinerary.js's getDayLocationMatches() can
// find any (matched by name against that day's own text - see the comment
// there for why), and falls back to the normal full-island view otherwise
// (e.g. Day 1/7, which are airport/hotel logistics with no mappable stops).
// Per-day map button (the 🗺️ button on each itinerary day card).
//
// Phase D: this used to open the *beaches* tab's map. That was the single
// hardest dependency blocking the retirement of the legacy tabs - the whole
// beach map (#beach-map, #beach-map-container, the layer-* checkboxes) lives
// inside <section id="beaches">, so deleting that section would have silently
// broken the 🗺️ button on every itinerary day. It now drives the Explore
// map, which since initExploreMap() above carries the same category layers
// AND the same hotel marker, so nothing is lost in the move.
function openDayMap(dayNum) {
    const matches = (typeof getDayLocationMatches === 'function') ? getDayLocationMatches(dayNum) : [];
    switchTab('explore', true);
    setTimeout(() => {
        const container = document.getElementById('explore-map-container');
        if (!container) return;
        const focusNow = () => focusMapOnDayLocations(matches);

        // On desktop (>=1024px) the split view already keeps the map open, so
        // toggling would *hide* it. Check the real state rather than assuming
        // the mobile default.
        if (container.style.display === 'none' || container.style.display === '') {
            toggleExploreMap();
            setTimeout(() => { if (!exploreMapInstance) setTimeout(focusNow, 300); else focusNow(); }, 150);
        } else if (!exploreMapInstance) {
            setTimeout(focusNow, 150);
        } else {
            focusNow();
        }
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
}

// Makes sure every matched location's layer is visible, then fits the view to
// just those markers (or falls back to the whole-island view when a day has
// no matches at all).
//
// Phase D note on a genuine conflict: Explore's category chip row is
// SINGLE-select, but a single itinerary day routinely spans categories (a
// beach, a taverna and a gem). The chip UI structurally cannot express that.
// setExploreMapCategories() however takes an ARRAY and tests it with
// .includes(), so the map layer already supports multi-category perfectly
// well - only the chip control is single-choice. Day focus therefore passes
// every matched category straight through, deliberately showing more on the
// map than the chip row claims. That divergence is announced (see below)
// rather than left silent, and any chip tap returns to normal single-category
// behaviour with no reset needed.
function focusMapOnDayLocations(matches) {
    if (!exploreMapInstance) return;
    if (!matches.length) {
        const destMap = (window.DESTINATION && window.DESTINATION.map) || {};
        exploreMapInstance.setView(GT_CORFU_CENTER, destMap.defaultZoom != null ? destMap.defaultZoom : 10);
        return;
    }

    const categories = Array.from(new Set(matches.map(m => m.category)));
    if (typeof setExploreMapCategories === 'function') setExploreMapCategories(categories);
    // A facet left active from earlier browsing would have narrowed these
    // groups to a subset (setExploreMapVisibleIds), which could hide the very
    // stops this day is about. Day focus answers "where am I going today",
    // so it clears that narrowing for the categories it is about to show.
    if (typeof setExploreMapVisibleIds === 'function') {
        categories.forEach(cat => setExploreMapVisibleIds(cat, null));
    }

    // The list below the map still shows only the chip's category, so say so.
    // Reuses the existing aria-live count element rather than adding a second
    // status region competing to announce over the first.
    const countEl = document.getElementById('explore-filter-count');
    if (countEl) countEl.textContent = `המפה מציגה ${matches.length} עצירות של היום הזה`;

    if (matches.length === 1) {
        exploreMapInstance.setView([matches[0].lat, matches[0].lon], 14, { animate: true });
    } else {
        const bounds = L.latLngBounds(matches.map(m => [m.lat, m.lon]));
        exploreMapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    const first = matches[0];
    const item = (((window.DESTINATION && window.DESTINATION.locations) || {})[first.category] || []).find(x => x.id === first.id);
    if (item) gtOnMarkerTap('explore', exploreMapInstance, exploreMarkerIndex, item, first.category);
}

window.openCardFromMap = openCardFromMap;
window.openDayMap = openDayMap;

// ============================================================================
// Phase 4, batch 4 — shared marker-selection mechanism.
//
// Both Leaflet instances below (beachMapInstance for the old
// beaches/food/attractions/gems tabs AND the itinerary day-view's 🗺️ button
// via openDayMap()/focusMapOnDayLocations(); exploreMapInstance for the
// Explore tab) stay two separate L.Map objects rather than one physically
// shared instance - full consolidation would mean moving a live
// Leaflet-owned DOM node between the #beaches tab-content and the #explore
// tab-content on every tab switch, which is the operation Leaflet itself
// warns is fragile (tile layers/panes/event handlers are wired to the
// container at construction time; moving the container out from under them
// and calling invalidateSize() after every relocation is a real source of
// blank/half-rendered tiles if timed wrong against tab-switch CSS
// transitions). Given the imminent trip and the small remaining time budget
// for this batch, this file instead does what the spec allows as a
// documented fallback: keep two instances, but make them behave IDENTICALLY
// by routing every marker tap through this one shared function
// (gtOnMarkerTap) instead of each instance growing its own popup/selection
// logic. A later batch can revisit physically merging them once there's
// room to test the DOM-relocation edge cases properly.
//
// gtOnMarkerTap() replaces the old marker.bindPopup(buildMarkerPopup(...)):
// a tap now (1) clears whichever marker was previously selected on THIS map
// instance (only one selected pin per map at a time), (2) shows a pulsing
// ring (.gt-marker-ring, css/design-system.css) in that pin's category
// color by moving one reusable L.circleMarker per map instance onto the
// tapped marker's latlng, and (3) opens a .gt-sheet with that place's
// details - the Explore tab's own richer sheet (js/explore.js
// openExploreSheet(), personal-tracking widget and all) when the tap
// happened on the Explore map, or a lighter shared sheet (#gt-map-sheet)
// built below when it happened on the beach map (old tabs / itinerary
// day-view), which links out to that same Explore sheet via one
// "open full card" action.
// ============================================================================
// Built from window.DESTINATION.categories rather than hardcoded per key -
// see gtCategoryColor() above for why `color` is deliberately absent (the
// selection ring reads the live --gt-cat-* token instead, so ring/pin/chip
// can never drift apart).
function gtBuildMapCategoryMeta() {
    const meta = {};
    ((window.DESTINATION && window.DESTINATION.categories) || []).forEach(cat => {
        meta[cat.key] = { label: cat.label, icon: cat.emoji, tag: cat.tag };
    });
    return meta;
}
const GT_MAP_CATEGORY_META = gtBuildMapCategoryMeta();

// Straight-line distance in km from the hotel (same coordinates as the
// hotel marker built by gtBuildHotelLayer() above) to a location record -
// real geometry from real coordinates, not a fabricated "X min away" estimate.
const gtHomeBase = (window.DESTINATION && window.DESTINATION.map && window.DESTINATION.map.homeBase) || {};
const GT_HOTEL_LATLNG = [gtHomeBase.lat, gtHomeBase.lon];
function gtHaversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// One reusable selection-ring layer + "currently selected" key per map
// instance (keyed by mapName: 'beach' | 'explore') - never a new ring
// layer per tap, and clearing the previous selection is just moving/hiding
// this same layer rather than tracking-and-removing per-marker state.
const gtMapSelection = {
    beach: { ring: null, key: null },
    explore: { ring: null, key: null },
    home: { ring: null, key: null }
};

function gtOnMarkerTap(mapName, mapInstance, markerIndex, item, layerKey) {
    const marker = markerIndex[layerKey + '::' + item.id];
    if (!marker || !mapInstance) return;
    const ctx = gtMapSelection[mapName];

    if (!ctx.ring) {
        ctx.ring = L.circleMarker([0, 0], {
            radius: 14, weight: 3, fillOpacity: 0, className: 'gt-marker-ring', interactive: false
        });
    }
    const meta = GT_MAP_CATEGORY_META[layerKey];
    ctx.ring.setLatLng(marker.getLatLng());
    ctx.ring.setStyle({ color: gtCategoryColor(layerKey) });
    if (!mapInstance.hasLayer(ctx.ring)) ctx.ring.addTo(mapInstance);
    ctx.key = layerKey + '::' + item.id;

    if (mapName === 'explore') {
        // Same item, richer existing sheet - no second content-building path.
        if (typeof openExploreSheet === 'function') openExploreSheet(layerKey, item.id);
    } else {
        // 'beach' (old beaches/food/attractions/gems tabs + itinerary
        // day-view) and 'home' (Home tab's own map, Phase D sub-step 1)
        // both share this one lighter sheet - remember which of the two
        // opened it so gtCloseMapSheet() below clears the right map's
        // selection ring instead of always assuming 'beach'.
        gtMapSheetOpenerName = mapName;
        gtOpenMapSheet(layerKey, item);
    }
}

// Clears the pulsing ring for one map instance (called before a fresh
// gtOnMarkerTap on the SAME instance selects a new marker, and when either
// sheet is closed without picking a new pin).
function gtClearMapSelection(mapName) {
    const ctx = gtMapSelection[mapName];
    if (!ctx || !ctx.ring) return;
    // Only 'explore' and 'home' are ever passed (verified across every
    // gtOnMarkerTap() call site); anything else has no live instance.
    const mapInstance = mapName === 'explore' ? exploreMapInstance : mapName === 'home' ? homeMapInstance : null;
    if (mapInstance && mapInstance.hasLayer(ctx.ring)) mapInstance.removeLayer(ctx.ring);
    ctx.key = null;
}

// The lighter shared sheet (#gt-map-sheet, index.html) used by the beach
// map (old beaches/food/attractions/gems tabs + the itinerary day-view's
// 🗺️ button) - name, category chip, verified/closed-today status badge
// (reuses js/explore.js's exploreStatusBadge() - same honesty rules, not a
// second copy), distance from the hotel, a "נווט" directions link, and an
// "open full card" action that switches to Explore and opens the exact
// same item's full detail sheet there.
let gtMapSheetTriggerEl = null;
// Which map instance most recently opened this shared sheet ('explore' or
// 'home' - see gtOnMarkerTap() above). The initial 'beach' is now just a
// sentinel meaning "no map has opened it yet": the #beaches map was deleted
// in Phase C2, so nothing ever sets this back to that value. Left as-is
// rather than retuned because gtMapSelection has no 'beach' entry either,
// so every lookup on it correctly finds nothing.
let gtMapSheetOpenerName = 'beach';
function gtOpenMapSheet(layerKey, item) {
    const sheet = document.getElementById('gt-map-sheet');
    const backdrop = document.getElementById('gt-map-sheet-backdrop');
    const titleEl = document.getElementById('gt-map-sheet-title');
    const bodyEl = document.getElementById('gt-map-sheet-body');
    if (!sheet || !backdrop || !titleEl || !bodyEl) return;

    const meta = GT_MAP_CATEGORY_META[layerKey] || {};
    const name = item.name || cleanAttractionTitle(item.title || '');
    const status = (typeof exploreStatusBadge === 'function') ? exploreStatusBadge(item) : null;
    const distanceKm = (item.lat != null && item.lon != null)
        ? gtHaversineKm(GT_HOTEL_LATLNG[0], GT_HOTEL_LATLNG[1], item.lat, item.lon)
        : null;

    titleEl.textContent = name;
    sheet.setAttribute('data-sheet-loc-cat', layerKey);
    sheet.setAttribute('data-sheet-loc-id', item.id);

    const directionsBtn = item.mapsUrl
        ? `<a href="${escapeAttr(item.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="gt-btn gt-btn--secondary">📍 נווט</a>`
        : '';
    const openFullBtn = `<button type="button" class="gt-btn gt-btn--primary" onclick="gtOpenFullCardFromMapSheet('${escapeAttr(layerKey)}','${escapeAttr(item.id)}')">📇 פתח כרטיס מלא</button>`;

    bodyEl.innerHTML = `
      <div class="gt-row-card__meta" style="margin-bottom:var(--gt-space-2);">
        <span class="gt-cat-${meta.tag}-bg" style="padding:2px 8px;border-radius:var(--gt-r-full);font-weight:700;">${meta.icon || ''} ${meta.label || ''}</span>
        ${status ? `<span class="sep">·</span><span class="gt-status ${status.cls}">${status.label}</span>` : ''}
        ${distanceKm != null ? `<span class="sep">·</span><span class="gt-tabular">${distanceKm.toFixed(1)} ק"מ מהמלון</span>` : ''}
      </div>
      <div class="gt-explore-sheet-actions">${directionsBtn}${openFullBtn}</div>`;

    // Only remember the pre-open trigger the first time this sheet actually
    // opens - a second gtOnMarkerTap() on a different pin while it's already
    // showing re-runs this same function with new content, and must not
    // overwrite the original trigger with the sheet's own close button.
    const wasHidden = sheet.classList.contains('hidden');
    if (wasHidden) gtMapSheetTriggerEl = document.activeElement;
    backdrop.classList.remove('hidden');
    sheet.classList.remove('hidden');
    document.body.classList.add('modal-open');
    // Move focus into the sheet every time (fresh open, or a new marker's
    // content swapped in while already open) - this is what actually
    // surfaces the content change to screen reader / keyboard users, since
    // the title/body just above are plain text with no aria-live wrapper.
    const closeBtn = sheet.querySelector('.gt-map-sheet-close');
    if (closeBtn) closeBtn.focus();
}

function gtCloseMapSheet() {
    const sheet = document.getElementById('gt-map-sheet');
    const backdrop = document.getElementById('gt-map-sheet-backdrop');
    if (sheet) { sheet.classList.add('hidden'); sheet.removeAttribute('data-sheet-loc-id'); }
    if (backdrop) backdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
    gtClearMapSelection(gtMapSheetOpenerName || 'beach');
    if (gtMapSheetTriggerEl) gtMapSheetTriggerEl.focus();
}
window.gtCloseMapSheet = gtCloseMapSheet;
window.gtClearMapSelection = gtClearMapSelection;

// Escape closes the sheet, and Tab/Shift+Tab are trapped inside it while
// it's open - same convention as the existing emergency modal (js/ui.js).
document.addEventListener('keydown', (e) => {
    const sheet = document.getElementById('gt-map-sheet');
    if (!sheet || sheet.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
        gtCloseMapSheet();
        return;
    }

    if (e.key === 'Tab') {
        const focusable = sheet.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
});

// "open full card" action from the shared map sheet: jump to Explore (where
// every category's full, richer detail sheet already lives) and open the
// exact same item there. Falls back to the old accordion card
// (openCardFromMap) only if Explore's sheet is somehow unavailable.
function gtOpenFullCardFromMapSheet(layerKey, id) {
    gtCloseMapSheet();
    if (typeof switchTab === 'function') switchTab('explore', true);
    setTimeout(() => {
        if (typeof renderExploreTab === 'function') renderExploreTab();
        if (typeof openExploreSheet === 'function') { openExploreSheet(layerKey, id); return; }
        if (typeof openCardFromMap === 'function') openCardFromMap(layerKey, id);
    }, 80);
}
window.gtOpenFullCardFromMapSheet = gtOpenFullCardFromMapSheet;

// ============================================================================
// Phase 4, batch 2 — the Explore tab's map (js/explore.js).
//
// A second, independent Leaflet instance rather than reusing beachMapInstance:
// the old #beaches tab (kept as a hidden fallback, per the redesign's own
// rule) still owns the original #beach-map DOM node, and that node stays
// display:none whenever Explore is the active tab - a Leaflet map can't
// usefully live inside a hidden container shared across two different
// tab-content sections. Every marker/layer-group this builds reuses the
// exact same buildLayerGroup() helper as the original map above (just
// pointed at exploreMarkerIndex, see the `indexStore` param, and its own
// onTap callback routed through the shared gtOnMarkerTap() above), so there
// is exactly one place that knows how to turn a CORFU_LOCATIONS record into
// a marker, and exactly one place that knows what a marker tap does - not
// two competing copies of either.
// ============================================================================
let exploreMapInstance = null;
let exploreMapLayerGroups = {};
const exploreMarkerIndex = {};

function initExploreMap() {
    // Same stale-guard hazard as initHomeMap(): both callers below check
    // `!exploreMapInstance` BEFORE loadLeafletThen() resolves, so two rapid
    // entries (ensureExploreMapVisible then toggleExploreMap) can both pass
    // that check and both queue an init. Re-initialising a Leaflet container
    // throws. No caller depends on re-initialisation — they all guard on the
    // instance being absent — so returning early is safe.
    if (exploreMapInstance) return;
    if (typeof L === 'undefined') {
        const el = document.getElementById('explore-map');
        if (el) el.innerHTML = '<p class="text-center gt-text-500 p-10">לא ניתן לטעון את המפה כרגע (חיבור אינטרנט נדרש).</p>';
        return;
    }
    exploreMapInstance = gtCreateMap('explore-map');

    const onTap = (item, layerKey) => gtOnMarkerTap('explore', exploreMapInstance, exploreMarkerIndex, item, layerKey);
    gtBuildCategoryLayers(exploreMapLayerGroups, exploreMarkerIndex, onTap);

    // Phase D: the hotel marker was on the Home and beaches maps but never
    // here - the one thing the Explore map was missing before it could take
    // over as the canonical "find a place" map. Same marker, same helper,
    // same Gouvia coordinates. It is added unconditionally and is NOT part
    // of setExploreMapCategories()'s four-category loop, so a category chip
    // can never switch off "where we are staying" - the one pin you always
    // want as a reference point when judging how far away something is.
    exploreMapLayerGroups.hotel = gtBuildHotelLayer();
    exploreMapLayerGroups.hotel.addTo(exploreMapInstance);

    // Show whatever the category chips are currently filtering to (js/explore.js) -
    // the map's visible pins and the list below it are one shared state, not
    // two filters that can drift.
    const allCategoryKeys = ((window.DESTINATION && window.DESTINATION.categories) || []).map(c => c.key);
    const active = (typeof getExploreActiveCategories === 'function') ? getExploreActiveCategories() : allCategoryKeys;
    setExploreMapCategories(active);
}

// Desktop split-view support (1024px+, see .gt-explore's own min-width:1024px
// rule in css/design-system.css): that layout wants the map permanently
// visible beside the list, not behind the (now CSS-hidden) toggle button -
// but #explore-map-container still carries its mobile-only inline
// style="display:none" (index.html), which no CSS media query can override
// on its own (inline style always wins over a class selector). This is the
// one bit of real JS the desktop split-view mode needs: show the container
// (if not already) and init/resize the same Leaflet map toggleExploreMap()
// below already knows how to build - no new map feature, just triggering
// the existing one without requiring a click. Called from switchTab()
// (js/ui.js) on every visit to #explore, and from the matchMedia listener
// in js/explore.js when the viewport crosses into/out of the desktop range
// while #explore is already the active tab.
function ensureExploreMapVisible() {
    const container = document.getElementById('explore-map-container');
    if (!container) return;
    if (container.style.display === 'none' || container.style.display === '') {
        container.style.display = 'block';
    }
    if (!exploreMapInstance) {
        loadLeafletThen(() => setTimeout(initExploreMap, 50));
    } else {
        setTimeout(() => exploreMapInstance.invalidateSize(), 50);
    }
}
window.ensureExploreMapVisible = ensureExploreMapVisible;

function toggleExploreMap() {
    const container = document.getElementById('explore-map-container');
    const btn = document.getElementById('explore-map-toggle-btn');
    if (!container) return;
    const isHidden = container.style.display === 'none';

    container.style.display = isHidden ? 'block' : 'none';
    if (btn) btn.innerHTML = isHidden ? `${GT_ICON_MAP} הסתר את המפה` : `${GT_ICON_MAP} הצג מפה`;

    if (isHidden && !exploreMapInstance) {
        loadLeafletThen(() => setTimeout(initExploreMap, 50));
    } else if (isHidden && exploreMapInstance) {
        setTimeout(() => exploreMapInstance.invalidateSize(), 50);
    }
}

// Same add/remove-layer pattern as updateMapLayers() above, driven by the
// Explore tab's category chips instead of checkboxes.
function setExploreMapCategories(activeCategories) {
    if (!exploreMapInstance) return;
    const categoryKeys = ((window.DESTINATION && window.DESTINATION.categories) || []).map(c => c.key);
    categoryKeys.forEach(key => {
        const group = exploreMapLayerGroups[key];
        if (!group) return;
        const shouldShow = activeCategories.includes(key);
        if (shouldShow && !exploreMapInstance.hasLayer(group)) {
            group.addTo(exploreMapInstance);
        } else if (!shouldShow && exploreMapInstance.hasLayer(group)) {
            exploreMapInstance.removeLayer(group);
        }
    });
}

// Per-MARKER filtering, as opposed to setExploreMapCategories() above, which
// only switches whole layer groups on and off.
//
// Bug fix: the Phase A facet chips ("משפחתי", "€€", ...) filtered the list but
// not the map, because group-level toggling is too coarse to express "these 9
// of 28 beaches". That was originally noted as a known limitation and
// explained in the count text - which was the wrong call. From the user's
// side there is no visible difference between "this control does not affect
// the map by design" and "this control is broken": you tap a chip, the list
// changes, the map does not, and you reasonably conclude it failed.
//
// Rebuilding is safe because exploreMarkerIndex owns the marker objects
// independently of any group - clearLayers() empties the group but never
// destroys a marker, so markers are re-added on the next call rather than
// rebuilt. Both L.markerClusterGroup and the plain L.layerGroup fallback in
// buildLayerGroup() support clearLayers()/addLayer(), so this works with or
// without the clustering plugin.
//
// Pass null/undefined for visibleIds to mean "no facet active, show all".
function setExploreMapVisibleIds(catKey, visibleIds) {
    if (!exploreMapInstance) return;
    const group = exploreMapLayerGroups[catKey];
    if (!group || typeof group.clearLayers !== 'function') return;

    const all = ((window.DESTINATION && window.DESTINATION.locations) || {})[catKey] || [];
    const show = visibleIds ? new Set(visibleIds) : null;

    group.clearLayers();
    all.forEach(item => {
        if (show && !show.has(item.id)) return;
        const marker = exploreMarkerIndex[catKey + '::' + item.id];
        // A location with no coordinates never got a marker (buildLayerGroup
        // skips those rather than placing one at undefined/undefined), so a
        // missing entry here is expected, not an error.
        if (marker) group.addLayer(marker);
    });
}
window.setExploreMapVisibleIds = setExploreMapVisibleIds;

// Row card's 🗺️ button -> reveal the Explore map (opening it if needed) and
// focus/select that one item (pulsing ring + its full detail sheet).
// Mirrors showOnMap() above.
function showOnExploreMap(layerKey, id) {
    const container = document.getElementById('explore-map-container');
    if (!container) return;
    const openMapAndFocus = () => {
        const marker = exploreMarkerIndex[layerKey + '::' + id];
        const group = exploreMapLayerGroups[layerKey];
        if (!marker || !exploreMapInstance) return;
        const selectIt = () => {
            const item = (((window.DESTINATION && window.DESTINATION.locations) || {})[layerKey] || []).find(x => x.id === id);
            if (item) gtOnMarkerTap('explore', exploreMapInstance, exploreMarkerIndex, item, layerKey);
        };
        if (group && typeof group.zoomToShowLayer === 'function') {
            group.zoomToShowLayer(marker, selectIt);
        } else {
            exploreMapInstance.setView(marker.getLatLng(), 14, { animate: true });
            selectIt();
        }
    };

    if (container.style.display === 'none') {
        toggleExploreMap();
        setTimeout(() => {
            if (!exploreMapInstance) { setTimeout(openMapAndFocus, 300); } else { openMapAndFocus(); }
        }, 150);
    } else if (!exploreMapInstance) {
        setTimeout(openMapAndFocus, 150);
    } else {
        openMapAndFocus();
    }
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.toggleExploreMap = toggleExploreMap;
window.setExploreMapCategories = setExploreMapCategories;
window.showOnExploreMap = showOnExploreMap;

// ============================================================================
// Phase D, sub-step 1 — the Home tab's own map ("מפה" in the bottom nav).
//
// A THIRD independent Leaflet instance, not a physical reuse of
// beachMapInstance/exploreMapInstance: the comment on gtMapSelection above
// already documents why those two stay separate L.Map objects instead of
// one instance relocated between tab-content sections (Leaflet's own
// warning that tile layers/panes/handlers are wired to the container at
// construction time, and the real risk of blank/half-rendered tiles from
// moving that container across a tab switch). That reasoning holds for a
// third tab exactly as it did for the second, so this follows the same
// documented fallback instead of attempting the relocation: its own
// #home-map container/instance, built with the exact same buildLayerGroup()
// helper as the other two (pointed at homeMarkerIndex), with every marker
// tap still routed through the one shared gtOnMarkerTap() - so there is
// still exactly one place that knows what a marker tap does, now shared
// across three map instances instead of two. Shows every category (not
// filtered, unlike Explore's chip-driven map) plus the hotel marker, same
// as the old beach map - Home's whole point is "the state of the trip at a
// glance", not a filtered subset.
// ============================================================================
let homeMapInstance = null;
let homeMapLayerGroups = { hotel: null };
const homeMarkerIndex = {};

function initHomeMap() {
    // Guarded HERE, not only in gtActivateHomeMap(), because the caller's
    // `if (!homeMapInstance)` check is stale by the time this runs.
    // js/ui.js calls gtActivateHomeMap() twice on every Home-tab entry — once
    // immediately and again after a double requestAnimationFrame, to re-run
    // invalidateSize() once layout has settled. While Leaflet is still loading
    // homeMapInstance is null on BOTH calls, so both chain their own
    // .then(callback) onto the same leafletLoadPromise; when it resolves,
    // initHomeMap() runs twice and the second L.map('home-map') threw
    // "Map container is already initialized". Reproduced 3/3, and real CDN
    // latency on hotel wifi only widens the window.
    if (homeMapInstance) return;
    if (typeof L === 'undefined') {
        const el = document.getElementById('home-map');
        if (el) el.innerHTML = '<p class="text-center gt-text-500 p-10">לא ניתן לטעון את המפה כרגע (חיבור אינטרנט נדרש).</p>';
        return;
    }
    homeMapInstance = gtCreateMap('home-map');

    const onTap = (item, layerKey) => gtOnMarkerTap('home', homeMapInstance, homeMarkerIndex, item, layerKey);
    gtBuildCategoryLayers(homeMapLayerGroups, homeMarkerIndex, onTap);

    // Same hotel marker as initBeachMap() above (same coordinates, same
    // fallback label logic) - Home is the one tab where "where am I
    // staying" belongs front and center, alongside every category.
    homeMapLayerGroups.hotel = gtBuildHotelLayer();

    // Every category on by default (Home shows the whole trip, not a
    // filtered subset) plus the hotel marker.
    ((window.DESTINATION && window.DESTINATION.categories) || []).forEach(cat => {
        const group = homeMapLayerGroups[cat.key];
        if (group) group.addTo(homeMapInstance);
    });
    homeMapLayerGroups.hotel.addTo(homeMapInstance);
}

// Called every time the Home tab becomes the active tab (js/ui.js
// switchTab()) - lazy-loads Leaflet + builds the map on first activation
// only (same guard pattern as toggleBeachMap()/toggleExploreMap()), and
// just re-measures the container on every activation after that, since a
// Leaflet map built while its container was display:none needs
// invalidateSize() once that container is actually shown at real
// dimensions, or its tiles render into the wrong area.
// The Explore detail sheet's "במפה" button -> leave Explore entirely and hand
// the user the full-screen Map tab ("מפה" in the bottom nav, tab id `home`),
// centered on that one place with its pin selected.
//
// Deliberately NOT showOnExploreMap(): that one focuses the Explore tab's own
// inline map, and its gtOnMarkerTap('explore') re-opens the very detail sheet
// the button had just closed - so the panel looked stuck open and the bottom
// nav never moved. Routing to the home map's own instance means the sheet
// stays closed and the lighter shared map sheet takes over instead.
//
// Structurally a third sibling of showOnMap()/showOnExploreMap() rather than a
// shared abstraction over all three: those two must reveal a collapsed
// container inside the *current* tab (toggleBeachMap/toggleExploreMap), while
// this one changes tabs and defers the build to switchTab(). The only genuinely
// common part is the zoomToShowLayer-or-setView tail, which is four lines -
// not enough to justify reshaping two functions other call sites depend on.
function showOnHomeMap(layerKey, id) {
    const item = (((window.DESTINATION && window.DESTINATION.locations) || {})[layerKey] || []).find(x => x.id === id);
    if (!item) return;

    // switchTab() (js/ui.js) owns both the nav button's active state and the
    // home map's lazy build / invalidateSize() - going through it is what makes
    // the "מפה" nav button light up, so never hand-roll that state here.
    switchTab('home', true);

    // The tab switch above only *starts* the work: #home stays display:none
    // until switchTab()'s own 10ms timer, Leaflet may still be loading from the
    // CDN on a first visit, and initHomeMap() runs 50ms after that resolves.
    // Leaflet can't pan/zoom correctly against a container it has never
    // measured at real dimensions, so poll until the instance and its marker
    // genuinely exist instead of firing setView at a hidden container and
    // landing off-centre. Same wait-then-focus shape as showOnMap() above.
    let attempts = 0;
    const maxAttempts = 40; // ~5s, then give up quietly - initHomeMap() already paints its own "map unavailable" message when Leaflet never loads
    const tryFocus = () => {
        const marker = homeMarkerIndex[layerKey + '::' + id];
        if (!homeMapInstance || !marker) {
            if (++attempts <= maxAttempts) setTimeout(tryFocus, 120);
            return;
        }
        // The container was hidden (or a different size) when the map was last
        // laid out; re-measure before centering, or Leaflet centers against the
        // stale size and the pin ends up off to one side. Cheap and idempotent,
        // so doing it here rather than relying on gtActivateHomeMap()'s own
        // 50ms invalidateSize() timer removes the ordering race entirely.
        homeMapInstance.invalidateSize();

        const group = homeMapLayerGroups[layerKey];
        const selectIt = () => gtOnMarkerTap('home', homeMapInstance, homeMarkerIndex, item, layerKey);
        // zoomToShowLayer un-clusters and pans correctly while clustering is
        // active; plain setView is the fallback when it isn't.
        if (group && typeof group.zoomToShowLayer === 'function') {
            group.zoomToShowLayer(marker, selectIt);
        } else {
            homeMapInstance.setView(marker.getLatLng(), 14, { animate: true });
            selectIt();
        }
    };
    setTimeout(tryFocus, 120);
}
window.showOnHomeMap = showOnHomeMap;

function gtActivateHomeMap() {
    const el = document.getElementById('home-map');
    if (!el) return;
    if (!homeMapInstance) {
        loadLeafletThen(() => setTimeout(initHomeMap, 50));
    } else {
        setTimeout(() => homeMapInstance.invalidateSize(), 50);
    }
}
window.gtActivateHomeMap = gtActivateHomeMap;

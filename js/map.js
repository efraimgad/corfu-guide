// Interactive map of all beaches/food/attractions/gems - built from
// window.CORFU_LOCATIONS (js/locations-data.js), the same data source
// that renders the cards themselves (js/cards.js), instead of four
// separate hardcoded arrays that could silently drift out of sync with
// the cards. Markers are keyed by data-id rather than by Hebrew display
// name, so a card and its marker can never mismatch on a name typo.

let beachMapInstance = null;
let mapLayerGroups = { beaches: null, food: null, attractions: null, gems: null };

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
    leafletLoadPromise.then(callback).catch(() => callback()); // initBeachMap already shows a friendly fallback if L is still undefined
}

function toggleBeachMap() {
    const container = document.getElementById('beach-map-container');
    const btn = document.getElementById('map-toggle-btn');
    const isHidden = container.style.display === 'none';

    container.style.display = isHidden ? 'block' : 'none';
    btn.innerHTML = isHidden ? `${GT_ICON_MAP} הסתר את המפה` : `${GT_ICON_MAP} הצג מפה מאוחדת של כל האי (חופים, מסעדות, אטרקציות)`;

    if (isHidden && !beachMapInstance) {
        loadLeafletThen(() => setTimeout(initBeachMap, 50));
    } else if (isHidden && beachMapInstance) {
        setTimeout(() => beachMapInstance.invalidateSize(), 50);
    }
}

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
const GT_CAT_FALLBACK = {
    beaches: '#2160eb', food: '#bb460a', attractions: '#9230ea', gems: '#047b56'
};
let gtCatColorCache = null;
function gtCategoryColor(layerKey) {
    if (!gtCatColorCache) {
        const cs = getComputedStyle(document.documentElement);
        const read = (name, fallback) => (cs.getPropertyValue(name) || '').trim() || fallback;
        gtCatColorCache = {
            beaches:     read('--gt-cat-beach', GT_CAT_FALLBACK.beaches),
            food:        read('--gt-cat-food', GT_CAT_FALLBACK.food),
            attractions: read('--gt-cat-attraction', GT_CAT_FALLBACK.attractions),
            gems:        read('--gt-cat-gem', GT_CAT_FALLBACK.gems)
        };
    }
    return gtCatColorCache[layerKey] || GT_CAT_FALLBACK[layerKey] || '#2160eb';
}

// Builds all four category layer groups for one map instance. Replaces the
// four near-identical buildLayerGroup() calls that were copy-pasted into
// each of initBeachMap/initExploreMap/initHomeMap.
function gtBuildCategoryLayers(groups, indexStore, onTap) {
    const locations = window.CORFU_LOCATIONS || { beaches: [], food: [], attractions: [], gems: [] };
    ['beaches', 'food', 'attractions', 'gems'].forEach(key => {
        groups[key] = buildLayerGroup(locations[key] || [], gtCategoryColor(key), key, indexStore, onTap);
    });
    return groups;
}

// The single "home base" marker, previously duplicated verbatim in
// initBeachMap() and initHomeMap().
function gtBuildHotelLayer() {
    const hotelIcon = L.divIcon({
        html: '<div style="background:#e11d48;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"><span style="transform:rotate(45deg);font-size:14px;">🏨</span></div>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    const hotelName = (window.DEFAULT_HOTEL && window.DEFAULT_HOTEL.name) || 'המלון שלכם';
    return L.layerGroup([
        L.marker([39.6500, 19.8520], { icon: hotelIcon, title: hotelName, alt: hotelName, keyboard: true }).bindPopup(
            `<strong>${escapeHtml(hotelName)}</strong><br>גוביה (Gouvia) - מקום הלינה שלכם<br>` +
            `<a href="https://maps.google.com/?q=${encodeURIComponent(hotelName + ' Gouvia Corfu')}" target="_blank" rel="noopener noreferrer">📍 נווט לשם</a>`
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
const GT_CORFU_CENTER = [39.62, 19.85];
// Bounds are built INSIDE gtCreateMap(), not at module scope: js/map.js is
// parsed on page load but Leaflet is lazy-loaded on first map use, so any
// top-level reference to `L` throws "L is not defined" on every page view.
const GT_CORFU_BOUNDS_LATLNG = [[39.20, 19.30], [39.95, 20.40]];

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
function gtAddTileLayerWithFallback(map, index) {
    index = index || 0;
    const provider = GT_TILE_PROVIDERS[index];
    // Out of providers: leave the last layer attached rather than stripping
    // the map bare, so markers still sit on *something* and the failure
    // reads as "tiles didn't load" instead of "the map is broken".
    if (!provider) return;

    const layer = L.tileLayer(provider.url, {
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

    layer.addTo(map);
}

function gtCreateMap(elId, opts) {
    const map = L.map(elId, Object.assign({
        scrollWheelZoom: false,
        maxBounds: L.latLngBounds(GT_CORFU_BOUNDS_LATLNG[0], GT_CORFU_BOUNDS_LATLNG[1]),
        maxBoundsViscosity: 0.7,
        minZoom: 9
    }, opts || {})).setView(GT_CORFU_CENTER, 10);

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

function initBeachMap() {
    const host = document.getElementById('beach-map');
    if (!host) return;
    if (typeof L === 'undefined') {
        host.innerHTML = '<p class="text-center gt-text-500 p-10">לא ניתן לטעון את המפה כרגע (חיבור אינטרנט נדרש).</p>';
        return;
    }
    beachMapInstance = gtCreateMap('beach-map');

    const onTap = (item, layerKey) => gtOnMarkerTap('beach', beachMapInstance, mapMarkerIndex, item, layerKey);
    gtBuildCategoryLayers(mapLayerGroups, mapMarkerIndex, onTap);

    // A single distinct marker for the confirmed accommodation, styled
    // differently from the category dots so it stands out as "home base".
    // Coordinates are the village center (Gouvia), not a pinpoint street
    // address, since the exact property location hasn't been confirmed.
    mapLayerGroups.hotel = gtBuildHotelLayer();

    // Beaches + hotel layers on by default (matches checkbox defaults)
    mapLayerGroups.beaches.addTo(beachMapInstance);
    mapLayerGroups.hotel.addTo(beachMapInstance);
}

// Marker popup -> jump back to the matching card in its tab. Every card
// (beaches/food/attractions/gems) carries data-id, so this is now a
// single reliable lookup instead of the old data-name/heading-text
// fallback that only worked for beaches.
function openCardFromMap(layerKey, id) {
    const tabMap = { beaches: 'beaches', food: 'food', attractions: 'attractions', gems: 'gems' };
    const tabId = tabMap[layerKey] || 'attractions';
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
function showOnMap(layerKey, id) {
    const container = document.getElementById('beach-map-container');
    const openMapAndFocus = () => {
        const marker = mapMarkerIndex[layerKey + '::' + id];
        const group = mapLayerGroups[layerKey];
        if (!marker || !beachMapInstance) return;
        // Make sure the relevant layer is checked/visible
        const checkbox = document.getElementById('layer-' + layerKey);
        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            updateMapLayers();
        }
        const selectIt = () => {
            const item = ((window.CORFU_LOCATIONS || {})[layerKey] || []).find(x => x.id === id);
            if (item) gtOnMarkerTap('beach', beachMapInstance, mapMarkerIndex, item, layerKey);
        };
        // zoomToShowLayer handles un-clustering and panning correctly when clustering is active;
        // fall back to a plain setView otherwise.
        if (group && typeof group.zoomToShowLayer === 'function') {
            group.zoomToShowLayer(marker, selectIt);
        } else {
            beachMapInstance.setView(marker.getLatLng(), 14, { animate: true });
            selectIt();
        }
    };

    if (container.style.display === 'none') {
        toggleBeachMap();
        setTimeout(() => {
            if (!beachMapInstance) { setTimeout(openMapAndFocus, 300); } else { openMapAndFocus(); }
        }, 150);
    } else if (!beachMapInstance) {
        setTimeout(openMapAndFocus, 150);
    } else {
        openMapAndFocus();
    }
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateMapLayers() {
    if (!beachMapInstance) return;
    const layerConfig = [
        { checkboxId: 'layer-beaches', key: 'beaches' },
        { checkboxId: 'layer-food', key: 'food' },
        { checkboxId: 'layer-attractions', key: 'attractions' },
        { checkboxId: 'layer-gems', key: 'gems' },
        { checkboxId: 'layer-hotel', key: 'hotel' }
    ];
    layerConfig.forEach(({ checkboxId, key }) => {
        // Guarded: an absent checkbox used to throw a TypeError here and
        // abort the whole layer sync, leaving the map out of step with the
        // controls. A missing control now just means "leave that layer as is".
        const checkbox = document.getElementById(checkboxId);
        const group = mapLayerGroups[key];
        if (!checkbox || !group) return;
        const checked = checkbox.checked;
        if (checked && !beachMapInstance.hasLayer(group)) {
            group.addTo(beachMapInstance);
        } else if (!checked && beachMapInstance.hasLayer(group)) {
            beachMapInstance.removeLayer(group);
        }
    });
}

// Per-day map button (the 🗺️ button on each itinerary day card). Used to
// just open the same whole-island map every day; now it actually filters
// to that day's stops when js/itinerary.js's getDayLocationMatches() can
// find any (matched by name against that day's own text - see the comment
// there for why), and falls back to the normal full-island view otherwise
// (e.g. Day 1/7, which are airport/hotel logistics with no mappable stops).
function openDayMap(dayNum) {
    const matches = (typeof getDayLocationMatches === 'function') ? getDayLocationMatches(dayNum) : [];
    switchTab('beaches', true);
    setTimeout(() => {
        const container = document.getElementById('beach-map-container');
        const focusNow = () => focusMapOnDayLocations(matches);
        if (container.style.display === 'none') {
            toggleBeachMap();
            setTimeout(() => { if (!beachMapInstance) setTimeout(focusNow, 300); else focusNow(); }, 150);
        } else if (!beachMapInstance) {
            setTimeout(focusNow, 150);
        } else {
            focusNow();
        }
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
}

// Makes sure every matched location's layer is checked on, then fits the
// map's view to just those markers (or falls back to the default
// whole-island view when a day has no matches at all).
function focusMapOnDayLocations(matches) {
    if (!beachMapInstance) return;
    if (!matches.length) {
        beachMapInstance.setView([39.62, 19.85], 10);
        return;
    }

    const categories = Array.from(new Set(matches.map(m => m.category)));
    categories.forEach(category => {
        const checkbox = document.getElementById('layer-' + category);
        if (checkbox) checkbox.checked = true;
    });
    updateMapLayers();

    if (matches.length === 1) {
        beachMapInstance.setView([matches[0].lat, matches[0].lon], 14, { animate: true });
    } else {
        const bounds = L.latLngBounds(matches.map(m => [m.lat, m.lon]));
        beachMapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    const first = matches[0];
    const item = ((window.CORFU_LOCATIONS || {})[first.category] || []).find(x => x.id === first.id);
    if (item) gtOnMarkerTap('beach', beachMapInstance, mapMarkerIndex, item, first.category);
}

window.toggleBeachMap = toggleBeachMap;
window.openCardFromMap = openCardFromMap;
window.showOnMap = showOnMap;
window.updateMapLayers = updateMapLayers;
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
const GT_MAP_CATEGORY_META = {
    // No `color` here any more - the selection ring reads gtCategoryColor()
    // (the live --gt-cat-* token) so the ring, the pin and the legend chip
    // can never drift apart again. See gtCategoryColor() above.
    beaches: { label: 'חוף', icon: '🏖️', tag: 'beach' },
    food: { label: 'מסעדה', icon: '🍽️', tag: 'food' },
    attractions: { label: 'אטרקציה', icon: '📸', tag: 'attraction' },
    gems: { label: 'פנינה', icon: '💎', tag: 'gem' }
};

// Straight-line distance in km from the hotel (same coordinates as the
// hotel marker in initBeachMap() above) to a location record - real
// geometry from real coordinates, not a fabricated "X min away" estimate.
const GT_HOTEL_LATLNG = [39.6500, 19.8520];
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
    const mapInstance = mapName === 'explore' ? exploreMapInstance : mapName === 'home' ? homeMapInstance : beachMapInstance;
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
// Which map instance most recently opened this shared sheet ('beach' or
// 'home' - see gtOnMarkerTap() above) - defaults to 'beach' so nothing
// changes for the pre-Phase-D call sites that only ever pass that one.
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
let exploreMapLayerGroups = { beaches: null, food: null, attractions: null, gems: null };
const exploreMarkerIndex = {};

function initExploreMap() {
    if (typeof L === 'undefined') {
        const el = document.getElementById('explore-map');
        if (el) el.innerHTML = '<p class="text-center gt-text-500 p-10">לא ניתן לטעון את המפה כרגע (חיבור אינטרנט נדרש).</p>';
        return;
    }
    exploreMapInstance = gtCreateMap('explore-map');

    const onTap = (item, layerKey) => gtOnMarkerTap('explore', exploreMapInstance, exploreMarkerIndex, item, layerKey);
    gtBuildCategoryLayers(exploreMapLayerGroups, exploreMarkerIndex, onTap);

    // Show whatever the category chips are currently filtering to (js/explore.js) -
    // the map's visible pins and the list below it are one shared state, not
    // two filters that can drift.
    const active = (typeof getExploreActiveCategories === 'function') ? getExploreActiveCategories() : ['beaches', 'food', 'attractions', 'gems'];
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
    ['beaches', 'food', 'attractions', 'gems'].forEach(key => {
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
            const item = ((window.CORFU_LOCATIONS || {})[layerKey] || []).find(x => x.id === id);
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
let homeMapLayerGroups = { beaches: null, food: null, attractions: null, gems: null, hotel: null };
const homeMarkerIndex = {};

function initHomeMap() {
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
    homeMapLayerGroups.beaches.addTo(homeMapInstance);
    homeMapLayerGroups.food.addTo(homeMapInstance);
    homeMapLayerGroups.attractions.addTo(homeMapInstance);
    homeMapLayerGroups.gems.addTo(homeMapInstance);
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
    const item = ((window.CORFU_LOCATIONS || {})[layerKey] || []).find(x => x.id === id);
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

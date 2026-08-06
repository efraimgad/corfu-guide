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
            const addCss = (href, integrity) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.integrity = integrity;
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
            };
            addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css', 'sha384-c6Rcwz4e4CITMbu/NBmnNS8yN2sC3cUElMEMfP3vqqKFp7GOYaaBBCqmaWBjmkjb');
            addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css', 'sha384-pmjIAcz2bAn0xukfxADbZIb3t8oRT9Sv0rvO+BR5Csr6Dhqq+nZs59P0pPKQJkEV');
            addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css', 'sha384-wgw+aLYNQ7dlhK47ZPK7FRACiq7ROZwgFNg0m04avm4CaXS+Z9Y7nMu8yNjBKYC+');

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
                clusterScript.onerror = reject;
                document.head.appendChild(clusterScript);
            };
            leafletScript.onerror = reject;
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
    if (typeof L === 'undefined') {
        document.getElementById('beach-map').innerHTML = '<p class="text-center text-gray-400 p-10">לא ניתן לטעון את המפה כרגע (חיבור אינטרנט נדרש).</p>';
        return;
    }
    beachMapInstance = L.map('beach-map').setView([39.62, 19.85], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(beachMapInstance);

    const locations = window.CORFU_LOCATIONS || { beaches: [], food: [], attractions: [], gems: [] };
    const onTap = (item, layerKey) => gtOnMarkerTap('beach', beachMapInstance, mapMarkerIndex, item, layerKey);
    mapLayerGroups.beaches = buildLayerGroup(locations.beaches, '#2563eb', 'beaches', mapMarkerIndex, onTap);
    mapLayerGroups.food = buildLayerGroup(locations.food, '#ea580c', 'food', mapMarkerIndex, onTap);
    mapLayerGroups.attractions = buildLayerGroup(locations.attractions, '#9333ea', 'attractions', mapMarkerIndex, onTap);
    mapLayerGroups.gems = buildLayerGroup(locations.gems, '#059669', 'gems', mapMarkerIndex, onTap);

    // A single distinct marker for the confirmed accommodation, styled
    // differently from the category dots so it stands out as "home base".
    // Coordinates are the village center (Gouvia), not a pinpoint street
    // address, since the exact property location hasn't been confirmed.
    const hotelIcon = L.divIcon({
        html: '<div style="background:#e11d48;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"><span style="transform:rotate(45deg);font-size:14px;">🏨</span></div>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    // Hotel name comes from window.TRIP_PRIVATE (untracked, see .gitignore)
    // via DEFAULT_HOTEL in js/dashboard.js, falling back to a generic label
    // when it's absent - this committed build never ships the real name.
    const hotelName = (window.DEFAULT_HOTEL && window.DEFAULT_HOTEL.name) || 'המלון שלכם';
    mapLayerGroups.hotel = L.layerGroup([
        L.marker([39.6500, 19.8520], { icon: hotelIcon }).bindPopup(
            `<strong>${hotelName}</strong><br>גוביה (Gouvia) - מקום הלינה שלכם<br>` +
            `<a href="https://maps.google.com/?q=${encodeURIComponent(hotelName + ' Gouvia Corfu')}" target="_blank" style="color:#2563eb;">📍 נווט לשם</a>`
        )
    ]);

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
        const checked = document.getElementById(checkboxId).checked;
        const group = mapLayerGroups[key];
        if (!group) return;
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
    beaches: { label: 'חוף', icon: '🏖️', tag: 'beach', color: '#2563eb' },
    food: { label: 'מסעדה', icon: '🍽️', tag: 'food', color: '#ea580c' },
    attractions: { label: 'אטרקציה', icon: '📸', tag: 'attraction', color: '#9333ea' },
    gems: { label: 'פנינה', icon: '💎', tag: 'gem', color: '#059669' }
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
    ctx.ring.setStyle({ color: (meta && meta.color) || '#2563eb' });
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
        if (el) el.innerHTML = '<p class="text-center text-gray-400 p-10">לא ניתן לטעון את המפה כרגע (חיבור אינטרנט נדרש).</p>';
        return;
    }
    exploreMapInstance = L.map('explore-map').setView([39.62, 19.85], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(exploreMapInstance);

    const locations = window.CORFU_LOCATIONS || { beaches: [], food: [], attractions: [], gems: [] };
    const onTap = (item, layerKey) => gtOnMarkerTap('explore', exploreMapInstance, exploreMarkerIndex, item, layerKey);
    exploreMapLayerGroups.beaches = buildLayerGroup(locations.beaches, '#2563eb', 'beaches', exploreMarkerIndex, onTap);
    exploreMapLayerGroups.food = buildLayerGroup(locations.food, '#ea580c', 'food', exploreMarkerIndex, onTap);
    exploreMapLayerGroups.attractions = buildLayerGroup(locations.attractions, '#9333ea', 'attractions', exploreMarkerIndex, onTap);
    exploreMapLayerGroups.gems = buildLayerGroup(locations.gems, '#059669', 'gems', exploreMarkerIndex, onTap);

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
        if (el) el.innerHTML = '<p class="text-center text-gray-400 p-10">לא ניתן לטעון את המפה כרגע (חיבור אינטרנט נדרש).</p>';
        return;
    }
    homeMapInstance = L.map('home-map').setView([39.62, 19.85], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(homeMapInstance);

    const locations = window.CORFU_LOCATIONS || { beaches: [], food: [], attractions: [], gems: [] };
    const onTap = (item, layerKey) => gtOnMarkerTap('home', homeMapInstance, homeMarkerIndex, item, layerKey);
    homeMapLayerGroups.beaches = buildLayerGroup(locations.beaches, '#2563eb', 'beaches', homeMarkerIndex, onTap);
    homeMapLayerGroups.food = buildLayerGroup(locations.food, '#ea580c', 'food', homeMarkerIndex, onTap);
    homeMapLayerGroups.attractions = buildLayerGroup(locations.attractions, '#9333ea', 'attractions', homeMarkerIndex, onTap);
    homeMapLayerGroups.gems = buildLayerGroup(locations.gems, '#059669', 'gems', homeMarkerIndex, onTap);

    // Same hotel marker as initBeachMap() above (same coordinates, same
    // fallback label logic) - Home is the one tab where "where am I
    // staying" belongs front and center, alongside every category.
    const hotelIcon = L.divIcon({
        html: '<div style="background:#e11d48;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"><span style="transform:rotate(45deg);font-size:14px;">🏨</span></div>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    const hotelName = (window.DEFAULT_HOTEL && window.DEFAULT_HOTEL.name) || 'המלון שלכם';
    homeMapLayerGroups.hotel = L.layerGroup([
        L.marker([39.6500, 19.8520], { icon: hotelIcon }).bindPopup(
            `<strong>${hotelName}</strong><br>גוביה (Gouvia) - מקום הלינה שלכם<br>` +
            `<a href="https://maps.google.com/?q=${encodeURIComponent(hotelName + ' Gouvia Corfu')}" target="_blank" style="color:#2563eb;">📍 נווט לשם</a>`
        )
    ]);

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

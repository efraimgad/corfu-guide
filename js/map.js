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
    btn.textContent = isHidden ? '🗺️ הסתר את המפה' : '🗺️ הצג מפה מאוחדת של כל האי (חופים, מסעדות, אטרקציות)';

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

function buildLayerGroup(items, color, layerKey) {
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
        const name = item.name || cleanAttractionTitle(item.title);
        const marker = L.circleMarker([item.lat, item.lon], {
            radius: 7, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.9
        });
        marker.bindPopup(buildMarkerPopup(name, item.mapsUrl, item.id, layerKey));
        group.addLayer(marker);
        mapMarkerIndex[layerKey + '::' + item.id] = marker;
    });
    return group;
}

// Built as real DOM nodes (not an HTML string) so the "open card" link can
// use a proper addEventListener instead of an inline onclick with manual
// quote-escaping of the id.
function buildMarkerPopup(name, mapsUrl, id, layerKey) {
    const container = document.createElement('div');

    const strong = document.createElement('strong');
    strong.textContent = name;
    container.appendChild(strong);
    container.appendChild(document.createElement('br'));

    const navLink = document.createElement('a');
    navLink.href = mapsUrl;
    navLink.target = '_blank';
    navLink.style.color = '#2563eb';
    navLink.textContent = '📍 נווט לשם';
    container.appendChild(navLink);

    if (layerKey === 'beaches') {
        container.appendChild(document.createElement('br'));
        const openCardLink = document.createElement('a');
        openCardLink.href = '#';
        openCardLink.style.color = '#0d9488';
        openCardLink.textContent = '📇 פתח כרטיס';
        openCardLink.addEventListener('click', (e) => {
            e.preventDefault();
            openCardFromMap(layerKey, id);
        });
        container.appendChild(openCardLink);
    }

    return container;
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
    mapLayerGroups.beaches = buildLayerGroup(locations.beaches, '#2563eb', 'beaches');
    mapLayerGroups.food = buildLayerGroup(locations.food, '#ea580c', 'food');
    mapLayerGroups.attractions = buildLayerGroup(locations.attractions, '#9333ea', 'attractions');
    mapLayerGroups.gems = buildLayerGroup(locations.gems, '#059669', 'gems');

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
    mapLayerGroups.hotel = L.layerGroup([
        L.marker([39.6500, 19.8520], { icon: hotelIcon }).bindPopup(
            '<strong>Tessera Boutique Hotel & Villas</strong><br>גוביה (Gouvia) - מקום הלינה שלכם<br>' +
            '<a href="https://maps.google.com/?q=Tessera+Boutique+Hotel+%26+Villas+Gouvia+Corfu" target="_blank" style="color:#2563eb;">📍 נווט לשם</a>'
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

// Card -> highlight its marker on the map (opens map if needed, pans, opens popup)
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
        // zoomToShowLayer handles un-clustering and panning correctly when clustering is active;
        // fall back to a plain setView + openPopup if the cluster plugin isn't available.
        if (group && typeof group.zoomToShowLayer === 'function') {
            group.zoomToShowLayer(marker, () => marker.openPopup());
        } else {
            beachMapInstance.setView(marker.getLatLng(), 14, { animate: true });
            marker.openPopup();
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

window.toggleBeachMap = toggleBeachMap;
window.openCardFromMap = openCardFromMap;
window.showOnMap = showOnMap;
window.updateMapLayers = updateMapLayers;

// Interactive map of all beaches
const BEACH_LOCATIONS = [
    { name: "פלאוקסטריצה (Agios Spyridon)", lat: 39.6726, lon: 19.7011 },
    { name: "רוביניה (Rovinia)", lat: 39.6644, lon: 19.7214 },
    { name: "פורטו טימוני (Porto Timoni)", lat: 39.7208, lon: 19.6586 },
    { name: "אגיוס גאורגיוס פגון", lat: 39.7155, lon: 19.6738 },
    { name: "לוגאס - חוף השקיעה (Logas)", lat: 39.7942, lon: 19.6631 },
    { name: "תעלת האהבה (Canal d'Amour)", lat: 39.7963, lon: 19.6976 },
    { name: "סידארי (Sidari)", lat: 39.7915, lon: 19.7042 },
    { name: "ארילאס (Arillas)", lat: 39.7423, lon: 19.6508 },
    { name: "אגיוס סטפנוס צפון-מערב", lat: 39.7589, lon: 19.6465 },
    { name: "גליפאדה (Glyfada)", lat: 39.5937, lon: 19.8080 },
    { name: "פלקאס - קונטוגיאלוס", lat: 39.5866, lon: 19.8142 },
    { name: "מירטיוטיסה (Myrtiotissa)", lat: 39.5947, lon: 19.7997 },
    { name: "ארמונס (Ermones)", lat: 39.6105, lon: 19.7801 },
    { name: "ליאפדס - חוף גפירה (Liapades)", lat: 39.6698, lon: 19.7397 },
    { name: "איסוס (Issos)", lat: 39.4328, lon: 19.9366 },
    { name: "הליקונאס (Halikounas)", lat: 39.4623, lon: 19.8973 },
    { name: "מרתיאס (Marathias)", lat: 39.4180, lon: 20.0035 },
    { name: "גרדנוס (Gardenos)", lat: 39.3871, lon: 20.0340 },
    { name: "ארקודילאס (Arkoudilas)", lat: 39.3700, lon: 20.0850 },
    { name: "קאבוס (Kavos)", lat: 39.3860, lon: 20.1130 },
    { name: "ברבטי (Barbati)", lat: 39.7214, lon: 19.8665 },
    { name: "ניסאקי (Nissaki)", lat: 39.7258, lon: 19.8974 },
    { name: "מפרץ אגני (Agni)", lat: 39.7356, lon: 19.9272 },
    { name: "קלאמי (Kalami)", lat: 39.7431, lon: 19.9351 },
    { name: "קרסיה (Kerasia)", lat: 39.7565, lon: 19.9408 },
    { name: "קסיופי - בטאריה וקנוני", lat: 39.7946, lon: 19.9213 }
];

const FOOD_LOCATIONS = [
    { name: "מסעדת רקס (Rex)", lat: 39.6243, lon: 19.9217 },
    { name: "טולה גסטרונומיה", lat: 39.7394, lon: 19.9381 },
    { name: "הטברנה של מרינה", lat: 39.6210, lon: 19.9190 },
    { name: "ג'ורג' & אלנה טברנה", lat: 39.6240, lon: 19.9200 },
    { name: "קלימטריה", lat: 39.4600, lon: 19.9700 },
    { name: "אבלי (Avli)", lat: 39.6250, lon: 19.9210 },
    { name: "סלטו (Salto)", lat: 39.6230, lon: 19.9190 },
    { name: "הבית הלבן", lat: 39.7390, lon: 19.9380 },
    { name: "אקרוגיאלי", lat: 39.6700, lon: 19.7500 },
    { name: "בוקארי ביץ'", lat: 39.4400, lon: 19.9800 },
    { name: "גיאלוס", lat: 39.7500, lon: 19.9000 },
    { name: "א-מנו (A Mano)", lat: 39.6235, lon: 19.9215 },
    { name: "קפטן אוקטופוס", lat: 39.4600, lon: 19.9600 },
    { name: "טברנת קראסיה", lat: 39.7500, lon: 19.9300 },
    { name: "טרילוגיה", lat: 39.7600, lon: 19.9200 },
    { name: "הבאר הוונציאנית", lat: 39.6240, lon: 19.9200 },
    { name: "לה פמיליה", lat: 39.6250, lon: 19.9210 },
    { name: "מוראג'יה (Mouragia)", lat: 39.6260, lon: 19.9240 },
    { name: "נוליטה (Nolita)", lat: 39.6238, lon: 19.9218 },
    { name: "פסטה איטליאנה", lat: 39.6500, lon: 19.9000 },
    { name: "נינוס טברנה", lat: 39.6220, lon: 19.9210 },
    { name: "דה גריל האוס", lat: 39.6400, lon: 19.9100 },
    { name: "לדוקולה (Ladokolla)", lat: 39.6500, lon: 19.8500 },
    { name: "פיתה פיתה", lat: 39.6230, lon: 19.9220 },
    { name: "פליסבוס (Flisvos)", lat: 39.5980, lon: 19.9110 },
    { name: "קפה ליסטון", lat: 39.6245, lon: 19.9225 },
    { name: "מיקרו קפה (Mikro Café)", lat: 39.6238, lon: 19.9225 },
    { name: "גבאו ארוחות בוקר", lat: 39.6250, lon: 19.9100 },
    { name: "קבליירי גג", lat: 39.6230, lon: 19.9240 },
    { name: "פפט קפה", lat: 39.6210, lon: 19.9220 },
    { name: "פפג'ורג'יס פטיסרי", lat: 39.6242, lon: 19.9236 },
    { name: "סטארניו בייקרי (Starenio)", lat: 39.6238, lon: 19.9210 },
    { name: "קוקוצי סושי בר (Kukutsi)", lat: 39.5990, lon: 19.9100 },
    { name: "הנזל וגרטל", lat: 39.6250, lon: 19.9220 },
    { name: "דה קייק בוטיק", lat: 39.6200, lon: 19.9150 },
    { name: "אימאברי", lat: 39.6200, lon: 19.9250 },
    { name: "פאזוזו", lat: 39.5800, lon: 19.8200 },
    { name: "סקייויו (Skyview)", lat: 39.6000, lon: 19.9050 },
    { name: "נאוק אזור", lat: 39.6220, lon: 19.9260 },
    { name: "ברבטי קלאב", lat: 39.7100, lon: 19.8700 },
    { name: "דיוניסוס (Dionysos)", lat: 39.6240, lon: 19.9210 },
    { name: "סול סופלאקי", lat: 39.6220, lon: 19.9100 },
    { name: "בוגנוויליה (Bougainvillea)", lat: 39.5980, lon: 19.9090 },
    { name: "ברגר בר", lat: 39.6300, lon: 19.9200 },
    { name: "פיצטה", lat: 39.6210, lon: 19.9110 },
    { name: "אטרוסקו", lat: 39.6800, lon: 19.8400 },
    { name: "ארקדיון ביסטרו (Arcadion Bistrot)", lat: 39.6245, lon: 19.9238 },
    { name: "פומו ד'אורו", lat: 39.6240, lon: 19.9220 },
    { name: "אורה (Ora)", lat: 39.6270, lon: 19.9260 },
    { name: "רוזמרינו (Rosmarino)", lat: 39.6236, lon: 19.9212 },
    { name: "7th Heaven Cafe", lat: 39.7877, lon: 19.6672 },
    { name: "סאנסט טברנה (Sunset Taverna)", lat: 39.6850, lon: 19.6860 },
    { name: "אמפלונאס (Ambelonas)", lat: 39.6120, lon: 19.7980 },
    { name: "כריס פלייס / סופיה (Chris Place)", lat: 39.5390, lon: 19.8350 },
    { name: "אקרון ביץ' בר (Akron)", lat: 39.673348, lon: 19.715083 },
    { name: "נגואל ביץ' בר (Nagual)", lat: 39.5904, lon: 19.8169 },
    { name: "סיירנס לאונג' (Sirens)", lat: 39.4180, lon: 20.0035 },
    { name: "אליה טברנה (Elia)", lat: 39.6245, lon: 19.9218 },
    { name: "פאנה סובלאקי (Pane e Souvlaki)", lat: 39.6261, lon: 19.9206 },
    { name: "סטאברוס גריל (Stavros)", lat: 39.6122, lon: 19.8312 },
    { name: "ביזו קפה (Bizou Vegan Café)", lat: 39.6244, lon: 19.9201 },
    { name: "אוברג'ין (Aubergine)", lat: 39.6234, lon: 19.9228 },
    { name: "טאבולה ראסה (Tabule Rasa)", lat: 39.6241, lon: 19.9192 }
];

const ATTRACTION_LOCATIONS = [
    { name: "העיר העתיקה של קורפו", lat: 39.6243, lon: 19.9217 },
    { name: "ארמון אכיליון", lat: 39.5730, lon: 19.8780 },
    { name: "מנזר פלאוקסטריצה", lat: 39.6726, lon: 19.7011 },
    { name: "תעלת האהבה (Canal d'Amour)", lat: 39.7963, lon: 19.6976 },
    { name: "מבצר אנגלוקסטרו", lat: 39.6784, lon: 19.6872 },
    { name: "הר פנטוקראטור", lat: 39.7481, lon: 19.8650 },
    { name: "חוף פורטו טימוני", lat: 39.7208, lon: 19.6586 },
    { name: "כפר קסיופי", lat: 39.7946, lon: 19.9213 },
    { name: "מנזר ולכרנה ואי העכבר", lat: 39.5975, lon: 19.9106 },
    { name: "המבצר הישן", lat: 39.6255, lon: 19.9280 },
    { name: "המבצר החדש", lat: 39.6280, lon: 19.9200 },
    { name: "כף דרסטיס", lat: 39.7977, lon: 19.6747 },
    { name: "חוף לוגאס (שקיעה)", lat: 39.7942, lon: 19.6631 },
    { name: "כפר אפיאונס", lat: 39.7192, lon: 19.6586 },
    { name: "חוף אגיוס גורדיוס", lat: 39.5470, lon: 19.8530 },
    { name: "חוף גליפאדה", lat: 39.5937, lon: 19.8080 },
    { name: "פארק המים אקוולנד", lat: 39.5750, lon: 19.8450 },
    { name: "הבית של משפחת דארל (קלאמי)", lat: 39.7431, lon: 19.9351 },
    { name: "ארמון מון רפוס", lat: 39.6100, lon: 19.9250 },
    { name: "תצפית הקייזר (פלקאס)", lat: 39.6000, lon: 19.8100 },
    { name: "אגם קוריסיון", lat: 39.4400, lon: 19.9000 },
    { name: "בר לה גרוטה", lat: 39.6730, lon: 19.7000 },
    { name: "המוזיאון לאמנות אסייתית", lat: 39.6250, lon: 19.9250 },
    { name: "כנסיית ספירידון הקדוש", lat: 39.6245, lon: 19.9205 },
    { name: "כיכר ספיאנאדה וליסטון", lat: 39.6242, lon: 19.9236 },
    { name: "חוף רוביניה", lat: 39.6644, lon: 19.7214 },
    { name: "מערות הים של פלאוקסטריצה", lat: 39.6730, lon: 19.7000 },
    { name: "מפלי נימפס", lat: 39.7500, lon: 19.7500 },
    { name: "הכפר הנטוש פריטיה", lat: 39.7300, lon: 19.8500 },
    { name: "מקלט החמורים של קורפו", lat: 39.6900, lon: 19.7550 },
    { name: "חוף איסוס", lat: 39.4328, lon: 19.9366 },
    { name: "מפרץ אגני", lat: 39.7356, lon: 19.9272 },
    { name: "כפר הדייגים קולורה", lat: 39.7500, lon: 19.9300 },
    { name: "חוף קרסיה", lat: 39.7565, lon: 19.9408 },
    { name: "יער ומנזר ארקודילס", lat: 39.3700, lon: 20.0850 },
    { name: "כפר דניליה", lat: 39.6600, lon: 19.8500 },
    { name: "האי וידו", lat: 39.6350, lon: 19.9250 },
    { name: "גשר הקייזר", lat: 39.5700, lon: 19.8800 },
    { name: "חוף ברבאטי", lat: 39.7214, lon: 19.8665 },
    { name: "האקווריום של קורפו", lat: 39.6720, lon: 19.7020 }
];

const GEMS_LOCATIONS = [
    { name: "חוף רוביניה (Rovinia)", lat: 39.6644, lon: 19.7214 },
    { name: "פריתיה העתיקה (Old Perithia)", lat: 39.7300, lon: 19.8500 },
    { name: "כף דראסטיס (Cape Drastis)", lat: 39.7977, lon: 19.6747 },
    { name: "אחוזת תיאוטוקי (Theotoky Estate)", lat: 39.6100, lon: 19.8300 },
    { name: "חוף חומי (Chomi Beach)", lat: 39.6700, lon: 19.7220 },
    { name: "מפלי נימפס (Nymphes Waterfalls)", lat: 39.7500, lon: 19.7500 },
    { name: "שמורת הטבע ארימיטיס (Erimitis)", lat: 39.7780, lon: 19.9000 },
    { name: "הכפר אפיאונס (Afionas)", lat: 39.7192, lon: 19.6586 },
    { name: "אמבלונאס קורפו (Ambelonas)", lat: 39.6120, lon: 19.7980 },
    { name: "סוקראקי (Sokraki)", lat: 39.7000, lon: 19.7300 },
    { name: "אגם קוריסיון (Lake Korission)", lat: 39.4461, lon: 19.9069 },
    { name: "יער ארקודילאס (Arkoudilas Forest)", lat: 39.3700, lon: 20.0850 },
    { name: "חוף סטלארי (Stellari Beach)", lat: 39.6650, lon: 19.7300 },
    { name: "כס הקיסר בפלקאס (Kaiser's Throne)", lat: 39.6000, lon: 19.8100 },
    { name: "הטברנה של מרינה (Marina's Tavern)", lat: 39.6220, lon: 19.9190 },
    { name: "מערת גראבה (Grava Cave)", lat: 39.7700, lon: 19.8800 },
    { name: "הכפר חלומאס (Chlomos)", lat: 39.4500, lon: 19.9500 },
    { name: "חוף אקולי (Akoli Beach)", lat: 39.7750, lon: 19.8950 },
    { name: "גן לוצ'יולה (Lucciola Garden)", lat: 39.6500, lon: 19.7500 },
    { name: "חוף גיאילי (Giali Beach)", lat: 39.6650, lon: 19.7350 },
    { name: "חוף לימני, גליקו (Limni Beach)", lat: 39.6600, lon: 19.8400 },
    { name: "מוזיאון הפולקלור בסינראדס", lat: 39.5700, lon: 19.8300 },
    { name: "ארט קפה, קלימטיה", lat: 39.7500, lon: 19.7700 },
    { name: "כפר קוואלורי (Kavalouri)", lat: 39.7500, lon: 19.7100 },
    { name: "יקב פונטיגליו (Pontiglio)", lat: 39.4200, lon: 19.9500 },
    { name: "Toula's Gastronomy", lat: 39.7394, lon: 19.9381 },
    { name: "סטרינילס (Strinilas)", lat: 39.7200, lon: 19.8300 },
    { name: "מיקרו ניסי (Micro Nisi)", lat: 39.4000, lon: 19.9800 },
    { name: "מערת פנטוקרטור", lat: 39.7500, lon: 19.8600 },
    { name: "מפרץ אגני (Agni Bay)", lat: 39.7356, lon: 19.9272 },
    { name: "אחוזת מון רפוס (Mon Repos)", lat: 39.6100, lon: 19.9250 },
    { name: "התצפית הנסתרת בפורטו טימוני", lat: 39.7208, lon: 19.6586 },
    { name: "כירה כריסיקו (Kyra Chrysikou)", lat: 39.6500, lon: 19.8600 }
];

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
            const addCss = href => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
            };
            addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
            addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css');
            addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css');

            const leafletScript = document.createElement('script');
            leafletScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
            leafletScript.onload = () => {
                const clusterScript = document.createElement('script');
                clusterScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js';
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

// Lookup index so cards can find their marker (and vice versa) by name + layer type
const mapMarkerIndex = {};

function buildLayerGroup(locations, color, layerKey) {
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

    locations.forEach(loc => {
        const marker = L.circleMarker([loc.lat, loc.lon], {
            radius: 7, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.9
        });
        const mapsUrl = `https://maps.google.com/?q=${loc.lat},${loc.lon}`;
        marker.bindPopup(
            `<strong>${loc.name}</strong><br>` +
            `<a href="${mapsUrl}" target="_blank" style="color:#2563eb;">📍 נווט לשם</a>` +
            (layerKey === 'beaches' ? `<br><a href="#" onclick="openCardFromMap('${layerKey}','${loc.name.replace(/'/g, "\\'")}'); return false;" style="color:#0d9488;">📇 פתח כרטיס</a>` : '')
        );
        group.addLayer(marker);
        mapMarkerIndex[layerKey + '::' + loc.name] = marker;
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

    mapLayerGroups.beaches = buildLayerGroup(BEACH_LOCATIONS, '#2563eb', 'beaches');
    mapLayerGroups.food = buildLayerGroup(FOOD_LOCATIONS, '#ea580c', 'food');
    mapLayerGroups.attractions = buildLayerGroup(ATTRACTION_LOCATIONS, '#9333ea', 'attractions');
    mapLayerGroups.gems = buildLayerGroup(GEMS_LOCATIONS, '#059669', 'gems');

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

// Marker popup -> jump back to the matching card in its tab
function openCardFromMap(layerKey, name) {
    const tabMap = { beaches: 'beaches', food: 'food', attractions: 'attractions', gems: 'gems' };
    const tabId = tabMap[layerKey] || 'attractions';
    switchTab(tabId, true);
    setTimeout(() => {
        let card = document.querySelector(`#${tabId} [data-name="${CSS.escape(name)}"]`);
        if (!card) {
            // Attractions/food cards may not have data-name; fall back to matching by heading text
            const headings = document.querySelectorAll(`#${tabId} h3, #${tabId} h4`);
            for (const h of headings) {
                if (h.textContent.includes(name)) { card = h.closest('article, .bg-white.rounded-2xl'); break; }
            }
        }
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('search-highlight');
            setTimeout(() => card.classList.remove('search-highlight'), 2000);
        }
    }, 60);
}

// Card -> highlight its marker on the map (opens map if needed, pans, opens popup)
function showOnMap(layerKey, name) {
    const container = document.getElementById('beach-map-container');
    const openMapAndFocus = () => {
        const marker = mapMarkerIndex[layerKey + '::' + name];
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


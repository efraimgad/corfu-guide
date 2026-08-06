// Distance calculator
const DISTANCE_LOCATIONS = [
    { name: "העיר העתיקה קורפו (Corfu Town)", key: "corfu-town", lat: 39.6243, lon: 19.9217 },
    { name: "פלקאס (Pelekas)", key: "pelekas", lat: 39.6000, lon: 19.8170 },
    { name: "אגיוס גורדיוס (Agios Gordios)", key: "agios-gordios", lat: 39.5470, lon: 19.8530 },
    { name: "ארמונס (Ermones)", key: "ermones", lat: 39.6105, lon: 19.7801 },
    { name: "גליפאדה (Glyfada)", key: "glyfada", lat: 39.5937, lon: 19.8080 },
    { name: "פלאוקסטריצה (Paleokastritsa)", key: "paleokastritsa", lat: 39.6726, lon: 19.7011 },
    { name: "סידארי (Sidari)", key: "sidari", lat: 39.7915, lon: 19.7042 },
    { name: "רודה (Roda)", key: "roda", lat: 39.7790, lon: 19.7930 },
    { name: "אכרווי (Acharavi)", key: "acharavi", lat: 39.7830, lon: 19.8170 },
    { name: "קאסיופי (Kassiopi)", key: "kassiopi", lat: 39.7946, lon: 19.9213 },
    { name: "ברבטי (Barbati)", key: "barbati", lat: 39.7214, lon: 19.8665 },
    { name: "ניסאקי (Nissaki)", key: "nissaki", lat: 39.7258, lon: 19.8974 },
    { name: "גוביה (Gouvia) - מקום הלינה שלכם", key: "gouvia", lat: 39.6500, lon: 19.8520 },
    // Dassia previously carried Gouvia's own coordinates (copy-paste error); real village center is ~2km further north
    { name: "דאסיה (Dassia)", key: "dassia", lat: 39.6800, lon: 19.8398 },
    // Ipsos was placed too far west of the real coastal village, ~2-3km further north of Dassia
    { name: "איפסוס (Ipsos)", key: "ipsos", lat: 39.6995, lon: 19.8395 },
    { name: "בניצס (Benitses)", key: "benitses", lat: 39.5433, lon: 19.9139 },
    { name: "מוראיטיקה / מסונגי (Moraitika)", key: "moraitika", lat: 39.5200, lon: 19.9000 },
    { name: "קאבוס (Kavos)", key: "kavos", lat: 39.3860, lon: 20.1130 }
];

// Real driving distances/times for the routes also covered by index.html's static
// "טבלת זמני נסיעה" table (source: Corfu Scooter Rental, measured from Corfu Town).
// The "gouvia" entries apply that same table's own north/south adjustment note
// (+-~9km / ~12min vs. Corfu Town) since Gouvia is this trip's actual starting point.
// Haversine estimation below under-estimates these longer, mountain-road routes,
// so known pairs are looked up here first and haversine is used only as a fallback.
const ROAD_DISTANCES = {
    "corfu-town|pelekas": { km: 13, min: 20 },
    "agios-gordios|corfu-town": { km: 18, min: 35 },
    "barbati|corfu-town": { km: 20, min: 30 },
    "corfu-town|nissaki": { km: 22, min: 35 },
    "corfu-town|paleokastritsa": { km: 25, min: 38 },
    "corfu-town|roda": { km: 36, min: 50 },
    "corfu-town|sidari": { km: 37, min: 50 },
    "corfu-town|kassiopi": { km: 35, min: 55 },
    "acharavi|corfu-town": { km: 44, min: 60 },
    "corfu-town|kavos": { km: 46, min: 67 },
    "barbati|gouvia": { km: 11, min: 18 },
    "gouvia|nissaki": { km: 13, min: 23 },
    "gouvia|kassiopi": { km: 26, min: 43 },
    "gouvia|roda": { km: 27, min: 38 },
    "gouvia|sidari": { km: 28, min: 38 },
    "acharavi|gouvia": { km: 35, min: 48 },
    "gouvia|pelekas": { km: 22, min: 32 },
    "agios-gordios|gouvia": { km: 27, min: 47 },
    "gouvia|paleokastritsa": { km: 34, min: 50 },
    "gouvia|kavos": { km: 55, min: 79 }
};

function lookupRoadDistance(from, to) {
    if (!from.key || !to.key) return null;
    const pairKey = [from.key, to.key].sort().join('|');
    return ROAD_DISTANCES[pairKey] || null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function populateDistanceSelects() {
    const fromSel = document.getElementById('dist-from');
    const toSel = document.getElementById('dist-to');
    if (!fromSel || !toSel) return;

    DISTANCE_LOCATIONS.forEach((loc, idx) => {
        const opt1 = document.createElement('option');
        opt1.value = idx;
        opt1.textContent = loc.name;
        fromSel.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = idx;
        opt2.textContent = loc.name;
        toSel.appendChild(opt2);
    });
    // default "from" to Gouvia (this trip's confirmed accommodation)
    const gouviaIdx = DISTANCE_LOCATIONS.findIndex(l => l.name.includes('גוביה'));
    fromSel.selectedIndex = gouviaIdx >= 0 ? gouviaIdx : 0;
    toSel.selectedIndex = 5;
}

function calculateDistance() {
    const fromIdx = parseInt(document.getElementById('dist-from').value);
    const toIdx = parseInt(document.getElementById('dist-to').value);
    const from = DISTANCE_LOCATIONS[fromIdx];
    const to = DISTANCE_LOCATIONS[toIdx];

    const resultBox = document.getElementById('dist-result');
    const resultText = document.getElementById('dist-result-text');
    const resultTime = document.getElementById('dist-result-time');
    const resultLink = document.getElementById('dist-result-link');

    let disclaimer = document.getElementById('dist-result-disclaimer');
    if (!disclaimer) {
        disclaimer = document.createElement('p');
        disclaimer.id = 'dist-result-disclaimer';
        disclaimer.className = 'text-xs text-indigo-400 mt-2';
        disclaimer.textContent = 'הערכה - בדקו ב-Google Maps למידע קריטי בזמן';
        resultBox.appendChild(disclaimer);
    }

    if (fromIdx === toIdx) {
        resultBox.classList.remove('hidden');
        resultText.textContent = "זו אותה נקודה 🙂";
        resultTime.textContent = "";
        resultLink.style.display = 'none';
        disclaimer.style.display = 'none';
        return;
    }

    const known = lookupRoadDistance(from, to);
    let roadKm, minutes;
    if (known) {
        roadKm = known.km;
        minutes = known.min;
    } else {
        const straightKm = haversineKm(from.lat, from.lon, to.lat, to.lon);
        // Road-windiness correction factor for Corfu's mountainous coastal roads
        roadKm = straightKm * 1.45;
        const avgSpeedKmh = 32; // accounts for narrow, winding roads
        minutes = Math.round((roadKm / avgSpeedKmh) * 60);
    }
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    const timeStr = hours > 0 ? `כ-${hours} שעות ${remMin > 0 ? 'ו-' + remMin + ' דקות' : ''}` : `כ-${minutes} דקות`;

    resultBox.classList.remove('hidden');
    resultText.textContent = `${from.name} ⟶ ${to.name}: כ-${Math.round(roadKm)} ק"מ`;
    resultTime.textContent = `זמן נהיגה משוער: ${timeStr}`;
    resultLink.href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from.lat + ',' + from.lon)}&destination=${encodeURIComponent(to.lat + ',' + to.lon)}`;
    resultLink.style.display = 'inline-block';
    disclaimer.style.display = 'block';
}

// Currency converter (approximate fixed rates, 2026)
const CURRENCY_RATES = { ILS: 3.60, USD: 1.14, GBP: 0.85 };

function updateCurrencyRatesLabel() {
    const el = document.getElementById('currency-rates-updated');
    if (!el) return;
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const today = new Date();
    el.textContent = `מדד משוער, נכון ל-${today.getDate()} ב${months[today.getMonth()]} ${today.getFullYear()}`;
}

function convertCurrency() {
    updateCurrencyRatesLabel();
    const input = document.getElementById('currency-eur-input');
    if (!input) return;
    const eur = parseFloat(input.value) || 0;
    document.getElementById('currency-result-ils').textContent = `₪${(eur * CURRENCY_RATES.ILS).toFixed(2)}`;
    document.getElementById('currency-result-usd').textContent = `$${(eur * CURRENCY_RATES.USD).toFixed(2)}`;
    document.getElementById('currency-result-gbp').textContent = `£${(eur * CURRENCY_RATES.GBP).toFixed(2)}`;
}

window.calculateDistance = calculateDistance;
window.convertCurrency = convertCurrency;

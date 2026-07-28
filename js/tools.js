// Distance calculator
const DISTANCE_LOCATIONS = [
    { name: "העיר העתיקה קורפו (Corfu Town)", lat: 39.6243, lon: 19.9217 },
    { name: "פלקאס (Pelekas)", lat: 39.6000, lon: 19.8170 },
    { name: "אגיוס גורדיוס (Agios Gordios)", lat: 39.5470, lon: 19.8530 },
    { name: "ארמונס (Ermones)", lat: 39.6105, lon: 19.7801 },
    { name: "גליפאדה (Glyfada)", lat: 39.5937, lon: 19.8080 },
    { name: "פלאוקסטריצה (Paleokastritsa)", lat: 39.6726, lon: 19.7011 },
    { name: "סידארי (Sidari)", lat: 39.7915, lon: 19.7042 },
    { name: "רודה (Roda)", lat: 39.7790, lon: 19.7930 },
    { name: "אכרווי (Acharavi)", lat: 39.7830, lon: 19.8170 },
    { name: "קאסיופי (Kassiopi)", lat: 39.7946, lon: 19.9213 },
    { name: "ברבטי (Barbati)", lat: 39.7214, lon: 19.8665 },
    { name: "ניסאקי (Nissaki)", lat: 39.7258, lon: 19.8974 },
    { name: "גוביה (Gouvia) - מקום הלינה שלכם", lat: 39.6500, lon: 19.8520 },
    { name: "דאסיה (Dassia)", lat: 39.6500, lon: 19.8500 },
    { name: "איפסוס (Ipsos)", lat: 39.7000, lon: 19.8170 },
    { name: "בניצס (Benitses)", lat: 39.5433, lon: 19.9139 },
    { name: "מוראיטיקה / מסונגי (Moraitika)", lat: 39.5200, lon: 19.9000 },
    { name: "קאבוס (Kavos)", lat: 39.3860, lon: 20.1130 }
];

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

    if (fromIdx === toIdx) {
        resultBox.classList.remove('hidden');
        resultText.textContent = "זו אותה נקודה 🙂";
        resultTime.textContent = "";
        resultLink.style.display = 'none';
        return;
    }

    const straightKm = haversineKm(from.lat, from.lon, to.lat, to.lon);
    // Road-windiness correction factor for Corfu's mountainous coastal roads
    const roadKm = straightKm * 1.45;
    const avgSpeedKmh = 32; // accounts for narrow, winding roads
    const minutes = Math.round((roadKm / avgSpeedKmh) * 60);
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    const timeStr = hours > 0 ? `כ-${hours} שעות ${remMin > 0 ? 'ו-' + remMin + ' דקות' : ''}` : `כ-${minutes} דקות`;

    resultBox.classList.remove('hidden');
    resultText.textContent = `${from.name} ⟶ ${to.name}: כ-${Math.round(roadKm)} ק"מ`;
    resultTime.textContent = `זמן נהיגה משוער: ${timeStr}`;
    resultLink.href = `https://maps.google.com/?saddr=${from.lat},${from.lon}&daddr=${to.lat},${to.lon}`;
    resultLink.style.display = 'inline-block';
}

// Currency converter (approximate fixed rates, 2026)
const CURRENCY_RATES = { ILS: 3.60, USD: 1.14, GBP: 0.85 };

function convertCurrency() {
    const input = document.getElementById('currency-eur-input');
    if (!input) return;
    // min="0" on the <input> only stops the stepper arrows, not typed or
    // pasted values (e.g. "-50") - clamp here so a negative amount never
    // produces a nonsensical negative currency result.
    const eur = Math.max(0, parseFloat(input.value) || 0);
    document.getElementById('currency-result-ils').textContent = `₪${(eur * CURRENCY_RATES.ILS).toFixed(2)}`;
    document.getElementById('currency-result-usd').textContent = `$${(eur * CURRENCY_RATES.USD).toFixed(2)}`;
    document.getElementById('currency-result-gbp').textContent = `£${(eur * CURRENCY_RATES.GBP).toFixed(2)}`;
}

// #currency-eur-input used to carry oninput="convertCurrency()" directly.
const currencyInputEl = document.getElementById('currency-eur-input');
if (currencyInputEl) currencyInputEl.addEventListener('input', convertCurrency);

// The distance calculator's button used to carry onclick="calculateDistance()" directly.
const distCalculateBtn = document.getElementById('dist-calculate-btn');
if (distCalculateBtn) distCalculateBtn.addEventListener('click', calculateDistance);

window.calculateDistance = calculateDistance;
window.convertCurrency = convertCurrency;


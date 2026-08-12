// Distance calculator - both destination-sourced (was a hardcoded Corfu-only
// array/object literal). See data/destinations/*.js's own `distanceTool`
// field. ROAD_DISTANCES can legitimately be `{}` for a destination that
// hasn't researched real road distances yet (see testdest) - lookupRoadDistance()
// below already degrades to the haversine-estimate fallback on any miss, so an
// empty table needs no extra guard here.
const DISTANCE_LOCATIONS = window.DESTINATION.distanceTool.locations;
const ROAD_DISTANCES = window.DESTINATION.distanceTool.roadDistances;

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
    // default "from" to the destination's home base if present in the list,
    // otherwise the first entry
    const homeIdx = DISTANCE_LOCATIONS.findIndex(l => l.name.includes(window.DESTINATION.map.homeBase.name));
    fromSel.selectedIndex = homeIdx >= 0 ? homeIdx : 0;
    toSel.selectedIndex = Math.min(5, DISTANCE_LOCATIONS.length - 1);
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
        // Road-windiness correction factor + average speed, both destination-sourced
        // (was hardcoded for Corfu's mountainous coastal roads specifically).
        roadKm = straightKm * window.DESTINATION.distanceTool.windinessFactor;
        const avgSpeedKmh = window.DESTINATION.distanceTool.avgSpeedKmh; // accounts for narrow, winding roads
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

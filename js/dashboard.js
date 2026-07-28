// ==========================================================================
// TRAVEL DASHBOARD
// Trip window: 02.09.2026 15:40 (departure) → 08.09.2026 15:35 (landing back).
//
// TRIP_CONFIG is the single source of truth for every trip date/time shown
// anywhere on the page (hero badges, dashboard cards, the itinerary intro,
// and the Day 1 / Day 7 headers) - change a date here once, and
// injectTripDates() (called from initDashboard()) pushes it out to every
// [id^="..."] placeholder in the HTML instead of it being hand-edited in
// half a dozen places that can drift out of sync with each other.
// ==========================================================================
const TRIP_CONFIG = {
    outboundDeparture: new Date('2026-09-02T15:40:00+03:00'), // TLV -> CFU takeoff
    outboundArrival:   new Date('2026-09-02T18:15:00+03:00'), // CFU landing
    returnDeparture:   new Date('2026-09-08T13:10:00+03:00'), // CFU -> TLV takeoff
    returnArrival:     new Date('2026-09-08T15:35:00+03:00'), // TLV landing
    startDay: new Date('2026-09-02T00:00:00+03:00'),
    endDay:   new Date('2026-09-08T23:59:59+03:00'),
    totalDays: 7,
    fromAirport: 'TLV',
    toAirport: 'CFU'
};

// All display formatting is pinned to Corfu's own timezone (Europe/Athens),
// NOT the visitor's browser timezone - date.getDate()/getHours() read local
// wall-clock time wherever the page happens to be viewed from, which would
// silently shift every displayed date/time for anyone not in a +03:00 zone.
const TRIP_TIMEZONE = 'Europe/Athens';

function datePart(date, type) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: TRIP_TIMEZONE, day: '2-digit', month: '2-digit', year: 'numeric' })
        .formatToParts(date).find(p => p.type === type).value;
}
function formatDateDM(date) { return `${datePart(date, 'day')}.${datePart(date, 'month')}`; }
function formatDateDMY(date) { return `${formatDateDM(date)}.${datePart(date, 'year')}`; }
function formatTimeHM(date) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: TRIP_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

// Pushes every TRIP_CONFIG value out to its matching placeholder element in
// the HTML. Each id is a no-op if that element isn't on the page, so this
// is safe to call unconditionally.
function injectTripDates() {
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

    set('hero-depart-date', formatDateDM(TRIP_CONFIG.outboundDeparture));
    set('hero-return-date', formatDateDM(TRIP_CONFIG.returnDeparture));
    set('hero-trip-days', TRIP_CONFIG.totalDays);

    set('dash-departure-full', `${formatDateDMY(TRIP_CONFIG.outboundDeparture)} · ${formatTimeHM(TRIP_CONFIG.outboundDeparture)}`);
    set('dash-trip-days', TRIP_CONFIG.totalDays);
    set('dash-trip-range', `${formatDateDM(TRIP_CONFIG.outboundDeparture)} – ${formatDateDM(TRIP_CONFIG.returnDeparture)}`);

    set('checklist-return-datetime', `${formatDateDM(TRIP_CONFIG.returnDeparture)}, ${formatTimeHM(TRIP_CONFIG.returnDeparture)}`);

    set('itinerary-intro-depart-time', formatTimeHM(TRIP_CONFIG.outboundDeparture));
    set('itinerary-intro-arrive-time', formatTimeHM(TRIP_CONFIG.outboundArrival));
    set('itinerary-intro-depart-date', formatDateDM(TRIP_CONFIG.outboundDeparture));

    set('day-1-date', formatDateDM(TRIP_CONFIG.outboundDeparture));
    set('day-1-arrive-time', formatTimeHM(TRIP_CONFIG.outboundArrival));
    set('day-7-date', formatDateDM(TRIP_CONFIG.returnDeparture));
    set('day-7-depart-time', formatTimeHM(TRIP_CONFIG.returnDeparture));
}

const DASH_STORAGE_KEY = 'corfu-guide-dashboard';
// The confirmed accommodation for this trip. Shown as the dashboard's
// default hotel entry unless the traveler edits it to something else
// (their edit is saved to localStorage and always takes priority).
const DEFAULT_HOTEL = { name: 'Tessera Boutique Hotel & Villas', note: 'גוביה (Gouvia)' };

const ITINERARY_DAY_TITLES = {
    1: 'נחיתה, איסוף רכב והתאקלמות ראשונית',
    2: 'קורפו טאון – קסם ונציאני וסמטאות היסטוריות',
    3: 'החוף הצפון-מזרחי – מפרצים נסתרים ואחוזות עתיקות',
    4: 'פלאוקסטריצה – חופים אמרלד ומנזרים תלויים',
    5: 'דרום קורפו – ארמון הקיסרית, דיונות חול וטברנות דגים',
    6: 'הצפון הפראי – תצורות סלע, תעלת האהבה ושקיעות דרמטיות',
    7: 'יום העזיבה – צ׳ק אאוט וטיסה חזרה'
};

function initDashboard() {
    injectTripDates();
    updateDashCountdown();
    setInterval(updateDashCountdown, 60000); // refresh every minute, not every second — no need to redraw constantly
    updateDashToday();
    updateDashFavCount();
    loadDashEditorState();
    fetchDashWeather();
}

function updateDashCountdown() {
    const el = document.getElementById('dash-countdown');
    if (!el) return;
    const now = new Date();
    const diffMs = TRIP_CONFIG.outboundDeparture - now;
    if (diffMs <= 0) {
        el.textContent = (now <= TRIP_CONFIG.endDay) ? 'אתם בטיול! 🎉' : 'הטיול הסתיים';
        return;
    }
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    el.textContent = days > 0 ? `${days} ימים` : `${hours} שעות`;
}

function updateDashToday() {
    const el = document.getElementById('dash-today');
    if (!el) return;
    const now = new Date();
    if (now < TRIP_CONFIG.startDay) {
        const daysLeft = Math.ceil((TRIP_CONFIG.startDay - now) / 86400000);
        el.textContent = `הטיול מתחיל בעוד ${daysLeft} ימים`;
        window._currentTripDayNum = 1; // trip hasn't started — "view itinerary" opens on day 1
    } else if (now > TRIP_CONFIG.endDay) {
        el.textContent = 'הטיול הסתיים — מקווים שנהניתם!';
        window._currentTripDayNum = null; // no single "current day" once the trip is over
    } else {
        const dayNum = Math.floor((now - TRIP_CONFIG.startDay) / 86400000) + 1;
        el.textContent = `יום ${dayNum}: ${ITINERARY_DAY_TITLES[dayNum] || ''}`;
        window._currentTripDayNum = dayNum;
    }
}

function updateDashFavCount() {
    const el = document.getElementById('dash-fav-count');
    if (!el) return;
    el.textContent = getFavorites().length;
}

// Favorites span four different tabs (beach-/food-/attr-/gem-), so a
// single "view favorites" action jumps to whichever tab currently holds
// the most saved items — the most useful single destination — with that
// tab's own "favorites" filter already applied. Defaults to beaches
// (matching the mobile bottom-nav heart button) when nothing is saved yet.
function viewFavorites() {
    const favorites = getFavorites();
    const counts = { beaches: 0, food: 0, attractions: 0, gems: 0 };
    const prefixToTab = { 'beach-': 'beaches', 'food-': 'food', 'attr-': 'attractions', 'gem-': 'gems' };
    favorites.forEach(id => {
        const prefix = Object.keys(prefixToTab).find(p => id.startsWith(p));
        if (prefix) counts[prefixToTab[prefix]]++;
    });
    const tabByCount = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const targetTab = (tabByCount && tabByCount[1] > 0) ? tabByCount[0] : 'beaches';

    const filterFn = { beaches: filterBeaches, food: filterFood, attractions: filterAttractions, gems: filterGems }[targetTab];
    switchTab(targetTab, true);
    setTimeout(() => filterFn('favorites'), 150);
    window.scrollTo({ top: 100, behavior: 'smooth' });
}

// Live weather via Open-Meteo — free, no API key required. If the fetch
// fails for any reason (offline, no reception in the mountains, the API
// itself down, a malformed response), inject a static "unavailable" state
// instead of leaving the widget stuck on "טוען..." or throwing - the
// dashboard layout never breaks, it just honestly says the forecast
// couldn't be reached right now.
function fetchDashWeather() {
    const valEl = document.getElementById('dash-weather');
    const subEl = document.getElementById('dash-weather-sub');
    if (!valEl) return;
    fetch('https://api.open-meteo.com/v1/forecast?latitude=39.6243&longitude=19.9217&current_weather=true')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
            const w = data && data.current_weather;
            if (!w) return Promise.reject();
            const icon = weatherCodeToIcon(w.weathercode);
            valEl.textContent = `${icon} ${Math.round(w.temperature)}°C`;
            subEl.textContent = 'תחזית חיה כרגע';
        })
        .catch(() => {
            valEl.textContent = '📡';
            subEl.textContent = 'תחזית לא זמינה כרגע (אין קליטה)';
        });
}

function weatherCodeToIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 95) return '⛈️';
    return '🌤️';
}

// Hotel / car rental editor — saved locally only. The hotel defaults to
// this trip's confirmed accommodation (DEFAULT_HOTEL); car rental has no
// confirmed booking, so it starts empty and simply offers to remember
// whatever the traveler adds themselves. Editing either is always saved
// to localStorage and takes priority over the default.
let dashEditorType = null;

let dashEditorTriggerEl = null; // remembers what was focused before the modal opened

function openDashEditor(type) {
    dashEditorType = type;
    dashEditorTriggerEl = document.activeElement;
    const isHotel = type === 'hotel';
    document.getElementById('dash-editor-title').textContent = isHotel ? 'פרטי לינה' : 'פרטי רכב שכור';
    document.getElementById('dash-editor-label').textContent = isHotel ? 'שם המלון / Airbnb' : 'חברת השכרה';
    document.getElementById('dash-editor-label2').textContent = isHotel ? 'הערה (תאריך צ׳ק-אין וכו׳)' : 'הערה (מספר הזמנה, שעת איסוף וכו׳)';

    const saved = getDashSavedData();
    const entry = saved[type] || (isHotel ? DEFAULT_HOTEL : {});
    document.getElementById('dash-editor-input1').value = entry.name || '';
    document.getElementById('dash-editor-input2').value = entry.note || '';

    document.getElementById('dash-editor-backdrop').classList.remove('hidden');
    document.body.classList.add('modal-open');
    document.getElementById('dash-editor-input1').focus();
}

function closeDashEditor() {
    document.getElementById('dash-editor-backdrop').classList.add('hidden');
    document.body.classList.remove('modal-open');
    dashEditorType = null;
    if (dashEditorTriggerEl) dashEditorTriggerEl.focus(); // return focus to whatever opened it
}

// Escape closes the modal, matching standard dialog keyboard behavior.
// Tab/Shift+Tab are trapped inside it while it's open, so keyboard focus
// never escapes to the page behind — Tab from the last focusable element
// cycles back to the first, and Shift+Tab from the first cycles to the last.
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('dash-editor-backdrop');
    if (!modal || modal.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
        closeDashEditor();
        return;
    }

    if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll(
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

function getDashSavedData() {
    try {
        return JSON.parse(localStorage.getItem(DASH_STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function saveDashEditor() {
    if (!dashEditorType) return;
    const name = document.getElementById('dash-editor-input1').value.trim();
    const note = document.getElementById('dash-editor-input2').value.trim();
    const saved = getDashSavedData();
    if (name) {
        saved[dashEditorType] = { name, note };
    } else {
        delete saved[dashEditorType];
    }
    try {
        localStorage.setItem(DASH_STORAGE_KEY, JSON.stringify(saved));
    } catch (e) { /* ignore quota errors — non-critical feature */ }
    renderDashEntry(dashEditorType, saved[dashEditorType]);
    closeDashEditor();
}

function renderDashEntry(type, entry) {
    const emptyEl = document.getElementById(`dash-${type}-empty`);
    const filledEl = document.getElementById(`dash-${type}-filled`);
    const nameEl = document.getElementById(`dash-${type}-name`);
    if (!emptyEl || !filledEl || !nameEl) return;
    if (entry && entry.name) {
        nameEl.textContent = entry.note ? `${entry.name} · ${entry.note}` : entry.name;
        emptyEl.classList.add('hidden');
        filledEl.classList.remove('hidden');
    } else {
        emptyEl.classList.remove('hidden');
        filledEl.classList.add('hidden');
    }
}

function loadDashEditorState() {
    const saved = getDashSavedData();
    renderDashEntry('hotel', saved.hotel || DEFAULT_HOTEL);
    renderDashEntry('car', saved.car);
}

window.viewFavorites = viewFavorites;
window.openDashEditor = openDashEditor;
window.closeDashEditor = closeDashEditor;
window.saveDashEditor = saveDashEditor;


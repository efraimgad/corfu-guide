// ============================================================================
// app-shell.js — Phase 4, batch 1: the new persistent 5-item bottom nav
// (מפה/מסלול/גלה/מדריך/עוד), the two new bottom sheets it opens ("עוד" and
// the Home tab's trip-status sheet), and the Home tab's live-stat sync.
//
// Deliberately isolated in its own file rather than folded into js/ui.js or
// js/dashboard.js: everything here is additive shell/chrome for this first
// slice of the visual redesign, and keeping it separate makes this batch's
// diff easy to review (and, if something regresses, easy to disable) without
// touching the tab-switching engine or the dashboard's own data/render code
// beyond the one small hook in switchTab() (see js/ui.js).
//
// Data flow: this file never recomputes or re-fetches anything. It only
// reads values the existing #dashboard tab (js/dashboard.js) and the
// existing reservations tracker (js/reservations.js) already compute/render,
// and copies or reuses them - see gtSyncHomeStats() and gtOpenTripSheet().
// ============================================================================

// -- Bottom-nav highlight state --------------------------------------------
// Which real tab id(s) each of the 5 nav buttons should show as "current"
// for. גלה now routes to the real 'explore' tab (Phase 4, batch 2); the old
// beaches/food/attractions/gems/activities tab ids stay in this group too,
// so the "גלה" button still highlights correctly if something reaches one
// of those hidden-fallback tabs directly (e.g. a bookmarked #beaches hash).
// מדריך now routes to the real merged 'guide' tab (js/guide.js), which
// bundles trip-planning/health-safety/language-daily/FAQ behind a .gt-chip
// sub-nav - see index.html's #guide section and js/guide.js.
const GT_NAV_TAB_GROUPS = {
    home: ['home'],
    itinerary: ['itinerary'],
    explore: ['explore', 'beaches', 'food', 'attractions', 'gems', 'activities'],
    // Phase 4, final batch: 'guide' is now the real merged tab id (see
    // js/guide.js) - the old trip-planning/health-safety/language-daily/faq
    // ids stay in this group too, since js/ui.js's switchTab() still
    // accepts them directly (old links, bookmarks) and now redirects them
    // into 'guide' rather than showing them standalone.
    guide: ['guide', 'trip-planning', 'health-safety', 'language-daily', 'faq']
};

function syncAppShellNav(tabId) {
    const navBtns = document.querySelectorAll('.gt-app-nav__btn[data-gt-nav]');
    if (!navBtns.length) return; // defensive - shouldn't happen once the shell markup exists

    let anyGroupMatched = false;
    navBtns.forEach((btn) => {
        const key = btn.getAttribute('data-gt-nav');
        if (key === 'more') return; // handled separately below
        const group = GT_NAV_TAB_GROUPS[key] || [];
        const active = group.includes(tabId);
        if (active) anyGroupMatched = true;
        btn.setAttribute('aria-current', active ? 'true' : 'false');
    });

    // "עוד" (More): not a tab of its own, so it "lights up" whenever the
    // open tab isn't covered by any of the four primary routes - today
    // that's only about/dashboard, both reachable via its sheet (or the
    // hidden legacy nav) this batch.
    const moreBtn = document.querySelector('.gt-app-nav__btn[data-gt-nav="more"]');
    if (moreBtn) moreBtn.setAttribute('aria-current', anyGroupMatched ? 'false' : 'true');
}
window.syncAppShellNav = syncAppShellNav;

// -- "עוד" (More) sheet ------------------------------------------------------
// Focus moves in and returns to the trigger on close - same pattern as the
// existing emergency modal (js/ui.js) / dashboard editor modal (js/dashboard.js).
let gtMoreSheetTriggerEl = null;
function gtOpenMoreSheet() {
    const backdrop = document.getElementById('gt-more-sheet-backdrop');
    const sheet = document.getElementById('gt-more-sheet');
    const navBtn = document.getElementById('gt-more-nav-btn');
    if (!backdrop || !sheet) return;
    gtMoreSheetTriggerEl = document.activeElement;
    backdrop.classList.remove('hidden');
    sheet.classList.remove('hidden');
    if (navBtn) navBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('modal-open');
    const closeBtn = sheet.querySelector('button[aria-label="סגירה"]');
    if (closeBtn) closeBtn.focus();
}
function gtCloseMoreSheet() {
    const backdrop = document.getElementById('gt-more-sheet-backdrop');
    const sheet = document.getElementById('gt-more-sheet');
    const navBtn = document.getElementById('gt-more-nav-btn');
    if (backdrop) backdrop.classList.add('hidden');
    if (sheet) sheet.classList.add('hidden');
    if (navBtn) navBtn.setAttribute('aria-expanded', 'false');
    if (!isAnyGtSheetOpen()) document.body.classList.remove('modal-open');
    if (gtMoreSheetTriggerEl) gtMoreSheetTriggerEl.focus();
}

// -- Home tab's trip-status sheet (hotel/car/reservations) ------------------
// Reuses the existing #dashboard tab's own DOM state (hotel/car name fields,
// toggled empty/filled by js/dashboard.js openDashEditor()/renderDashEntry())
// and the existing reservations.js render helpers - no second data source.
let gtTripSheetTriggerEl = null;
function gtOpenTripSheet() {
    const hotelOut = document.getElementById('gt-sheet-hotel');
    const carOut = document.getElementById('gt-sheet-car');
    if (hotelOut) hotelOut.textContent = gtReadDashCardValue('hotel');
    if (carOut) carOut.textContent = gtReadDashCardValue('car');

    const listEl = document.getElementById('gt-sheet-reservations-list');
    const emptyEl = document.getElementById('gt-sheet-reservations-empty');
    if (listEl && typeof getReservations === 'function' && typeof reservationRowHtml === 'function') {
        const sortFn = typeof reservationSortKey === 'function'
            ? (a, b) => reservationSortKey(a) - reservationSortKey(b)
            : () => 0;
        const list = getReservations().slice().sort(sortFn);
        if (!list.length) {
            listEl.innerHTML = '';
            if (emptyEl) emptyEl.classList.remove('hidden');
        } else {
            if (emptyEl) emptyEl.classList.add('hidden');
            listEl.innerHTML = list.map(reservationRowHtml).join('');
        }
    }

    const backdrop = document.getElementById('gt-trip-sheet-backdrop');
    const sheet = document.getElementById('gt-trip-sheet');
    if (!backdrop || !sheet) return;
    gtTripSheetTriggerEl = document.activeElement;
    backdrop.classList.remove('hidden');
    sheet.classList.remove('hidden');
    document.body.classList.add('modal-open');
    const closeBtn = sheet.querySelector('button[aria-label="סגירה"]');
    if (closeBtn) closeBtn.focus();
}
function gtCloseTripSheet() {
    const backdrop = document.getElementById('gt-trip-sheet-backdrop');
    const sheet = document.getElementById('gt-trip-sheet');
    if (backdrop) backdrop.classList.add('hidden');
    if (sheet) sheet.classList.add('hidden');
    if (!isAnyGtSheetOpen()) document.body.classList.remove('modal-open');
    if (gtTripSheetTriggerEl) gtTripSheetTriggerEl.focus();
}

// Reads the hotel/car status straight off #dashboard's existing filled/empty
// toggle (js/dashboard.js renderDashEntry()) instead of re-reading
// localStorage or TRIP_PRIVATE directly - one source of truth for "what's
// currently shown", even though this sheet is a second place that shows it.
function gtReadDashCardValue(type) {
    const nameEl = document.getElementById(`dash-${type}-name`);
    const emptyEl = document.getElementById(`dash-${type}-empty`);
    const isFilled = emptyEl && emptyEl.classList.contains('hidden');
    if (isFilled && nameEl && nameEl.textContent.trim()) return nameEl.textContent.trim();
    return 'טרם הוזנו פרטים';
}

function isAnyGtSheetOpen() {
    const more = document.getElementById('gt-more-sheet');
    const trip = document.getElementById('gt-trip-sheet');
    // Phase 4, final batch: the floating currency/distance tools sheet
    // (js/tools-fab.js) is a third sheet sharing the same 'modal-open'
    // body class - included here so gtCloseToolsSheet() only clears it
    // once every one of the app's sheets is actually closed.
    const tools = document.getElementById('gt-tools-sheet');
    return (more && !more.classList.contains('hidden')) ||
        (trip && !trip.classList.contains('hidden')) ||
        (tools && !tools.classList.contains('hidden'));
}

// Escape closes whichever of the two new sheets is open, and Tab/Shift+Tab
// are trapped inside it while it's open - same convention as the existing
// emergency modal (js/ui.js) and dashboard editor modal (js/dashboard.js),
// not a new pattern.
document.addEventListener('keydown', (e) => {
    const more = document.getElementById('gt-more-sheet');
    const trip = document.getElementById('gt-trip-sheet');
    const openSheet = (more && !more.classList.contains('hidden')) ? more :
        (trip && !trip.classList.contains('hidden')) ? trip : null;
    if (!openSheet) return;

    if (e.key === 'Escape') {
        if (openSheet === more) gtCloseMoreSheet();
        else gtCloseTripSheet();
        return;
    }

    if (e.key === 'Tab') {
        const focusable = openSheet.querySelectorAll(
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

window.gtOpenMoreSheet = gtOpenMoreSheet;
window.gtCloseMoreSheet = gtCloseMoreSheet;
window.gtOpenTripSheet = gtOpenTripSheet;
window.gtCloseTripSheet = gtCloseTripSheet;

// -- Home tab live-stat row + "today's plan" summary -------------------------
// Copies already-computed text out of the existing #dashboard tab's own
// elements (js/dashboard.js updateDashCountdown()/updateDashToday()/
// fetchDashWeather() keep these current regardless of which tab is open -
// initDashboard() runs once on load and updateDashCountdown() re-runs every
// 60s) rather than recomputing the countdown/fetching weather a second time.
// Runs on an interval (not just once) purely to pick up dashboard.js's own
// periodic updates and the weather fetch resolving asynchronously after
// load; it no-ops whenever the Home tab isn't the one currently on screen.
function gtSyncHomeStats() {
    const homeSection = document.getElementById('home');
    if (!homeSection || !homeSection.classList.contains('active')) return;

    const dashCountdown = document.getElementById('dash-countdown');
    const dashWeather = document.getElementById('dash-weather');
    const dashToday = document.getElementById('dash-today');

    const statCountdown = document.getElementById('home-stat-countdown');
    const statWeather = document.getElementById('home-stat-weather');
    const statToday = document.getElementById('home-stat-today');
    if (statCountdown) statCountdown.textContent = '✈️ ' + (dashCountdown ? dashCountdown.textContent : '—');
    if (statWeather) statWeather.textContent = '🌡️ ' + (dashWeather ? dashWeather.textContent : '—');
    if (statToday) statToday.textContent = dashToday ? dashToday.textContent : '—';

    const summaryEl = document.getElementById('home-today-summary');
    const metaEl = document.getElementById('home-today-meta');
    if (summaryEl) {
        summaryEl.textContent = dashToday ? dashToday.textContent : '—';
        if (metaEl) {
            const dayNum = window._currentTripDayNum;
            metaEl.textContent = dayNum ? 'גללו למסלול המלא של היום ←' : '';
        }
    }
}
window.gtSyncHomeStats = gtSyncHomeStats;

// 3s cadence is cheap (a handful of textContent reads/writes, gated to a
// no-op unless Home is the active tab) and just needs to be frequent enough
// to catch dashboard.js's async weather fetch resolving after load - it
// doesn't need to match dashboard.js's own 60s countdown-refresh interval.
setInterval(gtSyncHomeStats, 3000);
document.addEventListener('DOMContentLoaded', gtSyncHomeStats);

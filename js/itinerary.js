// Trip progress tracker: lets users mark each itinerary day as completed,
// persisted in localStorage so it survives page reloads.
const TRIP_PROGRESS_KEY = 'corfu-guide-trip-progress';
// Total day count now lives on TRIP_CONFIG (js/dashboard.js) - the single
// centralized source for every trip date/duration on the page.

function getCompletedDays() {
    try {
        const raw = localStorage.getItem(TRIP_PROGRESS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveCompletedDays(days) {
    try {
        localStorage.setItem(TRIP_PROGRESS_KEY, JSON.stringify(days));
    } catch (e) {
        console.warn('Could not save trip progress', e);
    }
}

// Collapsible day cards: click a day's header to fold/unfold its full
// timeline, so the itinerary can be scanned at a glance and expanded
// only for the day(s) currently being planned — a common pattern in
// premium trip-planner apps.
function toggleDayCard(headerEl) {
    const body = headerEl.nextElementSibling;
    const chevron = headerEl.querySelector('.day-card-chevron');
    if (!body) return;
    const isCollapsed = body.classList.toggle('day-card-collapsed');
    headerEl.setAttribute('aria-expanded', String(!isCollapsed));
    if (chevron) {
        chevron.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    }
}

// The day headers are only clickable <div>s, so without this they're
// invisible to keyboard users and screen readers don't know they
// expand/collapse anything. Script runs with `defer`, so the DOM is
// already parsed - no need to wait for DOMContentLoaded.
document.querySelectorAll('.premium-day-header').forEach((header, index) => {
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', 'true');

    // aria-controls needs an id on the collapsible body to point to - it
    // has none in the markup, so one is assigned here rather than adding
    // 9 near-identical ids by hand in index.html.
    const body = header.nextElementSibling;
    if (body) {
        const bodyId = `day-card-body-${index + 1}`;
        body.id = bodyId;
        header.setAttribute('aria-controls', bodyId);
    }
});

// Mouse path: used to be an onclick="toggleDayCard(this)" on each of the 9
// headers. The nested checkbox label and map-pin button both stop this
// event from reaching them (see below), so clicking either one doesn't
// also toggle the card.
document.addEventListener('click', (e) => {
    const header = e.target.closest('.premium-day-header');
    if (header) toggleDayCard(header);
});

// The checkbox's wrapping label and the map-pin button both used to carry
// their own onclick="event.stopPropagation()" (the map-pin button's inline
// handler did more after that - see below). That call has to happen in a
// listener attached directly to the element itself, not via document-level
// delegation like the toggle listener above: by the time a delegated
// listener on document runs, the event has already finished bubbling, so
// calling stopPropagation() there would be too late to stop the header's
// own delegated listener above from also firing.
document.querySelectorAll('.day-complete-label').forEach(label => {
    label.addEventListener('click', (e) => e.stopPropagation());
});

// Each of the 7 day-card "show this area on the map" buttons used to carry
// an identical onclick="event.stopPropagation(); switchTab('beaches');
// setTimeout(...)". The 8th day-map-jump-btn (the dashboard's "מפה מאוחדת"
// quicknav shortcut) isn't nested inside a day header, so stopPropagation()
// there is a harmless no-op rather than something it depends on.
document.querySelectorAll('.day-map-jump-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        switchTab('beaches');
        setTimeout(() => {
            const mapContainer = document.getElementById('beach-map-container');
            if (mapContainer && mapContainer.style.display === 'none') toggleBeachMap();
            mapContainer.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    });
});

// Keyboard path: only react when the header itself is focused - not when
// Enter/Space bubbles up from the checkbox or map button nested inside it,
// both of which already have their own native Enter/Space behavior.
document.addEventListener('keydown', (e) => {
    if (!e.target.classList.contains('premium-day-header')) return;
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDayCard(e.target);
    }
});

// Quick action: open or fold every day at once, for scanning the whole
// week or focusing on a single day without seven clicks.
function setAllDayCards(expand) {
    document.querySelectorAll('.premium-day-header').forEach(header => {
        const body = header.nextElementSibling;
        const chevron = header.querySelector('.day-card-chevron');
        if (!body) return;
        body.classList.toggle('day-card-collapsed', !expand);
        header.setAttribute('aria-expanded', String(expand));
        if (chevron) chevron.style.transform = expand ? 'rotate(0deg)' : 'rotate(-90deg)';
    });
}

// The expand-all/collapse-all buttons used to carry their own
// onclick="setAllDayCards(true|false)" directly.
const itineraryExpandAllBtn = document.getElementById('itinerary-expand-all-btn');
if (itineraryExpandAllBtn) itineraryExpandAllBtn.addEventListener('click', () => setAllDayCards(true));

const itineraryCollapseAllBtn = document.getElementById('itinerary-collapse-all-btn');
if (itineraryCollapseAllBtn) itineraryCollapseAllBtn.addEventListener('click', () => setAllDayCards(false));

// Each of the 7 day-completion checkboxes used to carry its own
// onchange="toggleDayComplete(this)" - identical in every instance.
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('day-complete-checkbox')) toggleDayComplete(e.target);
});

function toggleDayComplete(checkboxEl) {
    const day = checkboxEl.getAttribute('data-day');
    let completed = getCompletedDays();
    if (checkboxEl.checked) {
        if (!completed.includes(day)) completed.push(day);
    } else {
        completed = completed.filter(d => d !== day);
    }
    saveCompletedDays(completed);
    updateTripProgressUI(completed);
    if (window.CorfuStorage) window.CorfuStorage.markDayDirty(day);
    // Push this change to Supabase in the background (Step 7) - never
    // blocks or reverts the local toggle above, even if it fails.
    if (typeof queueItineraryDaySync === 'function') queueItineraryDaySync(Number(day), checkboxEl.checked);

    // Auto-collapse a day shortly after marking it complete, to reduce
    // clutter as the trip progresses. Only ever collapses — unchecking
    // never force-expands a card the user may still be reading.
    if (checkboxEl.checked) {
        const header = checkboxEl.closest('.premium-day-header');
        const body = header && header.nextElementSibling;
        if (header && body && !body.classList.contains('day-card-collapsed')) {
            setTimeout(() => toggleDayCard(header), 600);
        }
    }
}

function updateTripProgressUI(completed) {
    const count = completed.length;
    const pct = Math.round((count / TRIP_CONFIG.totalDays) * 100);
    const textEl = document.getElementById('trip-progress-text');
    const fillEl = document.getElementById('trip-progress-bar-fill');
    const trackEl = document.getElementById('trip-progress-bar-track');
    if (textEl) textEl.textContent = `${count} מתוך ${TRIP_CONFIG.totalDays} ימים הושלמו`;
    if (fillEl) fillEl.style.width = pct + '%';
    if (trackEl) trackEl.setAttribute('aria-valuenow', count);
}

function initTripProgress() {
    const completed = getCompletedDays();
    document.querySelectorAll('.day-complete-checkbox').forEach(cb => {
        if (completed.includes(cb.getAttribute('data-day'))) {
            cb.checked = true;
        }
    });
    updateTripProgressUI(completed);
}

// The dashboard's "view full itinerary" CTA used to just switch tabs and
// dump the user at the top of a 7-day list. Now it scrolls straight to,
// auto-expands, and briefly highlights the day that's actually relevant
// right now (or Day 1 before departure) — reusing the same
// expand/scroll/highlight mechanics as toggleDayCard and search results.
function viewTodayInItinerary() {
    const dayNum = window._currentTripDayNum;
    switchTab('itinerary', true);
    if (!dayNum) {
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
    }
    setTimeout(() => {
        const checkbox = document.querySelector(`.day-complete-checkbox[data-day="${dayNum}"]`);
        const header = checkbox && checkbox.closest('.premium-day-header');
        if (!header) {
            window.scrollTo({ top: 100, behavior: 'smooth' });
            return;
        }
        const body = header.nextElementSibling;
        if (body && body.classList.contains('day-card-collapsed')) {
            toggleDayCard(header);
        }
        const card = header.closest('.premium-day-card') || header;
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        card.classList.add('search-highlight');
        setTimeout(() => card.classList.remove('search-highlight'), 2000);
    }, 150);
}

// The dashboard's "view full itinerary" link used to carry its own
// onclick="viewTodayInItinerary()" directly.
const dashViewItineraryBtn = document.getElementById('dash-view-itinerary-btn');
if (dashViewItineraryBtn) dashViewItineraryBtn.addEventListener('click', viewTodayInItinerary);

window.setAllDayCards = setAllDayCards;
window.toggleDayCard = toggleDayCard;
window.toggleDayComplete = toggleDayComplete;
window.viewTodayInItinerary = viewTodayInItinerary;

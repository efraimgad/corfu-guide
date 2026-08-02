// Trip progress tracker: lets users mark each itinerary day as completed,
// persisted in localStorage so it survives page reloads.
const TRIP_PROGRESS_KEY = 'corfu-guide-trip-progress';
// Total day count now lives on TRIP_CONFIG (js/dashboard.js) - the single
// centralized source for every trip date/duration on the page.

function getCompletedDays() {
    try {
        const raw = localStorage.getItem(TRIP_PROGRESS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
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
    if (chevron) {
        chevron.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    }
    // Only the 7 numbered day headers carry aria-controls (the 2 optional
    // alternative-day cards aren't keyboard-operable headers - see Step 13);
    // this guard keeps aria-expanded scoped to the same 7.
    if (headerEl.hasAttribute('aria-controls')) {
        headerEl.setAttribute('aria-expanded', String(!isCollapsed));
    }
}

// Enter/Space activate the header like a real button would, since a plain
// div with role="button" gets no native keyboard behavior. Ignores keys
// that originate from the checkbox/map-button nested inside the header
// (which handle their own activation and already stopPropagation() on
// click) - keydown bubbles regardless of that, so without this guard
// pressing Space on the checkbox would also toggle the card.
function handleDayHeaderKeydown(event, headerEl) {
    if (event.target !== headerEl) return;
    if (event.key === 'Enter') {
        toggleDayCard(headerEl);
    } else if (event.key === ' ') {
        event.preventDefault(); // don't let Space scroll the page
        toggleDayCard(headerEl);
    }
}

// Quick action: open or fold every day at once, for scanning the whole
// week or focusing on a single day without seven clicks.
function setAllDayCards(expand) {
    document.querySelectorAll('.premium-day-header').forEach(header => {
        const body = header.nextElementSibling;
        const chevron = header.querySelector('.day-card-chevron');
        if (!body) return;
        body.classList.toggle('day-card-collapsed', !expand);
        if (chevron) chevron.style.transform = expand ? 'rotate(0deg)' : 'rotate(-90deg)';
        if (header.hasAttribute('aria-controls')) {
            header.setAttribute('aria-expanded', String(expand));
        }
    });
}

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
    initDayBudgetInputs();
}

// --- Per-day "actual spent" tracker ---------------------------------------
// A lightweight companion to the day-complete checkbox above: how much was
// actually spent that day, in euros. Kept in its own localStorage key
// (rather than folded into TRIP_PROGRESS_KEY) because that key's existing
// shape is a flat array of completed day numbers, not an object keyed by
// day - reusing it here would mean changing its shape and touching the
// cloud-merge logic in storage.js that already depends on it staying an
// array. This is local-only, exactly like the rest of this file.
const DAY_BUDGET_KEY = 'corfu-guide-day-budget-actual';
// Shape: { [dayNumber]: number }

function getDayBudgetActuals() {
    try {
        const raw = localStorage.getItem(DAY_BUDGET_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) {
        return {};
    }
}

function saveDayBudgetActuals(map) {
    try {
        localStorage.setItem(DAY_BUDGET_KEY, JSON.stringify(map));
    } catch (e) {
        console.warn('Could not save day budget actuals', e);
    }
}

function updateDayBudgetActual(inputEl) {
    const day = inputEl.getAttribute('data-day');
    const raw = inputEl.value.trim();
    const map = getDayBudgetActuals();
    if (raw === '') {
        delete map[day];
    } else {
        const num = Number(raw);
        if (!Number.isFinite(num) || num < 0) return; // ignore garbage input, don't save it
        map[day] = num;
    }
    saveDayBudgetActuals(map);
    updateDayBudgetSummary(map);
}

function updateDayBudgetSummary(map) {
    const el = document.getElementById('day-budget-total');
    if (!el) return;
    const total = Object.values(map).reduce((sum, v) => sum + (Number(v) || 0), 0);
    el.textContent = total > 0 ? `💶 סה"כ הוצאות בפועל עד כה: €${total}` : '';
}

function initDayBudgetInputs() {
    const map = getDayBudgetActuals();
    document.querySelectorAll('.day-budget-input').forEach(input => {
        const day = input.getAttribute('data-day');
        if (map[day] != null) input.value = map[day];
    });
    updateDayBudgetSummary(map);
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

// Per-day map filtering (see js/map.js openDayMap): there is no explicit
// day -> location-id field anywhere in the data, so each day's stops are
// found by matching the place names actually written in that day's own
// itinerary text (#day-N-body) against window.CORFU_LOCATIONS' `name`
// field - the same source of truth the map/cards already use. This is
// re-derived from the live DOM/data every time the button is pressed
// (not a hand-typed id list), so it can't silently go stale if a location
// record's id or wording changes later.
//
// A location name is either a plain string ("קסיופי") or "Hebrew (English)"
// ("רוביניה (Rovinia)"); both halves are tried separately since itinerary
// text sometimes only uses one of the two languages for a given place.
// Anything 2 characters or shorter is skipped as too generic to trust
// (would false-positive on unrelated day text).
function extractLocationNameVariants(name) {
    if (!name) return [];
    const variants = [];
    const bilingual = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (bilingual) {
        variants.push(bilingual[1].trim());
        variants.push(bilingual[2].trim());
    } else {
        variants.push(name.trim());
    }
    return variants.filter(v => v.length > 2);
}

// Returns every location (any category with map coordinates) whose name
// appears in day N's own itinerary text. Empty on days with no mappable
// stops (e.g. Day 1/7, arrival/departure logistics) - callers should fall
// back to the full-island view in that case rather than show nothing.
function getDayLocationMatches(dayNum) {
    const body = document.getElementById(`day-${dayNum}-body`);
    const locations = window.CORFU_LOCATIONS;
    if (!body || !locations) return [];

    const dayText = body.textContent;
    const matches = [];
    Object.keys(locations).forEach(category => {
        (locations[category] || []).forEach(loc => {
            if (loc.lat == null || loc.lon == null) return;
            const variants = extractLocationNameVariants(loc.name || loc.title);
            if (variants.some(v => dayText.includes(v))) {
                matches.push({ category, id: loc.id, lat: loc.lat, lon: loc.lon, name: loc.name || loc.title });
            }
        });
    });
    return matches;
}

window.setAllDayCards = setAllDayCards;
window.toggleDayCard = toggleDayCard;
window.handleDayHeaderKeydown = handleDayHeaderKeydown;
window.toggleDayComplete = toggleDayComplete;
window.viewTodayInItinerary = viewTodayInItinerary;
window.updateDayBudgetActual = updateDayBudgetActual;
window.getDayLocationMatches = getDayLocationMatches;

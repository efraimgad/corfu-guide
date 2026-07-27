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
    if (chevron) {
        chevron.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
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

window.setAllDayCards = setAllDayCards;
window.toggleDayCard = toggleDayCard;
window.toggleDayComplete = toggleDayComplete;
window.viewTodayInItinerary = viewTodayInItinerary;

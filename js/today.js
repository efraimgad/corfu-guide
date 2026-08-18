// ============================================================================
// today.js — the "היום" (Today) tab: the redesign's new default landing
// screen. Answers one question - "what should we do today?" - by reusing
// data and helpers that already exist elsewhere rather than computing or
// inventing anything new:
//   - weather/trip-day text: already fetched/computed by js/dashboard.js
//     (fetchDashWeather(), updateDashToday()) into #dash-weather/#dash-today;
//     copied from there the same way js/app-shell.js's gtSyncTopbar() already
//     copies them into the sticky top bar - one fetch, several readers.
//   - sunset: js/solar.js's solarCorfuTimes(), a pure/synchronous computation
//     (no network call of its own).
//   - "what's on today": window.DESTINATION.itineraryDays' real, fact-checked
//     dayBrief for window._currentTripDayNum (js/itinerary-data.js), rendered
//     with the same gtPriorityGroupHtml()/gtSunsetNoteHtml()/
//     gtDayComputedTotals() helpers js/itinerary-view.js's own day view uses -
//     a condensed teaser, not a second copy of that view's markup.
//
// Rendering is split the same way js/dashboard.js's own load already is:
// renderTodayTab() builds the static shell ONCE (js/ui.js ensureTabRendered,
// same as every other lazy-rendered tab), refreshTodayTab() repaints the
// time-sensitive parts (greeting/weather/day) on every visit AND whenever
// the values it reads change out from under it (see the refreshTodayTab()
// calls added to js/dashboard.js's updateDashToday()/fetchDashWeather()).
// ============================================================================

const TODAY_GREETINGS = [
    { maxHour: 5, text: 'לילה טוב', icon: '🌙' },
    { maxHour: 12, text: 'בוקר טוב', icon: '☀️' },
    { maxHour: 17, text: 'צהריים טובים', icon: '🌤️' },
    { maxHour: 20, text: 'ערב טוב', icon: '🌇' },
    { maxHour: 24, text: 'לילה טוב', icon: '🌙' }
];

function gtTodayGreeting(now) {
    const hour = Number(new Intl.DateTimeFormat('en-GB', {
        timeZone: (typeof TRIP_TIMEZONE === 'string') ? TRIP_TIMEZONE : 'Europe/Athens',
        hour: '2-digit', hour12: false
    }).format(now));
    return TODAY_GREETINGS.find(g => hour < g.maxHour) || TODAY_GREETINGS[TODAY_GREETINGS.length - 1];
}

function gtTodayDateLabel(now) {
    if (typeof formatWeekdayHe !== 'function' || typeof formatDateDM !== 'function') return '';
    return `יום ${formatWeekdayHe(now)}, ${formatDateDM(now)}`;
}

// A condensed teaser of the real day brief - the anchor (mustDo) and a
// handful of optional ideas, not the full Itinerary view's overview/weather
// fold/flex fold. "View the full day" links out to that richer view rather
// than duplicating it here.
function gtTodayBriefHtml(day) {
    if (!day || !day.dayBrief) return '';
    const brief = day.dayBrief;
    const totals = (typeof gtDayComputedTotals === 'function') ? gtDayComputedTotals(day) : {};
    const groups = [
        (typeof gtPriorityGroupHtml === 'function') ? gtPriorityGroupHtml(brief.mustDo, 'must', 'הלב של היום', '⭐') : '',
        (typeof gtPriorityGroupHtml === 'function') ? gtPriorityGroupHtml((brief.optional || []).slice(0, 4), 'opt', 'אם יש לכם אנרגיה נוספת', '🌿') : ''
    ].join('');
    const sunsetHtml = (typeof gtSunsetNoteHtml === 'function') ? gtSunsetNoteHtml(day, totals) : '';

    return `<section class="gt-day-brief" aria-label="סקירת היום">
      ${brief.theme ? `<p class="gt-day-brief__theme">${escapeHtml(brief.theme)}</p>` : ''}
      ${groups ? `<div class="gt-day-prio gt-judgment">${groups}</div>` : ''}
      ${sunsetHtml}
      <button type="button" class="gt-btn gt-btn--secondary" style="width:100%;margin-top:var(--gt-space-3);" onclick="gtTodayOpenFullDay('${escapeAttr(day.key)}')">מסלול היום המלא ←</button>
    </section>`;
}

function gtTodayOpenFullDay(dayKey) {
    switchTab('itinerary');
    setTimeout(() => {
        if (typeof gtSelectItineraryDay === 'function') gtSelectItineraryDay(dayKey);
    }, 150);
}
window.gtTodayOpenFullDay = gtTodayOpenFullDay;

function gtTodayGoDiscover(catKey) {
    switchTab('explore');
    setTimeout(() => {
        if (typeof selectExploreCategory === 'function') selectExploreCategory(catKey, null);
    }, 150);
}
window.gtTodayGoDiscover = gtTodayGoDiscover;

function refreshTodayTab() {
    const root = document.getElementById('today');
    if (!root) return;

    const now = new Date();
    const greeting = gtTodayGreeting(now);
    const greetEl = document.getElementById('today-greeting');
    if (greetEl) greetEl.textContent = `${greeting.text} ${greeting.icon}`;
    const dateEl = document.getElementById('today-date');
    if (dateEl) dateEl.textContent = gtTodayDateLabel(now);

    // Trip-day status line - copied from #dash-today, same pattern as
    // js/app-shell.js's gtSyncTopbar(). Covers pre-trip/post-trip states
    // (it already reads honestly as "הטיול מתחיל בעוד X ימים" / "הטיול
    // הסתיים") without this file needing its own copy of that logic.
    const dashToday = document.getElementById('dash-today');
    const statusEl = document.getElementById('today-status');
    if (statusEl) statusEl.textContent = dashToday ? dashToday.textContent : '—';

    // Weather + sunset stat row. Weather text is copied (not re-fetched) from
    // #dash-weather - js/dashboard.js's fetchDashWeather() already calls
    // refreshTodayTab() itself once that fetch resolves either way, so this
    // never needs to poll.
    const dashWeather = document.getElementById('dash-weather');
    const solar = (typeof solarCorfuTimes === 'function') ? solarCorfuTimes(now) : null;
    const statsEl = document.getElementById('today-stats');
    if (statsEl && typeof gtStatHtml === 'function') {
        const stats = [];
        stats.push(gtStatHtml('🌡️', 'מזג אוויר', dashWeather ? dashWeather.textContent : 'טוען...'));
        if (solar) stats.push(gtStatHtml('🌇', 'שקיעה', solar.sunset, true));
        statsEl.innerHTML = stats.join('');
    }

    // Today's real itinerary day, if the trip is currently running.
    const briefWrap = document.getElementById('today-brief-wrap');
    if (briefWrap) {
        const dayNum = window._currentTripDayNum;
        const day = (typeof findItineraryDay === 'function' && typeof dayNum === 'number')
            ? findItineraryDay(String(dayNum)) : null;
        briefWrap.innerHTML = day ? gtTodayBriefHtml(day) : '';
    }
}
window.refreshTodayTab = refreshTodayTab;

function renderTodayTab() {
    refreshTodayTab();
}
window.renderTodayTab = renderTodayTab;

// ============================================================================
// today.js — the "היום" (Today) tab: the redesign's premium landing screen.
// Answers one question - "what should we do today?" - by reusing data and
// rendering helpers that already exist elsewhere rather than computing or
// inventing anything new:
//   - weather/trip-day text: already fetched/computed by js/dashboard.js
//     (fetchDashWeather(), updateDashToday()) into #dash-weather/#dash-today;
//     copied from there the same way js/app-shell.js's gtSyncTopbar() already
//     copies them into the sticky top bar - one fetch, several readers.
//   - sunrise/sunset: js/solar.js's solarCorfuTimes(), a pure/synchronous
//     computation (no network call of its own).
//   - "your day" timeline: today's real, already fact-checked
//     window.DESTINATION.itineraryDays item list + transitions
//     (js/itinerary-data.js), rendered with js/itinerary-view.js's own
//     gtItineraryRowCardHtml()/gtTransitionConnectorHtml() - the exact same
//     row markup the Itinerary tab renders, not a second timeline design.
//     Tapping a row opens the exact same gtOpenItinerarySheet() detail sheet
//     Itinerary uses (see the gtItineraryCurrentItems hookup below).
//   - anchor / "if you feel like it" / "if you still have energy": the
//     day's real dayBrief.mustDo/recommended/optional, via the same
//     gtPriorityGroupHtml() the Itinerary day view renders them with.
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

// The "mood" line: the day's real theme (a short phrase) plus its real
// overview's first paragraph as the one editorial sentence under it -
// already-authored content, not a newly written blurb.
function gtTodayMoodHtml(day) {
    if (!day || !day.dayBrief) return '';
    const brief = day.dayBrief;
    let firstP = '';
    if (brief.overview) {
        const el = document.createElement('div');
        el.innerHTML = brief.overview;
        const p = el.querySelector('p');
        firstP = p ? p.textContent.trim() : '';
    }
    return `<div class="gt-today-card gt-today-mood-card">
      ${brief.theme ? `<p class="gt-today-mood-card__theme">${escapeHtml(brief.theme)}</p>` : ''}
      ${firstP ? `<p class="gt-today-mood-card__line">${escapeHtml(firstP)}</p>` : ''}
    </div>`;
}

// -- Anchor (Phase 3) --------------------------------------------------------
// "If we only do one thing today, what is it?" - dayBrief.mustDo[0], the
// day's real single anchor (every day names at least one - see
// scripts/test-itinerary-brief.js), promoted into its own dominant card
// ahead of the timeline instead of living inside the priority-tier list
// alongside recommended/optional (which visually flattened it to "just the
// first of three equally-weighted groups"). A day very occasionally names
// more than one mustDo entry (rare - most days name exactly one); the rest,
// if any, still render in the recommended/optional card below via
// gtTodayPrioritiesHtml(), not dropped.
function gtTodayAnchorHtml(day) {
    if (!day || !day.dayBrief || !day.dayBrief.mustDo || !day.dayBrief.mustDo.length) return '';
    const anchor = day.dayBrief.mustDo[0];
    return `<div class="gt-today-anchor">
      <p class="gt-today-anchor__eyebrow">⭐ אם עושים רק דבר אחד היום</p>
      <p class="gt-today-anchor__title">${escapeHtml(anchor.title)}</p>
      ${anchor.why ? `<p class="gt-today-anchor__why">${escapeHtml(anchor.why)}</p>` : ''}
      <button type="button" class="gt-btn gt-btn--primary" onclick="gtTodayOpenFullDay('${escapeAttr(day.key)}')">ללוח היום המלא ←</button>
    </div>`;
}

// -- "Your day" as a story, not a schedule (Phase 3) -------------------------
// Same real time-stamped items + connectors as before (row-card + connector
// markup the Itinerary tab uses, js/itinerary-view.js) - only new here is a
// "Morning/Afternoon/Evening" narrative label ahead of each part-of-day's
// first item, derived from the item's OWN real time string (gtItemStartEnd(),
// already used elsewhere for exactly this kind of parsing) rather than a
// second, hand-authored grouping. gtItineraryCurrentItems is shared,
// module-top-level state that gtOpenItinerarySheet() reads by index -
// pointing it at today's items here is correct, not a hack: the Itinerary
// tab's own default day IS today's day (see initItineraryScrubberView()), so
// this never disagrees with it.
const GT_DAY_PARTS = [
    { max: 12 * 60, label: 'בוקר' },
    { max: 17 * 60, label: 'אחר הצהריים' },
    { max: 24 * 60, label: 'ערב' }
];
function gtDayPartLabel(timeText) {
    const se = (typeof gtItemStartEnd === 'function') ? gtItemStartEnd(timeText) : null;
    if (!se || se.start == null) return null;
    const part = GT_DAY_PARTS.find(p => se.start < p.max);
    return part ? part.label : null;
}

function gtTodayTimelineHtml(day) {
    if (!day || !day.items || !day.items.length) return '';
    if (typeof gtItineraryRowCardHtml !== 'function') return '';

    gtItineraryCurrentItems = day.items;

    let rows = '';
    const tr = day.transitions || {};
    if (tr.fromHotel) {
        rows += gtHotelEndpointHtml();
        rows += gtTransitionConnectorHtml(tr.fromHotel);
    }
    let lastPart = null;
    day.items.forEach((item, i) => {
        const part = gtDayPartLabel(item.time);
        if (part && part !== lastPart) {
            rows += `<p class="gt-today-timeline__part">${escapeHtml(part)}</p>`;
            lastPart = part;
        }
        rows += gtItineraryRowCardHtml(item, i);
        if (i < day.items.length - 1) rows += gtTransitionConnectorHtml((tr.between || [])[i]);
    });
    if (tr.toHotel) {
        rows += gtTransitionConnectorHtml(tr.toHotel);
        rows += gtHotelEndpointHtml();
    }

    return `<div class="gt-today-card">
      <p class="gt-today-card__heading">איך היום נראה</p>
      <div id="today-timeline-list" class="gt-explore-list">${rows}</div>
    </div>`;
}

document.addEventListener('click', (e) => {
    const list = e.target.closest('#today-timeline-list');
    if (!list) return;
    const row = e.target.closest('.gt-itinerary-row');
    if (!row || typeof gtOpenItinerarySheet !== 'function') return;
    gtOpenItinerarySheet(Number(row.getAttribute('data-gt-row-index')));
});

// "אם יש לכם כוח" / "אם עוד יש לכם כוח" - the two lighter, skippable tiers
// (mustDo's first entry is now the dominant Anchor card above; any FURTHER
// mustDo entries beyond the first still render here so nothing is dropped),
// plus the sunset note. "View the full day" links to the richer Itinerary
// view (overview prose, weather fold, flex-time fold) rather than
// duplicating those here.
function gtTodayPrioritiesHtml(day) {
    if (!day || !day.dayBrief) return '';
    const brief = day.dayBrief;
    const totals = (typeof gtDayComputedTotals === 'function') ? gtDayComputedTotals(day) : {};
    const extraMustDo = (brief.mustDo || []).slice(1);
    const groups = [
        (typeof gtPriorityGroupHtml === 'function' && extraMustDo.length) ? gtPriorityGroupHtml(extraMustDo, 'must', 'עוד לב של היום', '⭐') : '',
        (typeof gtPriorityGroupHtml === 'function') ? gtPriorityGroupHtml(brief.recommended, 'rec', 'אם אתם כבר באזור', '💡') : '',
        (typeof gtPriorityGroupHtml === 'function') ? gtPriorityGroupHtml(brief.optional, 'opt', 'אם עוד יש לכם כוח', '🌿') : ''
    ].join('');
    const sunsetHtml = (typeof gtSunsetNoteHtml === 'function') ? gtSunsetNoteHtml(day, totals) : '';
    if (!groups && !sunsetHtml) return '';

    return `<div class="gt-today-card gt-today-card--light">
      ${groups ? `<div class="gt-day-prio gt-judgment">${groups}</div>` : ''}
      ${sunsetHtml}
      <button type="button" class="gt-btn gt-btn--secondary" style="width:100%;margin-top:var(--gt-space-3);" onclick="gtTodayOpenFullDay('${escapeAttr(day.key)}')">מסלול היום המלא ←</button>
    </div>`;
}

// "כבר קרובים למלון?" (Phase 3) - the same real "near you" engine the Map
// tab's own sheet uses (js/location-shared.js gtNearHotelItems(), real
// haversine distance, no invented picks), surfaced contextually on Today
// too rather than only behind a map button. Deliberately small (3, not 5) -
// this is a supporting nudge, not another full list to scan.
function gtTodayNearbyHtml() {
    if (typeof gtNearHotelItems !== 'function' || typeof exploreRowCardHtml !== 'function') return '';
    const items = gtNearHotelItems(3);
    if (!items.length) return '';
    return `<div class="gt-today-card gt-today-card--light">
      <p class="gt-today-card__heading">כבר קרובים למלון?</p>
      <div id="today-nearby-list" class="gt-explore-list">${items.map(x => exploreRowCardHtml(x.item, x.catKey)).join('')}</div>
    </div>`;
}

// Pre-trip / post-trip: no real "today" day exists yet (or any more) - shown
// honestly rather than fabricating a plan, with a link into the trip's
// actual first day so the screen still gives you somewhere useful to go.
function gtTodayFallbackHtml() {
    const firstDay = (typeof findItineraryDay === 'function') ? findItineraryDay('1') : null;
    const cta = firstDay
        ? `<button type="button" class="gt-btn gt-btn--secondary" style="margin-top:var(--gt-space-3);" onclick="gtTodayOpenFullDay('1')">צפייה ביום הראשון ←</button>`
        : '';
    return `<div class="gt-today-card" style="text-align:center;">
      <p class="gt-body">אין עדיין יום פעיל בטיול - ברגע שהטיול יתחיל, כאן תראו בדיוק מה קורה היום.</p>
      ${cta}
    </div>`;
}

function refreshTodayTab() {
    const root = document.getElementById('today');
    if (!root) return;

    const now = new Date();
    const greeting = gtTodayGreeting(now);
    const greetEl = document.getElementById('today-greeting');
    if (greetEl) greetEl.textContent = `${greeting.text} ${greeting.icon}`;
    const dateEl = document.getElementById('today-date');
    if (dateEl) dateEl.textContent = gtTodayDateLabel(now);

    // Hero stat row: weather text is copied (not re-fetched) from
    // #dash-weather - js/dashboard.js's fetchDashWeather() already calls
    // refreshTodayTab() itself once that fetch resolves either way, so this
    // never needs to poll. Sunrise/sunset are a synchronous computation.
    const dashWeather = document.getElementById('dash-weather');
    const solar = (typeof solarCorfuTimes === 'function') ? solarCorfuTimes(now) : null;
    const statsEl = document.getElementById('today-stats');
    if (statsEl) {
        const stats = [];
        stats.push(`<span class="gt-today-hero__stat gt-today-hero__stat--temp">${escapeHtml(dashWeather ? dashWeather.textContent : 'טוען...')}</span>`);
        if (solar) {
            stats.push(`<span class="gt-today-hero__stat">🌅 <span dir="ltr">${escapeHtml(solar.sunrise)}</span></span>`);
            stats.push(`<span class="gt-today-hero__stat">🌇 <span dir="ltr">${escapeHtml(solar.sunset)}</span></span>`);
        }
        statsEl.innerHTML = stats.join('');
    }

    const dayNum = window._currentTripDayNum;
    const day = (typeof findItineraryDay === 'function' && typeof dayNum === 'number')
        ? findItineraryDay(String(dayNum)) : null;

    const moodWrap = document.getElementById('today-mood-wrap');
    const anchorWrap = document.getElementById('today-anchor-wrap');
    const timelineWrap = document.getElementById('today-timeline-wrap');
    const prioritiesWrap = document.getElementById('today-priorities-wrap');
    const nearbyWrap = document.getElementById('today-nearby-wrap');

    if (day) {
        if (moodWrap) moodWrap.innerHTML = gtTodayMoodHtml(day);
        if (anchorWrap) anchorWrap.innerHTML = gtTodayAnchorHtml(day);
        if (timelineWrap) timelineWrap.innerHTML = gtTodayTimelineHtml(day);
        if (prioritiesWrap) prioritiesWrap.innerHTML = gtTodayPrioritiesHtml(day);
        if (nearbyWrap) nearbyWrap.innerHTML = gtTodayNearbyHtml();
        if (typeof initFavoriteButtons === 'function') initFavoriteButtons();
    } else {
        if (moodWrap) moodWrap.innerHTML = gtTodayFallbackHtml();
        if (anchorWrap) anchorWrap.innerHTML = '';
        if (timelineWrap) timelineWrap.innerHTML = '';
        if (prioritiesWrap) prioritiesWrap.innerHTML = '';
        if (nearbyWrap) nearbyWrap.innerHTML = '';
    }
}
window.refreshTodayTab = refreshTodayTab;

function renderTodayTab() {
    refreshTodayTab();
}
window.renderTodayTab = renderTodayTab;

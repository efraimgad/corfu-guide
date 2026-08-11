// ============================================================================
// itinerary-view.js — Phase 4, batch 3 (day-scrubber + row-card view), now
// rewritten for Phase A of the old-DOM subtraction effort.
//
// This is the itinerary tab's only presentation layer: it renders entirely
// from js/itinerary-data.js's window.ITINERARY_DAYS (the single source of
// truth for all 9 itinerary entries - see that file's own header comment)
// instead of reading/relocating the old #day-N-body accordion DOM, which
// has been physically deleted from index.html. Every control it authors
// (day-complete checkbox, budget input, map button, day-swap select/status)
// is a freshly-created element carrying the exact same classes and
// data-* attributes the old (relocated) ones did, so js/itinerary.js's
// toggleDayComplete()/updateDayBudgetActual()/applyDaySwapUI()/setDaySwap()
// - which all locate their targets by class + data-attribute selector, not
// by DOM position - keep working unchanged.
// ============================================================================

// -- Scrubber (7 numbered days + 2 dashed alt-day pills) --------------------
// role="tab"/aria-selected turns this into a real ARIA tablist (the
// container declares role="tablist" in index.html, with
// onkeydown="handleTablistKeydown(event)" wired to the exact same
// RTL-aware arrow-key/Home/End handler (js/ui.js) that already drives the
// main premium-nav tablist - not a new keyboard implementation.
// aria-current stays alongside aria-selected purely for the existing CSS
// hook (.gt-scrubber__day[aria-current="true"]) - no visual change.
function gtRenderItineraryScrubber() {
    const el = document.getElementById('gt-itinerary-scrubber');
    if (!el) return;
    let html = '';
    for (let n = 1; n <= 7; n++) {
        html += `<button type="button" class="gt-scrubber__day" role="tab" data-gt-scrubber-key="${n}" aria-current="false" aria-selected="false">יום ${n}</button>`;
    }
    html += `<button type="button" class="gt-scrubber__day gt-scrubber__day--alt" role="tab" data-gt-scrubber-key="alt-paxos" aria-current="false" aria-selected="false" style="gap:6px;"><svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h16l-2 5H6Z"/><path d="M6 14V9h5l3 5"/><path d="M12 9V4"/></svg> פאקסוס</button>`;
    html += `<button type="button" class="gt-scrubber__day gt-scrubber__day--alt" role="tab" data-gt-scrubber-key="alt-pantokrator" aria-current="false" aria-selected="false" style="gap:6px;"><svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18 9 7l4 6 2-3 6 8Z"/></svg> פנטוקרטור</button>`;
    el.innerHTML = html;
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('#gt-itinerary-scrubber [data-gt-scrubber-key]');
    if (!btn) return;
    gtSelectItineraryDay(btn.getAttribute('data-gt-scrubber-key'));
});

// Reflects the current day-swap state (js/itinerary.js DAY_SWAP_KEY) onto
// the scrubber pills: the numbered day currently replaced gets dimmed +
// struck through, the alt pill replacing it gets a highlighted ring. Called
// from applyDaySwapUI() itself (one additive line there) so it can never
// drift out of sync with the real swap state.
function gtSyncItineraryScrubberSwapState(swaps) {
    const scrubber = document.getElementById('gt-itinerary-scrubber');
    if (!scrubber) return;
    scrubber.querySelectorAll('[data-gt-scrubber-key]').forEach(btn => {
        btn.classList.remove('gt-scrubber__day--swapped', 'gt-scrubber__day--replacing');
    });
    Object.keys(swaps || {}).forEach(cardId => {
        const dayNum = swaps[cardId];
        const dayBtn = scrubber.querySelector(`[data-gt-scrubber-key="${dayNum}"]`);
        const altBtn = scrubber.querySelector(`[data-gt-scrubber-key="${cardId}"]`);
        if (dayBtn) dayBtn.classList.add('gt-scrubber__day--swapped');
        if (altBtn) altBtn.classList.add('gt-scrubber__day--replacing');
    });
    // Re-render whatever's currently selected too, in case a swap changed
    // what should show in its context bar (e.g. viewing the day that just
    // got swapped out, or the alt day that just got swapped in).
    if (gtItinerarySelectedKey) gtSelectItineraryDay(gtItinerarySelectedKey);
}
window.gtSyncItineraryScrubberSwapState = gtSyncItineraryScrubberSwapState;

// Strips HTML tags for contexts that need plain text (aria-label, the
// sheet's own time line) - a tiny detached <div>, never inserted into the
// page, mirrors the same approach js/itinerary.js's data-annotation
// functions use.
function gtStripTags(html) {
    const el = document.createElement('div');
    el.innerHTML = html || '';
    return el.textContent || '';
}

// -- Row-card list, built from the selected day/alt-card's real items -------
let gtItineraryCurrentItems = [];
let gtItinerarySelectedKey = null;

// Pulls the row-visible facts out of an item's already-annotated .html
// (dinner/price-flag/warning content already filled in by js/itinerary.js
// at load time - see that file's fillItineraryPriceFlags()/
// fillItineraryDinnerHooks()/checkDayVenueWarnings()) via the same
// "parse into a detached <div>, never insert it" pattern gtStripTags()
// above and those very annotation functions already use - never a regex
// over the raw HTML string.
//
// Returns:
//   - desc: the first <p> inside .premium-event-desc (the actual
//     descriptive sentence - never the cost/duration/vibe <ul> that
//     follows it), as plain text for the 2-line-clamped row summary.
//   - duration: the "משך מומלץ:" <li>'s value text (e.g. "שעה - שעה וחצי").
//   - cost: the "עלות:" <li>'s value text. Used in place of a separate
//     "place" field - the data has no clean standalone venue/location
//     name distinct from the title (a title like "🏰 המבצר הישן (Palaio
//     Frourio)" IS the place; stripping its emoji would just repeat the
//     title as filler), while cost is real, present, reliably parseable
//     data that adds new information instead of duplicating what's
//     already on the row. See js/itinerary-view.js's header/report for
//     the full reasoning.
function gtParseItineraryItemHtml(html) {
    const el = document.createElement('div');
    el.innerHTML = html || '';
    const result = { desc: '', duration: '', cost: '' };
    const descBlock = el.querySelector('.premium-event-desc');
    if (!descBlock) return result;

    const firstP = descBlock.querySelector('p');
    if (firstP) result.desc = (firstP.textContent || '').trim();

    descBlock.querySelectorAll('ul > li').forEach(li => {
        const text = (li.textContent || '').trim();
        if (text.indexOf('משך מומלץ:') !== -1) {
            result.duration = text.split('משך מומלץ:')[1].trim();
        } else if (text.indexOf('עלות:') !== -1) {
            result.cost = text.split('עלות:')[1].trim();
        }
    });
    return result;
}

// Row anatomy (RTL: the time rail is the visual/reading-order *start*, i.e.
// the right edge - it's authored first in the markup, same convention
// js/explore.js's .gt-explore-row uses for its own leading thumbnail):
//   1. .gt-itinerary-row__time  - fixed-width time rail, tabular figures.
//   2. .gt-itinerary-row__body, containing:
//      - .gt-itinerary-row__title - ~17-18px/700 (reuses --gt-text-lg,
//        already the token scale's closest "H3/emphasized body" size).
//      - .gt-itinerary-row__desc  - the item's real first sentence,
//        2-line-clamped (never more - see the CSS rule for why this needs
//        both -webkit-line-clamp and its cross-browser support props).
//      - .gt-itinerary-row__meta  - duration + cost (see
//        gtParseItineraryItemHtml() above for why cost, not a fabricated
//        "place"), plus the existing warning/price-flag badge.
function gtItineraryRowCardHtml(item, index) {
    const time = item.time || '';
    const title = item.title || '';
    const parsed = gtParseItineraryItemHtml(item.html);

    // Status badge: reuses whatever js/itinerary.js already computed for
    // this exact item (checkDayVenueWarnings() -> item.hasWarning,
    // fillItineraryPriceFlags() -> item.hasPriceFlag) - both annotated onto
    // the data structure at load time, before this ever renders. Nothing
    // here recomputes either check.
    let badge = '';
    if (item.hasWarning) badge = `<span class="gt-status gt-status--closed">${GT_ICON_WARNING} אזהרה</span>`;
    else if (item.hasPriceFlag) badge = `<span class="gt-status gt-status--soon">${GT_ICON_EURO} הערת מחיר</span>`;

    const metaParts = [];
    if (parsed.duration) metaParts.push(`<span class="gt-inline-icon">${GT_ICON_CLOCK} ${escapeHtml(parsed.duration)}</span>`);
    if (parsed.cost) metaParts.push(`<span class="gt-inline-icon">${GT_ICON_EURO} ${escapeHtml(parsed.cost)}</span>`);
    if (badge) metaParts.push(badge);
    const metaHtml = metaParts.length
        ? `<div class="gt-itinerary-row__meta">${metaParts.join('<span class="sep">•</span>')}</div>`
        : '';

    return `<button type="button" class="gt-row-card gt-itinerary-row" data-gt-row-index="${index}" aria-label="${escapeAttr(gtStripTags(title))}">
      <div class="gt-itinerary-row__time gt-tabular">${escapeHtml(time)}</div>
      <div class="gt-itinerary-row__body">
        <p class="gt-itinerary-row__title">${title}</p>
        ${parsed.desc ? `<p class="gt-itinerary-row__desc">${escapeHtml(parsed.desc)}</p>` : ''}
        ${metaHtml}
      </div>
    </button>`;
}

// Compact "what's next, how do I get there" connector rendered between two
// consecutive row-cards (and, when the day's transitions data says so,
// before the first/after the last card as a trip-to/from-the-hotel leg).
// Deliberately NOT a card: a couple of centered lines of icon+time+distance,
// reusing the exact km/min already researched into each day's own
// `transitions` field (js/itinerary-data.js) - never a separately-invented
// number. `null` in a day's `transitions.between` array
// means "same spot, not worth a connector" (e.g. two items at the same
// hotel/venue) and renders nothing, same as the gap already looked before
// this feature existed.
function gtTransitionConnectorHtml(t) {
    if (!t) return '';
    let icon, metricText, ariaText;
    if (t.mode === 'walk') {
        icon = '🚶';
        const distText = t.m ? `${t.m} מ׳` : (t.km ? `${t.km} ק"מ` : '');
        metricText = distText ? `${t.min} דק׳ · ${distText}` : `${t.min} דק׳`;
        ariaText = `הליכה, ${metricText}`;
    } else if (t.mode === 'boat') {
        icon = '⛴️';
        metricText = t.min ? `${t.min} דק׳ שייט` : 'שייט ים';
        ariaText = metricText;
    } else if (t.mode === 'bus') {
        icon = '🚌';
        metricText = `${t.min} דק׳`;
        ariaText = `אוטובוס, ${metricText}`;
    } else {
        icon = '🚗';
        metricText = `${t.min} דק׳ · ${t.km} ק"מ`;
        ariaText = `נסיעה, ${metricText}`;
    }
    const boatPrefix = t.boatFirst ? '⛴️ + ' : '';
    const parkingHtml = t.parking ? `<div class="gt-route-connector__parking">🅿️ ${escapeHtml(t.parking)}</div>` : '';
    return `<div class="gt-route-connector" role="note" aria-label="${escapeAttr(ariaText)}">
      <span class="gt-route-connector__arrow" aria-hidden="true">↓</span>
      <span class="gt-route-connector__metric gt-tabular">${boatPrefix}${icon} ${escapeHtml(metricText)}</span>
      ${parkingHtml}
    </div>`;
}

function gtHotelEndpointHtml() {
    return `<div class="gt-route-connector__hotel">🏨 המלון</div>`;
}

function gtRenderItineraryRowList(items, transitions) {
    gtItineraryCurrentItems = items;
    const listEl = document.getElementById('gt-itinerary-row-list');
    const emptyEl = document.getElementById('gt-itinerary-empty');
    if (!listEl) return;
    if (!items.length) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    let html = '';
    if (transitions && transitions.fromHotel) {
        html += gtHotelEndpointHtml();
        html += gtTransitionConnectorHtml(transitions.fromHotel);
    }
    items.forEach((item, i) => {
        html += gtItineraryRowCardHtml(item, i);
        const between = transitions && transitions.between ? transitions.between[i] : null;
        if (i < items.length - 1) html += gtTransitionConnectorHtml(between);
    });
    if (transitions && transitions.toHotel) {
        html += gtTransitionConnectorHtml(transitions.toHotel);
        html += gtHotelEndpointHtml();
    }
    listEl.innerHTML = html;
}

document.addEventListener('click', (e) => {
    const list = document.getElementById('gt-itinerary-row-list');
    if (!list || !list.contains(e.target)) return;
    const row = e.target.closest('.gt-itinerary-row');
    if (!row) return;
    gtOpenItinerarySheet(Number(row.getAttribute('data-gt-row-index')));
});
// No separate keydown listener needed: .gt-itinerary-row is now a real
// <button> (see gtItineraryRowCardHtml() above), so the browser itself
// turns Enter/Space into a native click event - the delegated click
// listener above (which finds the row via closest('.gt-itinerary-row'),
// not by tag) already handles that for free.

// Numbered-day swap-<select> option list is always days 2-6 (never Day
// 1/7, the fixed arrival/departure days) - same static set the old markup
// hardcoded for both optional cards, kept here rather than in
// js/itinerary-data.js since it's UI chrome, not itinerary content.
const GT_SWAP_DAY_OPTIONS = ['2', '3', '4', '5', '6'];
const GT_SWAP_ARIA_LABEL = {
    'alt-paxos': 'החליפו את שייט פאקסוס עם איזה יום ממוספר',
    'alt-pantokrator': 'החליפו את יום הפנטוקרטור עם איזה יום ממוספר'
};

// -- Day-context bar (numbered days) / swap-bar (alt days) ------------------
// Selecting a day: build the context/swap bar for this day/card from
// js/itinerary-data.js, authoring the checkbox/budget-input/map-button (or
// swap-select/status) fresh with the exact classes + data-* attributes
// js/itinerary.js's toggleDayComplete()/updateDayBudgetActual()/
// applyDaySwapUI()/setDaySwap() already locate their targets by - and
// baking in each control's current persisted-state value directly (since,
// unlike the old always-present-in-DOM markup these controls used to be
// relocated from, they now exist only while this day/card is the one
// currently selected - so js/itinerary.js's own init-time DOM sweeps
// (initTripProgress()/initDayBudgetInputs(), which run once at load,
// before any of this has rendered) can't be relied on to set their
// initial state; this function does that itself instead). Then rebuilds
// the row-card list from that day/card's real items.
function gtSelectItineraryDay(key) {
    gtItinerarySelectedKey = key;
    document.querySelectorAll('#gt-itinerary-scrubber [data-gt-scrubber-key]').forEach(btn => {
        const isSelected = btn.getAttribute('data-gt-scrubber-key') === key;
        btn.setAttribute('aria-current', String(isSelected));
        btn.setAttribute('aria-selected', String(isSelected));
    });

    const contextEl = document.getElementById('gt-itinerary-context');
    if (!contextEl) return;

    const day = typeof findItineraryDay === 'function' ? findItineraryDay(key) : null;
    if (!day) return;

    if (!day.isAlt) {
        const dayNum = day.dayNumber;
        const titleText = gtItineraryDayTitle(day);
        const subtitleText = gtItineraryDaySubtitle(day);

        contextEl.innerHTML = `
          <div class="gt-itinerary-context">
            <div style="min-width:0;">
              <p class="gt-h3" style="color:#fff;">${titleText}</p>
              ${subtitleText ? `<p class="gt-meta" style="color:rgba(255,255,255,.75);">${subtitleText}</p>` : ''}
            </div>
            <div class="gt-itinerary-context__actions" id="gt-itinerary-context-actions"></div>
          </div>`;

        const actions = document.getElementById('gt-itinerary-context-actions');
        const completed = (typeof getCompletedDays === 'function') ? getCompletedDays() : [];
        const isChecked = completed.includes(String(dayNum));
        const budgetMap = (typeof getDayBudgetActuals === 'function') ? getDayBudgetActuals() : {};
        const budgetVal = budgetMap[dayNum] != null ? budgetMap[dayNum] : '';

        actions.innerHTML = `<label class="flex items-center gap-2 shrink-0 bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-3 py-2 cursor-pointer text-sm font-semibold select-none" onclick="event.stopPropagation()"><input type="checkbox" class="day-complete-checkbox w-5 h-5 accent-emerald-400 rounded" data-day="${dayNum}" onchange="toggleDayComplete(this)"${isChecked ? ' checked' : ''}> הושלם</label><label class="flex items-center gap-1.5 shrink-0 bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-3 py-2 text-sm font-semibold select-none" onclick="event.stopPropagation()">${GT_ICON_EURO}<input type="number" min="0" step="1" inputmode="numeric" class="day-budget-input w-20 bg-white/20 text-white placeholder-white/60 rounded-lg px-1.5 py-1 text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-white/60" data-day="${dayNum}" placeholder="בפועל" aria-label="הוצאה בפועל ביום ${dayNum} (יורו)" oninput="updateDayBudgetActual(this)" onclick="event.stopPropagation()" value="${escapeAttr(String(budgetVal))}"></label><button onclick="event.stopPropagation(); openDayMap(${dayNum});" class="shrink-0 bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-3 py-2 text-sm font-semibold" style="display:inline-flex;align-items:center;justify-content:center;" title="הצג את תחנות היום הזה על המפה (אם לא נמצאו תחנות ממופות, תוצג מפת האי המלאה)" aria-label="הצג את תחנות היום הזה על המפה">${GT_ICON_MAP}</button>`;

        gtRenderItineraryAreaLabel(day);
        gtRenderItineraryBrief(day);
        gtRenderItineraryRowList(day.items, day.transitions);
        gtRenderItineraryDaySummary(day);
    } else {
        const swaps = (typeof getDaySwaps === 'function') ? getDaySwaps() : {};
        const selectedDay = swaps[key] || '';
        const statusText = selectedDay ? `✅ החליף את יום ${selectedDay}` : '';
        const ariaLabel = GT_SWAP_ARIA_LABEL[key] || 'החליפו יום';

        contextEl.innerHTML = `
          <div class="gt-itinerary-context gt-itinerary-context--swap">
            <div style="min-width:0;">
              <p class="gt-eyebrow" style="color:rgba(255,255,255,.7);">יום חלופי</p>
              <p class="gt-h3" style="color:#fff;">${escapeHtml(day.title)}</p>
              ${day.subtitle ? `<p class="gt-meta" style="color:rgba(255,255,255,.75);">${escapeHtml(day.subtitle)}</p>` : ''}
              ${day.hint ? `<p class="gt-meta" style="color:#ffe9b3;margin-top:4px;">${escapeHtml(day.hint)}</p>` : ''}
            </div>
            <div class="gt-itinerary-context__actions" id="gt-itinerary-context-actions"></div>
          </div>`;

        const actions = document.getElementById('gt-itinerary-context-actions');
        const options = GT_SWAP_DAY_OPTIONS.map(d =>
            `<option value="${d}"${selectedDay === d ? ' selected' : ''}>יום ${d}</option>`
        ).join('');
        actions.innerHTML = `<label class="text-sm font-semibold text-white/90 flex items-center gap-2">🔁 החליפו עם יום:
            <select class="day-swap-select rounded-lg px-2 py-1.5 text-sm font-semibold text-gray-900" data-swap-card="${key}" onchange="setDaySwap('${key}', this.value)" aria-label="${escapeAttr(ariaLabel)}">
              <option value="">ללא (רק אופציה, לא הוחלף)</option>
              ${options}
            </select>
          </label>
          <span class="day-swap-status text-xs font-bold bg-white/15 px-2 py-1 rounded-full" data-swap-status="${key}">${escapeHtml(statusText)}</span>`;

        gtRenderItineraryAreaLabel(day);
        gtRenderItineraryBrief(day);
        gtRenderItineraryRowList(day.items, day.transitions);
        gtRenderItineraryDaySummary(day);
    }

    // These freshly-authored elements can carry trip-private hooks
    // (js/dashboard.js's fillTripPrivateHooks(), e.g. Day 1's hotel-name
    // span in its title) that only ever get filled by querying the live
    // DOM - which, for whichever control this render just created, didn't
    // exist yet the one time fillTripPrivateHooks() ran at page load.
    if (typeof fillTripPrivateHooks === 'function') fillTripPrivateHooks();
}
window.gtSelectItineraryDay = gtSelectItineraryDay;

// -- Day area label -----------------------------------------------------------
// A single small "📍 אזור היום: X" line from js/itinerary-data.js's per-day
// `dayArea` string - replaces the old full route-info card (hotel->stop
// chain, per-leg list, totals, parking/walking paragraphs, estimate note).
// That card became redundant once the same km/min/parking facts started
// showing inline as compact connectors between the row-cards themselves
// (gtTransitionConnectorHtml() below) - this is deliberately just a label,
// not a revival of that card in smaller type.
function gtRenderItineraryAreaLabel(day) {
    const el = document.getElementById('gt-itinerary-route-info');
    if (!el) return;
    const area = day && day.dayArea;
    el.innerHTML = area ? `<p class="gt-itinerary-area-label">📍 אזור היום: ${escapeHtml(area)}</p>` : '';
}

// ============================================================================
// -- Day brief / day summary --------------------------------------------------
//
// The row-card timeline above answers "what happens next". These two blocks
// answer the questions it structurally cannot: why this day exists, how heavy
// it is, what actually matters on it, and what to cut when the day goes wrong.
//
// Everything here reads js/itinerary-data.js's per-day `dayBrief` EXCEPT the
// numbers, which are computed from that same day's existing `transitions` legs
// and its items' own time strings (gtDayComputedTotals() below). That's
// deliberate: a hand-typed "about 75 minutes of driving" is a second number for
// a fact the `transitions` array already states leg by leg, and the two drift
// apart the first time a leg is edited. Nothing in the brief restates a number
// the timeline already owns.
//
// Three tiers of certainty are kept visually distinct, so nothing reads as more
// certain than it is:
//   - verified  - venue hours/ratings, surfaced through the EXISTING dinner-hook
//                 and price-flag mechanisms, carrying their own verifiedOn stamp.
//   - computed  - the totals below, derived, never authored.
//   - judgment  - pace, priorities, what to skip, best moment. Always rendered
//                 under .gt-judgment, which prints an explicit "המלצה שלנו"
//                 marker. These are planning opinions and are labelled as such.
// ============================================================================

const GT_PACE = {
    relaxed:  { label: 'רגוע',  icon: '🌿' },
    balanced: { label: 'מאוזן', icon: '⚖️' },
    active:   { label: 'פעיל',  icon: '⚡' }
};

const GT_BEST_FOR = {
    beach:       '🏖️ חוף',
    nature:      '🌿 טבע',
    food:        '🍽️ אוכל',
    villages:    '🏘️ כפרים',
    sightseeing: '🏛️ אתרים',
    history:     '📜 היסטוריה',
    sunset:      '🌅 שקיעה',
    couples:     '💞 זוגי',
    water:       '🤿 מים',
    scenic:      '🚗 נסיעה נופית',
    logistics:   '🧳 לוגיסטיקה'
};

// Start-of-day / end-of-day from the items' own time strings. Most items carry
// a "HH:MM - HH:MM" range that js/itinerary.js's parseTimeRange() already
// understands; the last item of several days is an open-ended "20:30 ואילך"
// ("20:30 onwards"), which has a start but deliberately no end - so that form
// is read for its start only and never invented an end for.
function gtItemStartEnd(timeText) {
    const range = (typeof parseTimeRange === 'function') ? parseTimeRange(timeText) : null;
    if (range) return range;
    const m = /(\d{1,2}):(\d{2})/.exec(timeText || '');
    if (!m) return null;
    const start = Number(m[1]) * 60 + Number(m[2]);
    return { start: start, end: null };
}

function gtFormatMinutes(min) {
    if (!min) return '0 דק׳';
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (!h) return `${m} דק׳`;
    if (!m) return `${h} שע׳`;
    return `${h} שע׳ ${m} דק׳`;
}

function gtFormatClock(min) {
    if (min == null) return '';
    return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

// Every number the brief and the summary show. Derived only - see this
// section's header for why none of this is stored on the day.
function gtDayComputedTotals(day) {
    const tr = day.transitions || {};
    const legs = [tr.fromHotel].concat(tr.between || [], [tr.toHotel]).filter(Boolean);
    const out = { driveMin: 0, driveKm: 0, walkMin: 0, boatLegs: 0, startMin: null, endMin: null };

    legs.forEach(leg => {
        if (leg.mode === 'drive') {
            out.driveMin += leg.min || 0;
            out.driveKm += leg.km || 0;
        } else if (leg.mode === 'walk') {
            out.walkMin += leg.min || 0;
        } else if (leg.mode === 'boat') {
            out.boatLegs += 1;
        }
    });

    (day.items || []).forEach(item => {
        const se = gtItemStartEnd(item.time);
        if (!se) return;
        if (out.startMin == null || se.start < out.startMin) out.startMin = se.start;
        const finish = se.end != null ? se.end : se.start;
        if (out.endMin == null || finish > out.endMin) out.endMin = finish;
    });

    return out;
}

function gtStatHtml(icon, label, value) {
    return `<div class="gt-day-stat">
      <span class="gt-day-stat__icon" aria-hidden="true">${icon}</span>
      <span class="gt-day-stat__label">${escapeHtml(label)}</span>
      <span class="gt-day-stat__value gt-tabular">${escapeHtml(value)}</span>
    </div>`;
}

function gtDayStatsHtml(totals) {
    const parts = [];
    if (totals.startMin != null) {
        const span = totals.endMin != null && totals.endMin > totals.startMin
            ? `${gtFormatClock(totals.startMin)}–${gtFormatClock(totals.endMin)}`
            : gtFormatClock(totals.startMin);
        parts.push(gtStatHtml('🕘', 'טווח היום', span));
    }
    if (totals.driveMin) {
        const km = totals.driveKm ? ` · ${Math.round(totals.driveKm)} ק"מ` : '';
        parts.push(gtStatHtml('🚗', 'נהיגה', gtFormatMinutes(totals.driveMin) + km));
    }
    if (totals.walkMin) parts.push(gtStatHtml('🚶', 'הליכה בין תחנות', gtFormatMinutes(totals.walkMin)));
    if (totals.boatLegs) parts.push(gtStatHtml('⛴️', 'הפלגות', String(totals.boatLegs)));
    return parts.length ? `<div class="gt-day-stats">${parts.join('')}</div>` : '';
}

// One priority group (must-do / recommended / optional). Renders nothing at
// all when the day has no entries of that rank - an empty "Optional" heading
// is noise, not structure.
function gtPriorityGroupHtml(entries, modifier, label, icon) {
    if (!entries || !entries.length) return '';
    const rows = entries.map(e => `<li class="gt-day-prio__item">
        <span class="gt-day-prio__title">${escapeHtml(e.title)}</span>
        ${e.why ? `<span class="gt-day-prio__why">${escapeHtml(e.why)}</span>` : ''}
      </li>`).join('');
    return `<div class="gt-day-prio__group gt-day-prio__group--${modifier}">
      <p class="gt-day-prio__label"><span aria-hidden="true">${icon}</span> ${escapeHtml(label)}</p>
      <ul class="gt-day-prio__list">${rows}</ul>
    </div>`;
}

// A <details> fold. Native disclosure rather than a JS-driven accordion: it is
// keyboard- and screen-reader-correct for free, survives the day-switch
// re-render with no state to restore, and needs no open/close handler of its
// own. Collapsed by default so the default view stays short on a phone.
function gtDayFoldHtml(summaryIcon, summaryLabel, bodyHtml, extraClass) {
    if (!bodyHtml) return '';
    return `<details class="gt-day-fold ${extraClass || ''}">
      <summary class="gt-day-fold__summary"><span aria-hidden="true">${summaryIcon}</span> ${escapeHtml(summaryLabel)}</summary>
      <div class="gt-day-fold__body">${bodyHtml}</div>
    </details>`;
}

// The weather fold. The rain case is NOT newly written here: it renders the
// day's existing `rainAlt` HTML, which js/itinerary-data.js has carried as
// real fact-checked content all along while no view displayed it - even
// though the itinerary intro in index.html promises "a detailed backup plan
// for every day in case of rain" in bold. Surfacing it is the whole fix.
function gtDayWeatherHtml(day) {
    const brief = day.dayBrief || {};
    const w = brief.weather || {};
    const rows = [];
    if (w.sun) rows.push(`<div class="gt-day-weather__row"><span class="gt-day-weather__icon" aria-hidden="true">☀️</span><div><p class="gt-day-weather__label">יום שמשי</p><div class="gt-day-weather__text">${w.sun}</div></div></div>`);
    if (w.cloud) rows.push(`<div class="gt-day-weather__row"><span class="gt-day-weather__icon" aria-hidden="true">🌥️</span><div><p class="gt-day-weather__label">יום מעונן</p><div class="gt-day-weather__text">${w.cloud}</div></div></div>`);
    if (day.rainAlt) rows.push(`<div class="gt-day-weather__row"><span class="gt-day-weather__icon" aria-hidden="true">🌧️</span><div><p class="gt-day-weather__label">יום גשום - תוכנית חלופית</p><div class="gt-day-weather__text">${day.rainAlt}</div></div></div>`);
    return rows.join('');
}

function gtRenderItineraryBrief(day) {
    const el = document.getElementById('gt-itinerary-brief');
    if (!el) return;
    const brief = day && day.dayBrief;
    if (!brief) { el.innerHTML = ''; return; }

    const totals = gtDayComputedTotals(day);
    const pace = GT_PACE[brief.pace];
    const chips = [];
    if (pace) chips.push(`<span class="gt-chip gt-chip--pace gt-chip--pace-${escapeAttr(brief.pace)}">${pace.icon} קצב ${escapeHtml(pace.label)}</span>`);
    (brief.bestFor || []).forEach(k => {
        if (GT_BEST_FOR[k]) chips.push(`<span class="gt-chip gt-chip--facet">${GT_BEST_FOR[k]}</span>`);
    });

    const priorities = [
        gtPriorityGroupHtml(brief.mustDo, 'must', 'חובה', '⭐'),
        gtPriorityGroupHtml(brief.recommended, 'rec', 'מומלץ', '👍'),
        gtPriorityGroupHtml(brief.optional, 'opt', 'אופציונלי', '➕')
    ].join('');

    const flexRows = [];
    if (brief.ifTired) flexRows.push(`<div class="gt-day-flex__row"><p class="gt-day-flex__label">😴 אם נגמר לנו הכוח</p><div class="gt-day-flex__text">${brief.ifTired}</div></div>`);
    if (brief.ifEnergy) flexRows.push(`<div class="gt-day-flex__row"><p class="gt-day-flex__label">⚡ אם יש לנו אנרגיה</p><div class="gt-day-flex__text">${brief.ifEnergy}</div></div>`);
    if (brief.skipFirst) flexRows.push(`<div class="gt-day-flex__row"><p class="gt-day-flex__label">✂️ מה מוותרים עליו ראשון</p><div class="gt-day-flex__text">${escapeHtml(brief.skipFirst)}</div></div>`);

    el.innerHTML = `<section class="gt-day-brief" aria-label="סקירת היום">
      ${brief.theme ? `<p class="gt-day-brief__theme">${escapeHtml(brief.theme)}</p>` : ''}
      ${chips.length ? `<div class="gt-day-brief__chips">${chips.join('')}</div>` : ''}
      ${gtDayStatsHtml(totals)}
      ${brief.overview ? `<div class="gt-day-brief__overview">${brief.overview}</div>` : ''}
      ${priorities ? `<div class="gt-day-prio gt-judgment">${priorities}</div>` : ''}
      ${gtDayFoldHtml('🌦️', 'מה עושים לפי מזג האוויר', gtDayWeatherHtml(day), 'gt-day-fold--weather')}
      ${gtDayFoldHtml('🎚️', 'לקצר או להאריך את היום', flexRows.length ? `<div class="gt-day-flex gt-judgment">${flexRows.join('')}</div>` : '', 'gt-day-fold--flex')}
    </section>`;
}

// Closing block under the timeline: the three things worth remembering, the
// same computed totals restated once at the point of decision, and the single
// moment worth looking forward to.
function gtRenderItineraryDaySummary(day) {
    const el = document.getElementById('gt-itinerary-summary');
    if (!el) return;
    const brief = day && day.dayBrief;
    if (!brief) { el.innerHTML = ''; return; }

    const totals = gtDayComputedTotals(day);
    const pace = GT_PACE[brief.pace];
    const highlights = (brief.highlights || []).map(h => `<li>${escapeHtml(h)}</li>`).join('');

    const facts = [];
    if (totals.driveMin) facts.push(`<div class="gt-day-summary__fact"><span class="gt-day-summary__fact-label">סה"כ נהיגה</span><span class="gt-day-summary__fact-value gt-tabular">${escapeHtml(gtFormatMinutes(totals.driveMin))}</span></div>`);
    if (totals.startMin != null) facts.push(`<div class="gt-day-summary__fact"><span class="gt-day-summary__fact-label">יציאה מומלצת</span><span class="gt-day-summary__fact-value gt-tabular">${escapeHtml(gtFormatClock(totals.startMin))}</span></div>`);
    if (pace) facts.push(`<div class="gt-day-summary__fact"><span class="gt-day-summary__fact-label">עומס היום</span><span class="gt-day-summary__fact-value">${pace.icon} ${escapeHtml(pace.label)}</span></div>`);

    el.innerHTML = `<section class="gt-day-summary" aria-label="סיכום היום">
      <p class="gt-day-summary__title">📌 סיכום היום</p>
      ${highlights ? `<ul class="gt-day-summary__highlights">${highlights}</ul>` : ''}
      ${facts.length ? `<div class="gt-day-summary__facts">${facts.join('')}</div>` : ''}
      ${brief.bestMoment ? `<p class="gt-day-summary__moment"><span aria-hidden="true">✨</span> <strong>הרגע של היום:</strong> ${escapeHtml(brief.bestMoment)}</p>` : ''}
    </section>`;
}

// -- Tap-to-open detail sheet -------------------------------------------------
// Now that the row itself already shows the item's first descriptive
// sentence (gtItineraryRowCardHtml() above), the sheet's job is the LONG
// TAIL only: the rest of .premium-event-desc (the cost/duration/vibe list -
// vibe/atmosphere never made it onto the row, so it only lives here), the
// full .premium-tip-box content (tips, detailed warnings/logistics), any
// dinner-slot venue details (hours/phone/price - filled in by
// fillItineraryDinnerHooks()), and the full annotated warning/price-flag
// HTML (checkDayVenueWarnings()/fillItineraryPriceFlags()). Every fact
// reachable from the old sheet stays reachable here - only the one sentence
// now duplicated on the row itself is removed, via a detached-<div> parse
// (same pattern as gtParseItineraryItemHtml() above), to avoid showing it
// twice.
let gtItinerarySheetTriggerEl = null;

function gtItinerarySheetBodyHtml(html) {
    const el = document.createElement('div');
    el.innerHTML = html || '';
    const firstP = el.querySelector('.premium-event-desc p');
    if (firstP) firstP.remove();
    return el.innerHTML;
}

function gtOpenItinerarySheet(index) {
    const item = gtItineraryCurrentItems[index];
    if (!item) return;

    const titleOut = document.getElementById('gt-itinerary-sheet-title');
    const timeOut = document.getElementById('gt-itinerary-sheet-time');
    const bodyOut = document.getElementById('gt-itinerary-sheet-body');
    const sheet = document.getElementById('gt-itinerary-sheet');
    const backdrop = document.getElementById('gt-itinerary-sheet-backdrop');
    if (!sheet || !backdrop || !titleOut || !bodyOut) return;

    titleOut.innerHTML = item.title || '';
    if (timeOut) timeOut.textContent = item.time || '';
    bodyOut.innerHTML = gtItinerarySheetBodyHtml(item.html);

    if (typeof fillTripPrivateHooks === 'function') fillTripPrivateHooks();

    gtItinerarySheetTriggerEl = document.activeElement;
    backdrop.classList.remove('hidden');
    sheet.classList.remove('hidden');
    document.body.classList.add('modal-open');
    const closeBtn = sheet.querySelector('.gt-itinerary-sheet-close');
    if (closeBtn) closeBtn.focus();
}
window.gtOpenItinerarySheet = gtOpenItinerarySheet;

function gtCloseItinerarySheet() {
    const sheet = document.getElementById('gt-itinerary-sheet');
    const backdrop = document.getElementById('gt-itinerary-sheet-backdrop');
    if (sheet) sheet.classList.add('hidden');
    if (backdrop) backdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
    if (gtItinerarySheetTriggerEl) gtItinerarySheetTriggerEl.focus();
}
window.gtCloseItinerarySheet = gtCloseItinerarySheet;

// Escape closes the sheet, and Tab/Shift+Tab are trapped inside it while
// it's open - same convention as the existing emergency modal (js/ui.js).
document.addEventListener('keydown', (e) => {
    const sheet = document.getElementById('gt-itinerary-sheet');
    if (!sheet || sheet.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
        gtCloseItinerarySheet();
        return;
    }

    if (e.key === 'Tab') {
        const focusable = sheet.querySelectorAll(
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

// -- Init ---------------------------------------------------------------------
// Runs once on load (js/init.js), after fillItineraryDinnerHooks()/
// fillItineraryPriceFlags()/checkDayVenueWarnings() have already annotated
// window.ITINERARY_DAYS with the live content and computed warnings this
// view only reads. Defaults to today's real trip day
// (window._currentTripDayNum, set by js/dashboard.js) when it's one of the
// 7 numbered days, else Day 1.
function initItineraryScrubberView() {
    gtRenderItineraryScrubber();
    const d = window._currentTripDayNum;
    const initial = (typeof d === 'number' && d >= 1 && d <= 7) ? String(d) : '1';
    gtSelectItineraryDay(initial);
}
window.initItineraryScrubberView = initItineraryScrubberView;

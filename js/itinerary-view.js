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

function gtRenderItineraryRowList(items) {
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
    listEl.innerHTML = items.map((item, i) => gtItineraryRowCardHtml(item, i)).join('');
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

        gtRenderItineraryRouteInfo(day);
        gtRenderItineraryRowList(day.items);
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

        gtRenderItineraryRouteInfo(day);
        gtRenderItineraryRowList(day.items);
    }

    // These freshly-authored elements can carry trip-private hooks
    // (js/dashboard.js's fillTripPrivateHooks(), e.g. Day 1's hotel-name
    // span in its title) that only ever get filled by querying the live
    // DOM - which, for whichever control this render just created, didn't
    // exist yet the one time fillTripPrivateHooks() ran at page load.
    if (typeof fillTripPrivateHooks === 'function') fillTripPrivateHooks();
}
window.gtSelectItineraryDay = gtSelectItineraryDay;

// -- Route/driving-distance info card (per day) ------------------------------
// Renders js/itinerary-data.js's per-day routeInfo (hotel -> stop -> ... ->
// hotel chain, real-world-researched km/min per leg, parking/walking
// guidance) into #gt-itinerary-route-info. All distances/times were looked
// up from public routing/travel sources (not live turn-by-turn routing, and
// not invented) - see each leg's own `note` and the day's `estimateNote`,
// both surfaced here so the estimate caveat is never separated from the
// numbers it qualifies.
function gtRouteLegHtml(leg) {
    if (leg.walk) {
        return `<div class="gt-route-leg gt-route-leg--walk"><span class="gt-route-leg__stops">${escapeHtml(leg.from)} → ${escapeHtml(leg.to)}</span><span class="gt-route-leg__metric">🚶 הליכה - ללא נסיעה</span>${leg.note ? `<span class="gt-route-leg__note">${escapeHtml(leg.note)}</span>` : ''}</div>`;
    }
    if (leg.boat) {
        return `<div class="gt-route-leg gt-route-leg--boat"><span class="gt-route-leg__stops">${escapeHtml(leg.from)} → ${escapeHtml(leg.to)}</span><span class="gt-route-leg__metric">⛴️ שייט ים</span>${leg.note ? `<span class="gt-route-leg__note">${escapeHtml(leg.note)}</span>` : ''}</div>`;
    }
    return `<div class="gt-route-leg"><span class="gt-route-leg__stops">${escapeHtml(leg.from)} → ${escapeHtml(leg.to)}</span><span class="gt-route-leg__metric gt-tabular">🚗 ${leg.km} ק"מ · ${leg.min} דק'</span>${leg.note ? `<span class="gt-route-leg__note">${escapeHtml(leg.note)}</span>` : ''}</div>`;
}

function gtFormatDurationHe(totalMin) {
    const hours = Math.floor(totalMin / 60);
    const mins = Math.round(totalMin % 60);
    const hoursPart = hours === 0 ? '' : (hours === 1 ? 'שעה ' : `${hours} שעות `);
    return `${hoursPart}${mins} דק'`;
}

function gtItineraryRouteInfoHtml(day) {
    const info = day && day.routeInfo;
    if (!info) return '';
    const legsHtml = (info.legs || []).map(gtRouteLegHtml).join('');
    const routeChain = (info.route || []).join(' ← ');
    return `<div class="gt-route-info-card" role="region" aria-label="מידע מסלול ומרחקי נהיגה ליום זה">
        <div class="gt-route-info-card__header">
            <span class="gt-route-info-card__area">📍 ${escapeHtml(info.area || '')}</span>
            ${info.fixed ? '<span class="gt-route-info-card__fixed">קבוע - לא חלק מהאופטימיזציה</span>' : ''}
        </div>
        <p class="gt-route-info-card__chain">${escapeHtml(routeChain)}</p>
        <div class="gt-route-info-card__legs">${legsHtml}</div>
        <div class="gt-route-info-card__totals">
            <span class="gt-tabular"><strong>סה"כ נהיגה משוערת:</strong> ${info.totalKm} ק"מ · ${gtFormatDurationHe(info.totalMin)}</span>
        </div>
        ${info.parking ? `<p class="gt-route-info-card__tip"><strong>🅿️ חניה:</strong> ${escapeHtml(info.parking)}</p>` : ''}
        ${info.walking ? `<p class="gt-route-info-card__tip"><strong>🚶 הליכה:</strong> ${escapeHtml(info.walking)}</p>` : ''}
        ${info.estimateNote ? `<p class="gt-route-info-card__estimate">⚠️ ${escapeHtml(info.estimateNote)}</p>` : ''}
    </div>`;
}

function gtRenderItineraryRouteInfo(day) {
    const el = document.getElementById('gt-itinerary-route-info');
    if (!el) return;
    el.innerHTML = gtItineraryRouteInfoHtml(day);
}

// -- Trip-wide optimization summary ------------------------------------------
// Sums the real touring days' (2-6) own routeInfo.totalKm/totalMin - never a
// hand-typed grand total - so this can never drift out of sync with the
// per-day numbers shown above. Days 1/7 (fixed airport transfers) and the
// two optional/alternative days are intentionally excluded: they aren't
// part of the geographic-optimization pass this summary reports on.
function gtRenderItineraryOptimizationSummary() {
    const el = document.getElementById('gt-itinerary-optimization-summary');
    if (!el || typeof window.ITINERARY_DAYS === 'undefined') return;
    const touringDays = window.ITINERARY_DAYS.filter(d => !d.isAlt && d.dayNumber >= 2 && d.dayNumber <= 6 && d.routeInfo);
    if (!touringDays.length) return;
    const totalKm = touringDays.reduce((sum, d) => sum + (d.routeInfo.totalKm || 0), 0);
    const totalMin = touringDays.reduce((sum, d) => sum + (d.routeInfo.totalMin || 0), 0);

    el.innerHTML = `<details class="gt-optimization-summary">
        <summary class="gt-optimization-summary__toggle">🧭 סיכום אופטימיזציית המסלול (למה הימים מסודרים ככה)</summary>
        <div class="gt-optimization-summary__body">
            <p>המסלול נבדק כבעיה גיאוגרפית אחת - כל 5 ימי הסיור (ימים 2-6) מהמלון בגוביה נבנו כ"קרן" (hub-and-spoke) נפרדת לכל אזור באי, כדי למנוע נסיעות כפולות דרך אותו אזור בימים שונים: <strong>יום 2</strong> = מרכז/קורפו טאון+קאנוני, <strong>יום 3</strong> = חוף צפון-מזרחי, <strong>יום 4</strong> = פלאוקסטריצה במערב, <strong>יום 5</strong> = דרום האי, <strong>יום 6</strong> = קצה צפון-מערבי.</p>
            <p><strong>סה"כ נהיגה משוערת ל-5 ימי הסיור:</strong> <span class="gt-tabular">~${Math.round(totalKm)} ק"מ · ${gtFormatDurationHe(totalMin)} נהיגה</span> (סכום הערכות המרחק/זמן לכל יום, ראו כרטיס "מסלול ומרחקים" בכל יום).</p>
            <p>בתוך כל יום, סדר העצירות כבר נבדק ונשמר כשהוא מונוטוני מבחינה גיאוגרפית (למשל יום 3 עולה צפונה לאורך החוף בלי לחזור אחורה; יום 5 חוצה את הדרום פעם אחת בלבד ממערב למזרח) - לא נדרש שינוי סדר.</p>
            <p><strong>שינוי גלובלי אחד שנבדק ונדחה במכוון:</strong> קסיופי (סוף יום 3) וסידארי (תחילת יום 6) מרוחקים כ-23 ק"מ/כ-25 דק' נסיעה זה מזה בכביש הפנימי הצפוני - טכנית ניתן לאחד את שני הימים ללולאה צפונית אחת ולחסוך יום נסיעה שלם מהמלון. עם זאת, איחוד כזה ידחוס 8 אתרי דגל (ברבטי, קאלאמי, אגני, קסיופי, סידארי, קייפ דראסטיס, פרולדס ולוגאס) ליום אחד ארוך ולחוץ - בניגוד לדרישה לשמור על מסלול ריאלי ומהנה. לכן שני הימים נשארו נפרדים, כל אחד כלולאה יעילה משלו.</p>
            <p class="gt-optimization-summary__caveat">⚠️ <strong>לגבי מספרי "לפני/אחרי":</strong> המסלול המקורי שסופק כבר היה מאורגן גיאוגרפית (כל יום = אזור אחד באי) ולא נבדק אי-פעם כרשימת עצירות לא-ממוינת - כך שאין "מסלול מקורי גרוע יותר" עם מרחק כולל שונה לחשב מולו ביושר. השינוי שבוצע כאן הוא הוספת מרחקים/זמנים אמיתיים ומאומתים לכל מקטע (עד כה לא הופיעו במסלול כלל) ואימות שאין הזדמנות אופטימיזציה שהוחמצה - לא שינוי בפועל של סדר העצירות. כל המרחקים/זמנים המוצגים הם הערכות שנאספו ממקורות ניתוב/תיירות ציבוריים (לא ניתוב חי בזמן אמת) - יש לאמת מול Google Maps/Waze סמוך למועד הנסיעה.</p>
        </div>
    </details>`;
}
window.gtRenderItineraryOptimizationSummary = gtRenderItineraryOptimizationSummary;

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
    gtRenderItineraryOptimizationSummary();
}
window.initItineraryScrubberView = initItineraryScrubberView;

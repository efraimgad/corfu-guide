// ============================================================================
// itinerary-view.js — Phase 4, batch 3: the new day-scrubber + row-card
// itinerary view for the "מסלול" tab.
//
// This is a NEW presentation layer only. It never re-authors or duplicates
// any itinerary content: it reads the existing (real, fact-checked) day
// cards already in #itinerary - #day-N-body's .premium-timeline-item blocks,
// the checkbox/budget-input/map-button already wired up in js/itinerary.js,
// the day-swap <select>/status span already wired up by setDaySwap()/
// applyDaySwapUI() - and either moves those exact DOM nodes into the new
// compact UI (checkbox/budget/map-button/swap-select: same node, same
// listeners, same data-day attribute, no duplicate ids) or clones their
// content read-only (a timeline item's full description, for the tap-open
// sheet). The old accordion cards stay in the DOM, hidden via
// .gt-legacy-hidden (see index.html), so search indexing (js/search.js,
// which reads #day-N-body/.premium-timeline-item directly) and the
// day-map-matching test (which reads #day-N-body's textContent) are both
// completely unaffected by anything in this file.
// ============================================================================

// -- Node relocation: move (not clone) the real checkbox/budget-input/map
//    button/swap-select into the new context bar for whichever day is
//    currently selected, and move it back before selecting a different day
//    - so exactly one live copy of each control ever exists, its id-less
//    class+data-day lookup (js/itinerary.js) keeps working unchanged, and
//    the old accordion header it came from is left structurally intact
//    (just missing that one child while it's on loan) rather than modified.
// ----------------------------------------------------------------------------
// Each relocated element gets its own comment-node placeholder left behind
// at its original position, rather than remembering its old nextSibling -
// several of these nodes are siblings of each other (checkbox-label,
// budget-label, map-button all live side by side in the same day header),
// so by the time one gets restored, a sibling recorded as "its" nextSibling
// may itself have already been relocated elsewhere and no longer be a
// child of the same parent, which would make insertBefore throw. A private
// placeholder per element has no such cross-dependency.
const gtRelocatedNodes = [];
function gtRelocate(el, container) {
    if (!el || !container) return;
    if (!el._gtPlaceholder) {
        const marker = document.createComment('gt-relocated');
        el.parentNode.insertBefore(marker, el);
        el._gtPlaceholder = marker;
    }
    gtRelocatedNodes.push(el);
    container.appendChild(el);
}
function gtRestoreRelocatedNodes() {
    gtRelocatedNodes.forEach(el => {
        if (el._gtPlaceholder && el._gtPlaceholder.parentNode) {
            el._gtPlaceholder.parentNode.insertBefore(el, el._gtPlaceholder);
            el._gtPlaceholder.remove();
        }
        el._gtPlaceholder = null;
    });
    gtRelocatedNodes.length = 0;
}

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
    html += `<button type="button" class="gt-scrubber__day gt-scrubber__day--alt" role="tab" data-gt-scrubber-key="alt-paxos" aria-current="false" aria-selected="false">⛴️ פאקסוס</button>`;
    html += `<button type="button" class="gt-scrubber__day gt-scrubber__day--alt" role="tab" data-gt-scrubber-key="alt-pantokrator" aria-current="false" aria-selected="false">⛰️ פנטוקרטור</button>`;
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

// -- Row-card list, built by reading the selected day's real timeline -------
let gtItineraryCurrentItems = [];
let gtItinerarySelectedKey = null;

function gtItineraryRowCardHtml(item, index) {
    const timeEl = item.querySelector('.premium-time-badge');
    const titleEl = item.querySelector('.premium-event-title');
    if (!titleEl) return '';
    const time = timeEl ? timeEl.textContent.trim() : '';
    const title = titleEl.textContent.trim();
    const contentCol = item.querySelector('.premium-content-col');

    // Status badge: reuses whatever js/itinerary.js already computed for
    // this exact event block - a closedDays/verifiedHours conflict
    // (checkDayVenueWarnings, inserted as [data-venue-warning-id]) or a
    // price caveat (fillItineraryPriceFlags, [data-price-flag-id] - only
    // still present in the DOM if it had a real message to show, since
    // that function removes the placeholder entirely otherwise). Nothing
    // here recomputes either check.
    const hasWarning = !!(contentCol && contentCol.querySelector('[data-venue-warning-id]'));
    const hasPriceFlag = !!(contentCol && contentCol.querySelector('[data-price-flag-id]'));
    let badge = '';
    if (hasWarning) badge = '<span class="gt-status gt-status--closed">⚠️ אזהרה</span>';
    else if (hasPriceFlag) badge = '<span class="gt-status gt-status--soon">💶 הערת מחיר</span>';

    return `<div class="gt-row-card gt-itinerary-row" data-gt-row-index="${index}" tabindex="0" role="button" aria-label="${escapeAttr(title)}">
      <div class="gt-row-card__body">
        <p class="gt-row-card__meta gt-tabular" style="margin-top:0;">${escapeHtml(time)}</p>
        <p class="gt-row-card__title" style="white-space:normal;">${escapeHtml(title)}</p>
        ${badge ? `<div class="gt-row-card__meta">${badge}</div>` : ''}
      </div>
    </div>`;
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
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const row = e.target.closest && e.target.closest('.gt-itinerary-row');
    if (!row) return;
    e.preventDefault();
    gtOpenItinerarySheet(Number(row.getAttribute('data-gt-row-index')));
});

// -- Day-context bar (numbered days) / swap-bar (alt days) ------------------
// Selecting a day: restore whichever controls were on loan to a previously
// selected day/alt card, then build the new context/swap bar and relocate
// this selection's own controls into it, then rebuild the row-card list
// from that day/card's real timeline.
function gtSelectItineraryDay(key) {
    gtItinerarySelectedKey = key;
    document.querySelectorAll('#gt-itinerary-scrubber [data-gt-scrubber-key]').forEach(btn => {
        const isSelected = btn.getAttribute('data-gt-scrubber-key') === key;
        btn.setAttribute('aria-current', String(isSelected));
        btn.setAttribute('aria-selected', String(isSelected));
    });

    gtRestoreRelocatedNodes();
    const contextEl = document.getElementById('gt-itinerary-context');
    if (!contextEl) return;

    const isAlt = key === 'alt-paxos' || key === 'alt-pantokrator';

    if (!isAlt) {
        const dayNum = key;
        const header = document.querySelector(`.premium-day-card[data-day-number="${dayNum}"] .premium-day-header`);
        const body = document.getElementById(`day-${dayNum}-body`);
        if (!header || !body) return;
        const titleEl = header.querySelector('h3');
        const subEl = titleEl ? titleEl.nextElementSibling : null;

        contextEl.innerHTML = `
          <div class="gt-itinerary-context">
            <div style="min-width:0;">
              <p class="gt-h3" style="color:#fff;">${titleEl ? escapeHtml(titleEl.textContent.trim()) : ''}</p>
              ${subEl && subEl.tagName === 'P' ? `<p class="gt-meta" style="color:rgba(255,255,255,.75);">${escapeHtml(subEl.textContent.trim())}</p>` : ''}
            </div>
            <div class="gt-itinerary-context__actions" id="gt-itinerary-context-actions"></div>
          </div>`;

        const actions = document.getElementById('gt-itinerary-context-actions');
        const checkbox = document.querySelector(`.day-complete-checkbox[data-day="${dayNum}"]`);
        const budgetInput = document.querySelector(`.day-budget-input[data-day="${dayNum}"]`);
        const mapBtn = header.querySelector(`button[onclick*="openDayMap(${dayNum})"]`);
        if (checkbox && checkbox.closest('label')) gtRelocate(checkbox.closest('label'), actions);
        if (budgetInput && budgetInput.closest('label')) gtRelocate(budgetInput.closest('label'), actions);
        if (mapBtn) gtRelocate(mapBtn, actions);

        gtRenderItineraryRowList(Array.from(body.querySelectorAll('.premium-timeline-item')));
    } else {
        const card = document.querySelector(`.premium-day-card[data-optional-card="${key}"]`);
        if (!card) return;
        const header = card.querySelector('.premium-day-header');
        const body = header.nextElementSibling;
        const titleEl = header.querySelector('h4');
        const subEl = titleEl ? titleEl.nextElementSibling : null;
        const hintEl = titleEl ? titleEl.previousElementSibling : null;

        contextEl.innerHTML = `
          <div class="gt-itinerary-context gt-itinerary-context--swap">
            <div style="min-width:0;">
              <p class="gt-eyebrow" style="color:rgba(255,255,255,.7);">יום חלופי</p>
              <p class="gt-h3" style="color:#fff;">${titleEl ? escapeHtml(titleEl.textContent.trim()) : ''}</p>
              ${subEl && subEl.tagName === 'P' ? `<p class="gt-meta" style="color:rgba(255,255,255,.75);">${escapeHtml(subEl.textContent.trim())}</p>` : ''}
              ${hintEl ? `<p class="gt-meta" style="color:#ffe9b3;margin-top:4px;">${escapeHtml(hintEl.textContent.trim())}</p>` : ''}
            </div>
            <div class="gt-itinerary-context__actions" id="gt-itinerary-context-actions"></div>
          </div>`;

        const actions = document.getElementById('gt-itinerary-context-actions');
        const select = header.querySelector('.day-swap-select');
        const status = header.querySelector('[data-swap-status]');
        if (select && select.closest('label')) gtRelocate(select.closest('label'), actions);
        if (status) gtRelocate(status, actions);

        gtRenderItineraryRowList(body ? Array.from(body.querySelectorAll('.premium-timeline-item')) : []);
    }
}
window.gtSelectItineraryDay = gtSelectItineraryDay;

// -- Tap-to-open detail sheet -------------------------------------------------
// Clones (never moves) the matching .premium-content-col's real innerHTML -
// the exact same fact-checked description/tip/warning content the old
// accordion shows, just surfaced in a sheet instead of an expanded card.
// The event title is stripped from the clone since the sheet already shows
// it in its own header.
let gtItinerarySheetTriggerEl = null;

function gtOpenItinerarySheet(index) {
    const item = gtItineraryCurrentItems[index];
    if (!item) return;
    const titleEl = item.querySelector('.premium-event-title');
    const timeEl = item.querySelector('.premium-time-badge');
    const contentCol = item.querySelector('.premium-content-col');

    const titleOut = document.getElementById('gt-itinerary-sheet-title');
    const timeOut = document.getElementById('gt-itinerary-sheet-time');
    const bodyOut = document.getElementById('gt-itinerary-sheet-body');
    const sheet = document.getElementById('gt-itinerary-sheet');
    const backdrop = document.getElementById('gt-itinerary-sheet-backdrop');
    if (!sheet || !backdrop || !titleOut || !bodyOut) return;

    titleOut.textContent = titleEl ? titleEl.textContent.trim() : '';
    if (timeOut) timeOut.textContent = timeEl ? timeEl.textContent.trim() : '';

    let bodyHtml = '';
    if (contentCol) {
        const clone = contentCol.cloneNode(true);
        const h4 = clone.querySelector('.premium-event-title');
        if (h4) h4.remove();
        bodyHtml = clone.innerHTML;
    }
    bodyOut.innerHTML = bodyHtml;

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
// fillItineraryPriceFlags()/checkDayVenueWarnings() have already filled in
// the live content and computed warnings this view only reads. Defaults to
// today's real trip day (window._currentTripDayNum, set by js/dashboard.js)
// when it's one of the 7 numbered days, else Day 1.
function initItineraryScrubberView() {
    gtRenderItineraryScrubber();
    const d = window._currentTripDayNum;
    const initial = (typeof d === 'number' && d >= 1 && d <= 7) ? String(d) : '1';
    gtSelectItineraryDay(initial);
}
window.initItineraryScrubberView = initItineraryScrubberView;

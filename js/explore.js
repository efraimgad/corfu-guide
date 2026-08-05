// ============================================================================
// explore.js — Phase 4, batch 2: the unified "גלה" (Explore) tab.
//
// Beaches/food/attractions/gems used to be four separate tabs, each with its
// own full-detail card grid (js/cards.js) and its own tag-filter (js/filters.js).
// This file adds a NEW, additive view over the exact same data source
// (window.CORFU_LOCATIONS, js/locations-data.js) - a compact .gt-row-card
// list + shared category chips + the existing whole-island map (js/map.js) -
// without touching or deleting any of that. The four old tabs stay in the
// DOM, fully working, as the established hidden fallback.
//
// "activities" is one of the five categories named in the Phase 3 spec, but
// is deliberately NOT one of the four chips here: CORFU_LOCATIONS has no
// `activities` array (the #activities tab is hand-written HTML, not
// data-driven - see index.html) and css/design-system.css defines no
// --gt-cat-activity token. Folding hand-authored activity cards into this
// data-driven unified list is a data-modeling change outside this batch's
// scope, not a UI change - deferred, not silently dropped.
//
// This first slice covers row-card rendering + the shared category-chip
// filter (list + map together). Reserve-button wiring and the tap-to-open
// detail sheet land in the next two commits.
// ============================================================================

const EXPLORE_CATEGORIES = [
    { key: 'beaches', tag: 'beach', label: 'חוף', icon: '🏖️' },
    { key: 'food', tag: 'food', label: 'מסעדה', icon: '🍽️' },
    { key: 'attractions', tag: 'attraction', label: 'אטרקציה', icon: '📸' },
    { key: 'gems', tag: 'gem', label: 'פנינה', icon: '💎' }
];

function exploreCategoryMeta(catKey) {
    return EXPLORE_CATEGORIES.find(c => c.key === catKey);
}

// Shared filter state: which categories are currently "on". Drives BOTH the
// row-card list below and the map's visible pins (js/map.js
// setExploreMapCategories()) from one place, so the two views can never
// silently drift apart.
let exploreActiveCategories = new Set(EXPLORE_CATEGORIES.map(c => c.key));
function getExploreActiveCategories() { return Array.from(exploreActiveCategories); }
window.getExploreActiveCategories = getExploreActiveCategories;

function toggleExploreCategory(catKey, btn) {
    if (exploreActiveCategories.has(catKey)) {
        // Never allow the last active category to be switched off - an
        // all-empty list/map reads as broken, not "filtered".
        if (exploreActiveCategories.size > 1) exploreActiveCategories.delete(catKey);
    } else {
        exploreActiveCategories.add(catKey);
    }
    if (btn) btn.setAttribute('aria-pressed', String(exploreActiveCategories.has(catKey)));
    applyExploreFilter();
}
window.toggleExploreCategory = toggleExploreCategory;

function applyExploreFilter() {
    const container = document.getElementById('explore-list');
    if (container) {
        let anyVisible = false;
        let visibleCount = 0;
        container.querySelectorAll('[data-loc-cat]').forEach(row => {
            const show = exploreActiveCategories.has(row.getAttribute('data-loc-cat'));
            row.style.display = show ? '' : 'none';
            if (show) { anyVisible = true; visibleCount++; }
        });
        const emptyEl = document.getElementById('explore-empty-state');
        if (emptyEl) emptyEl.classList.toggle('hidden', anyVisible);

        // Same aria-live="polite" filter-count convention already used by
        // beaches/food/attractions/gems (#beach-filter-count etc., js/filters.js)
        // - announces the new count whenever a category chip is toggled.
        const countEl = document.getElementById('explore-filter-count');
        if (countEl) {
            countEl.textContent = visibleCount === 0
                ? 'לא נמצאו תוצאות עבור הסינון הנוכחי'
                : `מציג ${visibleCount} תוצאות`;
        }
    }
    if (typeof setExploreMapCategories === 'function') setExploreMapCategories(getExploreActiveCategories());
}
window.applyExploreFilter = applyExploreFilter;

// --- Per-category display helpers (same records js/cards.js already
// renders, read the same way - no second copy of "how to read a beach vs a
// food vs an attraction vs a gem record"). ---------------------------------

function exploreDisplayName(d, catKey) {
    if (catKey === 'attractions') return cleanAttractionTitle(d.title || '');
    return d.name || '';
}

// The compact meta row's second field: price tier or rating, whichever the
// category actually has. Beaches/gems don't carry either - nothing fabricated.
function exploreSecondaryMeta(d, catKey) {
    if (catKey === 'food') return [d.price, d.rating ? `⭐ ${d.rating}` : ''].filter(Boolean).join(' · ');
    if (catKey === 'attractions') return d.score || '';
    return '';
}

// Status badge: intentionally NOT a live "open now" claim - that would need
// parsing free-text hour ranges (e.g. "11:30-23:00 (א' 17:00-23:00)") per
// venue, which risks a confidently wrong answer. What we *can* say honestly
// from the data: whether the record has been checked against Google Places
// at all, and whether today's real weekday is one of its confirmed closed
// days.
const EXPLORE_WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
function exploreStatusBadge(d) {
    if (!d.verifiedOn) return { cls: 'gt-status--unverified', label: 'לא מאומת' };
    if (Array.isArray(d.closedDays) && d.closedDays.length) {
        const todayCode = EXPLORE_WEEKDAY_CODES[new Date().getDay()];
        if (d.closedDays.includes(todayCode)) return { cls: 'gt-status--closed', label: 'סגור היום' };
    }
    return { cls: 'gt-status--open', label: 'מאומת' };
}

// Sheet body content (zone 2): reuses each category's own already-built
// description HTML rather than re-deriving it - restHtml (food) already
// contains the recommended dishes + hours + facilities block, bodyHtml
// (attractions) already contains the tips/logistics accordion.
function exploreBodyHtml(d, catKey) {
    if (catKey === 'food') return d.restHtml || '';
    if (catKey === 'attractions') return d.bodyHtml || '';
    if (catKey === 'gems') {
        const tip = d.tipHtml ? `<details class="gt-explore-verified-fold" style="margin-top:var(--gt-space-2);"><summary>טיפ מיוחד</summary><div style="padding:0 var(--gt-space-3) var(--gt-space-3);">${d.tipHtml}</div></details>` : '';
        return `<p>${d.description || ''}</p>${tip}`;
    }
    return `<p>${d.description || ''}</p>`; // beaches
}

function exploreRowCardHtml(d, catKey) {
    const cat = exploreCategoryMeta(catKey);
    const name = exploreDisplayName(d, catKey);
    const img = d.image || {};
    const secondary = exploreSecondaryMeta(d, catKey);
    const status = exploreStatusBadge(d);
    const showReserve = catKey === 'food';

    return `<div class="gt-row-card gt-explore-row" data-loc-cat="${escapeAttr(catKey)}" data-loc-id="${escapeAttr(d.id)}" tabindex="0" role="button" aria-label="${escapeAttr(name)}">
      <img class="gt-row-card__thumb" src="${escapeAttr(img.src || '')}" alt="${escapeAttr(img.alt || name)}" loading="lazy" decoding="async">
      <div class="gt-row-card__body">
        <p class="gt-row-card__title">${escapeHtml(name)}</p>
        <div class="gt-row-card__meta">
          <span class="gt-cat-${cat.tag}-bg" style="padding:2px 8px;border-radius:var(--gt-r-full);font-weight:700;">${cat.icon} ${cat.label}</span>
          ${secondary ? `<span class="sep">·</span><span class="gt-tabular">${escapeHtml(secondary)}</span>` : ''}
          <span class="sep">·</span><span class="gt-status ${status.cls}">${status.label}</span>
        </div>
      </div>
      <div class="gt-explore-row__actions">
        <button type="button" class="gt-explore-icon-btn" data-explore-action="map" title="הצג במפה" aria-label="הצג את ${escapeAttr(name)} במפה">🗺️</button>
        ${showReserve ? `<button type="button" class="gt-explore-icon-btn gt-explore-icon-btn--reserve" data-explore-action="reserve" title="הזמנת מקום" aria-label="הזמנת מקום ב-${escapeAttr(name)}">📞 הזמן</button>` : ''}
      </div>
    </div>`;
}

let exploreListBuilt = false;
function renderExploreTab() {
    if (exploreListBuilt) return;
    exploreListBuilt = true;
    const container = document.getElementById('explore-list');
    if (!container || !window.CORFU_LOCATIONS) return;
    let html = '';
    EXPLORE_CATEGORIES.forEach(cat => {
        (window.CORFU_LOCATIONS[cat.key] || []).forEach(d => { html += exploreRowCardHtml(d, cat.key); });
    });
    container.innerHTML = html;
    applyExploreFilter();
}
window.renderExploreTab = renderExploreTab;

// One delegated listener for the whole list: open the detail sheet on a row
// tap, or run the row's own map/reserve action when one of those buttons is
// tapped instead (same delegated-listener pattern js/storage.js already uses
// for the personal-tracking widgets).
document.addEventListener('click', (e) => {
    const list = document.getElementById('explore-list');
    if (!list || !list.contains(e.target)) return;

    const actionBtn = e.target.closest('[data-explore-action]');
    const row = e.target.closest('[data-loc-cat]');
    if (!row) return;
    const catKey = row.getAttribute('data-loc-cat');
    const id = row.getAttribute('data-loc-id');

    if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.getAttribute('data-explore-action');
        if (action === 'map' && typeof showOnExploreMap === 'function') showOnExploreMap(catKey, id);
        if (action === 'reserve') handleExploreReserve(catKey, id);
        return;
    }

    openExploreSheet(catKey, id);
});
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const row = e.target.closest && e.target.closest('.gt-explore-row');
    if (!row || e.target.closest('[data-explore-action]')) return;
    e.preventDefault();
    openExploreSheet(row.getAttribute('data-loc-cat'), row.getAttribute('data-loc-id'));
});

// --- Reserve button (4.3 — the redesign audit's single highest-value fix) --
// A restaurant row's "📞 הזמן" button. If a reservation already exists for
// this venue (matched by name - reservations have no venue-id link today,
// see js/reservations.js), open it for editing exactly like the existing ✏️
// button does. Otherwise open a brand-new, pre-filled form via
// openReservationForm()'s new `prefill` param, so the name/phone never have
// to be retyped. #reservation-form lives inside the #dashboard tab (not
// #explore), so this jumps there first - same "switch to the owning tab,
// then act" pattern as openCardFromMap()/scrollToLocationCard() elsewhere.
function handleExploreReserve(catKey, id) {
    if (catKey !== 'food') return;
    const d = (window.CORFU_LOCATIONS.food || []).find(x => x.id === id);
    if (!d) return;
    const existing = getReservations().find(r => r.place === d.name);
    switchTab('dashboard', true);
    setTimeout(() => {
        if (existing) {
            openReservationForm(existing.id);
        } else {
            openReservationForm(null, { place: d.name, phone: d.phone || '' });
        }
    }, 60);
}
window.handleExploreReserve = handleExploreReserve;

// --- Detail sheet (.gt-sheet) -----------------------------------------------
// Three zones per the Phase 3 spec: (1) name/status/actions/personal-tracking
// widget, (2) description content, (3) one collapsed "מידע מאומת" fold for
// verifiedOn/verifiedRating/priceFlag/needsCoordCheck/verifyNote - reusing
// buildVerifiedInfoHTML() (js/cards.js) rather than re-deriving those rows.
let exploreSheetTriggerEl = null;

function openExploreSheet(catKey, id) {
    const d = (window.CORFU_LOCATIONS[catKey] || []).find(x => x.id === id);
    if (!d) return;
    const cat = exploreCategoryMeta(catKey);
    const name = exploreDisplayName(d, catKey);
    const status = exploreStatusBadge(d);
    const img = d.image || {};

    const titleEl = document.getElementById('explore-sheet-title');
    const bodyEl = document.getElementById('explore-sheet-body');
    const sheet = document.getElementById('explore-sheet');
    const backdrop = document.getElementById('explore-sheet-backdrop');
    if (!sheet || !backdrop || !titleEl || !bodyEl) return;

    titleEl.textContent = name;
    sheet.setAttribute('data-sheet-loc-cat', catKey);
    sheet.setAttribute('data-sheet-loc-id', id);

    const reserveBtn = catKey === 'food'
        ? `<button type="button" class="gt-btn gt-btn--primary" onclick="gtCloseExploreSheet(); handleExploreReserve('food','${escapeAttr(id)}');">📞 הזמנה</button>`
        : '';
    const directionsBtn = d.mapsUrl
        ? `<a href="${escapeAttr(d.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="gt-btn gt-btn--secondary">📍 ניווט</a>`
        : '';
    const mapBtn = `<button type="button" class="gt-btn gt-btn--secondary" onclick="gtCloseExploreSheet(); showOnExploreMap('${escapeAttr(catKey)}','${escapeAttr(id)}');">🗺️ במפה</button>`;

    bodyEl.innerHTML = `
      ${img.src ? `<img class="gt-explore-sheet-thumb" src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt || name)}" loading="lazy" decoding="async">` : ''}
      <div class="gt-row-card__meta" style="margin-bottom:var(--gt-space-2);">
        <span class="gt-cat-${cat.tag}-bg" style="padding:2px 8px;border-radius:var(--gt-r-full);font-weight:700;">${cat.icon} ${cat.label}</span>
        <span class="sep">·</span><span class="gt-status ${status.cls}">${status.label}</span>
      </div>
      <div class="gt-explore-sheet-actions">${reserveBtn}${directionsBtn}${mapBtn}</div>
      <div id="explore-sheet-tracking"></div>
      <div class="gt-explore-sheet-body">${exploreBodyHtml(d, catKey)}</div>
      <details class="gt-explore-verified-fold">
        <summary><span>מידע מאומת</span><span aria-hidden="true">▼</span></summary>
        ${buildVerifiedInfoHTML(d)}
      </details>`;

    // Personal-tracking widget (visited/rate/note): reuses the exact same
    // markup + storage functions as every other card (buildPersonalTrackingWidgetHTML/
    // getItemState/setItemState, js/cards.js + js/storage.js), just painted
    // and wired locally to THIS sheet instead of via storage.js's document-wide
    // delegated listener + document.querySelector('[data-id=...]'). The sheet
    // deliberately does NOT use a plain data-id attribute for this: the same
    // id already exists on this item's original (hidden-fallback) card
    // elsewhere in the DOM, and a global querySelector('[data-id=...]')
    // would resolve to whichever of the two comes first in document order,
    // not necessarily this sheet - so state updates could silently paint the
    // wrong element. Scoping every read/write to the sheet's own subtree
    // sidesteps that without touching storage.js's existing behavior for
    // every other card.
    const trackingHost = document.getElementById('explore-sheet-tracking');
    if (trackingHost && typeof buildPersonalTrackingWidgetHTML === 'function') {
        trackingHost.innerHTML = buildPersonalTrackingWidgetHTML();
        renderExploreSheetTrackingWidget(id);
    }

    exploreSheetTriggerEl = document.activeElement;
    backdrop.classList.remove('hidden');
    sheet.classList.remove('hidden');
    document.body.classList.add('modal-open');
    const closeBtn = sheet.querySelector('.gt-explore-sheet-close');
    if (closeBtn) closeBtn.focus();
}
window.openExploreSheet = openExploreSheet;

function gtCloseExploreSheet() {
    const sheet = document.getElementById('explore-sheet');
    const backdrop = document.getElementById('explore-sheet-backdrop');
    if (sheet) { sheet.classList.add('hidden'); sheet.removeAttribute('data-sheet-loc-id'); }
    if (backdrop) backdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
    if (exploreSheetTriggerEl) exploreSheetTriggerEl.focus();
    // Also opened via a marker tap on the Explore map (js/map.js
    // gtOnMarkerTap()) - clear that pin's pulsing selection ring too, not
    // just the sheet, so closing doesn't leave a ring pulsing with nothing
    // open to explain it.
    if (typeof gtClearMapSelection === 'function') gtClearMapSelection('explore');
}
window.gtCloseExploreSheet = gtCloseExploreSheet;

// Escape closes the sheet, and Tab/Shift+Tab are trapped inside it while
// it's open - same convention as the existing emergency modal (js/ui.js).
document.addEventListener('keydown', (e) => {
    const sheet = document.getElementById('explore-sheet');
    if (!sheet || sheet.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
        gtCloseExploreSheet();
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

// Scoped equivalent of js/storage.js's renderPersonalTrackingWidget() - same
// visual rules (visited toggle / cumulative star fill / note text), just
// painted into the sheet's own subtree via getElementById + closest() rather
// than a document-wide query, for the reason explained above.
function renderExploreSheetTrackingWidget(itemId) {
    const sheet = document.getElementById('explore-sheet');
    const widget = sheet && sheet.querySelector('.personal-tracking-widget');
    if (!widget) return;
    const state = getItemState(itemId);

    const visitedBtn = widget.querySelector('.pt-visited-btn');
    visitedBtn.classList.toggle('pt-visited-btn--active', !!state.is_visited);
    visitedBtn.setAttribute('aria-pressed', String(!!state.is_visited));

    widget.querySelectorAll('.pt-star').forEach(star => {
        const value = Number(star.dataset.value);
        star.classList.toggle('pt-star--active', state.rating != null && value <= state.rating);
        star.setAttribute('aria-checked', String(state.rating === value));
    });

    widget.querySelector('.pt-note-toggle')
        .classList.toggle('pt-note-toggle--has-note', !!(state.note && state.note.trim()));

    const textarea = widget.querySelector('.pt-note-textarea');
    if (document.activeElement !== textarea) textarea.value = state.note || '';
}

document.addEventListener('click', (e) => {
    const sheet = document.getElementById('explore-sheet');
    if (!sheet || sheet.classList.contains('hidden') || !sheet.contains(e.target)) return;
    const itemId = sheet.getAttribute('data-sheet-loc-id');
    if (!itemId) return;

    const visitedBtn = e.target.closest('.pt-visited-btn');
    if (visitedBtn) {
        setItemState(itemId, { is_visited: !getItemState(itemId).is_visited });
        renderExploreSheetTrackingWidget(itemId);
        if (typeof queueItemStateSync === 'function') queueItemStateSync(itemId);
        return;
    }
    const starBtn = e.target.closest('.pt-star');
    if (starBtn) {
        const value = Number(starBtn.dataset.value);
        const newRating = getItemState(itemId).rating === value ? null : value;
        setItemState(itemId, { rating: newRating });
        renderExploreSheetTrackingWidget(itemId);
        if (typeof queueItemStateSync === 'function') queueItemStateSync(itemId);
        return;
    }
    const noteToggle = e.target.closest('.pt-note-toggle');
    if (noteToggle) {
        const textarea = noteToggle.closest('.personal-tracking-widget').querySelector('.pt-note-textarea');
        const nowHidden = textarea.classList.toggle('hidden');
        noteToggle.setAttribute('aria-expanded', String(!nowHidden));
        if (!nowHidden) textarea.focus();
    }
});

const exploreNoteSaveTimers = {};
document.addEventListener('input', (e) => {
    const sheet = document.getElementById('explore-sheet');
    if (!sheet || sheet.classList.contains('hidden') || !sheet.contains(e.target)) return;
    const textarea = e.target.closest('.pt-note-textarea');
    if (!textarea) return;
    const itemId = sheet.getAttribute('data-sheet-loc-id');
    if (!itemId) return;
    clearTimeout(exploreNoteSaveTimers[itemId]);
    exploreNoteSaveTimers[itemId] = setTimeout(() => {
        setItemState(itemId, { note: textarea.value });
        renderExploreSheetTrackingWidget(itemId);
        if (typeof queueItemStateSync === 'function') queueItemStateSync(itemId);
    }, 500);
});

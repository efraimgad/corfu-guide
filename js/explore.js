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

// Category icons reuse the exact same .icon-line path data as the
// dashboard-quicknav-btn / gt-app-nav SVGs for these same four categories
// (index.html) - one visual vocabulary for "beach/food/attraction/gem"
// across the whole app, not a second hand-drawn set.
const GT_ICON_BEACH = '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 18 0Z"/><path d="M12 12v7a2 2 0 0 1-2 2"/><path d="M12 3v2"/></svg>';
const GT_ICON_FOOD = '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v6a1.5 1.5 0 0 0 3 0V3M8.5 9V21"/><path d="M16.5 3c-1.4 0-2.5 1.8-2.5 4.5S15.1 12 16.5 12V21"/></svg>';
const GT_ICON_ATTRACTION = '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.3-2.5h5.4L16 7"/><circle cx="12" cy="13.5" r="3.3"/></svg>';
const GT_ICON_GEM = '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8 9 3.5h6l2.5 4.5L12 20.5Z"/><path d="M6.5 8h11"/></svg>';

const EXPLORE_CATEGORIES = [
    { key: 'beaches', tag: 'beach', label: 'חוף', icon: GT_ICON_BEACH },
    { key: 'food', tag: 'food', label: 'מסעדה', icon: GT_ICON_FOOD },
    { key: 'attractions', tag: 'attraction', label: 'אטרקציה', icon: GT_ICON_ATTRACTION },
    { key: 'gems', tag: 'gem', label: 'פנינה', icon: GT_ICON_GEM }
];

function exploreCategoryMeta(catKey) {
    return EXPLORE_CATEGORIES.find(c => c.key === catKey);
}

// --- Secondary facet filter (Phase A) --------------------------------------
// The four legacy tabs (beaches/food/attractions/gems) each carried their own
// tag-filter button row (js/filters.js). That was the ONE capability Explore
// lacked, and the only real reason those tabs were still alive. Rather than
// porting all 42 distinct tags - food alone has 18, which would pin ~96px of
// permanently-sticky chip chrome to the top of a phone viewport - each
// category gets ONE facet: the axis that category's tags are actually about.
//
// Tag counts these were chosen from (measured off window.CORFU_LOCATIONS,
// not guessed):
//   beaches     family 14, romantic 9, quiet 9, snorkeling 8
//   food        midrange 25, upscale 18, budget 17   (a price TIER - 69/69
//               records carry one, so it behaves like a column, not a tag)
//   attractions history 13, nature 10, beach 7
//   gems        food 9, village 7, nature 6, beach 6
//
// The long tail is deliberately dropped, not forgotten: `nudist` (1 record)
// and `shopping` (1 record) are not filters - a control that narrows 34 items
// to 1 is a search. The inline search box above already covers the tail, and
// covers it better: typing "איטלקי" beats hunting for a 4-record chip.
const EXPLORE_FACETS = {
    beaches: [
        { tag: 'family', label: 'משפחתי' },
        { tag: 'romantic', label: 'רומנטי' },
        { tag: 'quiet', label: 'שקט' },
        { tag: 'snorkeling', label: 'שנרקול' }
    ],
    food: [
        { tag: 'budget', label: '€' },
        { tag: 'midrange', label: '€€' },
        { tag: 'upscale', label: '€€€' }
    ],
    attractions: [
        { tag: 'history', label: 'היסטוריה' },
        { tag: 'nature', label: 'טבע' },
        { tag: 'beach', label: 'חוף' }
    ],
    gems: [
        { tag: 'food', label: 'אוכל' },
        { tag: 'village', label: 'כפר' },
        { tag: 'nature', label: 'טבע' },
        { tag: 'beach', label: 'חוף' }
    ]
};

// '' means "all" - the always-present first chip, not a tag.
let exploreActiveFacet = '';

// Records store tags as a comma-separated STRING ("family,romantic,quiet"),
// verified present on all 169 records across the four arrays - so no
// missing-field guard is needed here, only a shape guard in case that ever
// changes.
//
// Split on comma and compare whole tokens. A substring test would be wrong
// in a way that is easy to miss and hard to debug: `tags.includes('beach')`
// matches the food tag `beachbars`, so the attractions "חוף" facet would
// silently pull in beach bars. Whole-token equality is the fix.
function exploreRecordTags(d) {
    const raw = d && d.tags;
    if (!raw) return [];
    return String(raw).split(',').map(t => t.trim()).filter(Boolean);
}

function exploreMatchesFacet(d) {
    if (!exploreActiveFacet) return true;
    return exploreRecordTags(d).includes(exploreActiveFacet);
}

// Phase D, sub-step 2 — single-select segmented control, not a multi-select
// filter: exactly one category is ever "current". Drives BOTH the row-card
// list below and the map's visible pins (js/map.js setExploreMapCategories())
// from one place, so the two views can never silently drift apart.
// getExploreActiveCategories() keeps its old array-returning shape (now
// always length 1) purely so js/map.js's setExploreMapCategories(), which
// takes activeCategories.includes(key), needs no changes at all.
let exploreActiveCategory = EXPLORE_CATEGORIES[0].key;
function getExploreActiveCategories() { return [exploreActiveCategory]; }
window.getExploreActiveCategories = getExploreActiveCategories;

// role="tab"/aria-selected + handleTablistKeydown() (js/ui.js) - the exact
// same single-choice tablist convention already used by Guide's chip
// sub-nav (js/guide.js gtShowGuidePanel) and the itinerary day scrubber
// (js/itinerary-view.js). aria-pressed doesn't apply here: that's for
// independent toggle buttons, and these four are mutually exclusive.
function selectExploreCategory(catKey, btn) {
    if (!exploreCategoryMeta(catKey)) return;
    exploreActiveCategory = catKey;

    const tablist = document.getElementById('explore-cat-tablist');
    if (tablist) {
        tablist.querySelectorAll('[role="tab"]').forEach(chip => {
            chip.setAttribute('aria-selected', String(chip.getAttribute('data-cat') === catKey));
        });
    } else if (btn) {
        btn.setAttribute('aria-selected', 'true');
    }

    // A fresh category is a fresh view - carrying over a search typed for
    // the previous category would silently hide rows with no visible reason
    // why, so the inline search resets alongside it. The facet resets for
    // the same reason, and additionally because facet vocabularies are
    // per-category: "€€" is meaningless once you are looking at beaches.
    exploreSearchTerm = '';
    const searchInput = document.getElementById('explore-search-input');
    if (searchInput) searchInput.value = '';
    exploreActiveFacet = '';
    renderExploreFacets();

    renderExploreList();
    if (typeof setExploreMapCategories === 'function') setExploreMapCategories(getExploreActiveCategories());
}
window.selectExploreCategory = selectExploreCategory;

// Built in JS rather than as four static markup blocks in index.html: the
// chip set is per-category, so static markup would mean four rows that all
// have to be kept in sync with EXPLORE_FACETS by hand - the exact drift the
// audit already caught between js/map.js's pin colours and the CSS tokens
// they claimed to match. One definition, one renderer.
function renderExploreFacets() {
    const row = document.getElementById('explore-facet-row');
    if (!row) return;

    const facets = EXPLORE_FACETS[exploreActiveCategory] || [];
    if (!facets.length) {
        row.innerHTML = '';
        row.classList.add('hidden');
        return;
    }
    row.classList.remove('hidden');

    // "הכל" is a real option, not a reset button - it carries aria-selected
    // like every other chip so the row is a valid single-choice tablist with
    // exactly one selected option at all times.
    const chips = [{ tag: '', label: 'הכל' }].concat(facets);
    row.innerHTML = chips.map(f => {
        const selected = f.tag === exploreActiveFacet;
        return `<button type="button" class="gt-chip gt-chip--facet" role="tab"`
            + ` data-facet="${escapeAttr(f.tag)}" aria-selected="${selected}"`
            + ` onclick="selectExploreFacet('${escapeAttr(f.tag)}')">${escapeHtml(f.label)}</button>`;
    }).join('');

    // The chip row changes height when it appears/disappears between
    // categories, and the sticky group headers below are positioned off the
    // subheader's measured height - so it has to be re-measured here or the
    // food region headers sit in the wrong place (see
    // --gt-explore-subheader-h in css/design-system.css).
    updateExploreStickyOffsets();
}
window.renderExploreFacets = renderExploreFacets;

function selectExploreFacet(tag) {
    const valid = tag === '' || (EXPLORE_FACETS[exploreActiveCategory] || []).some(f => f.tag === tag);
    if (!valid) return;
    exploreActiveFacet = tag;

    const row = document.getElementById('explore-facet-row');
    if (row) {
        row.querySelectorAll('[role="tab"]').forEach(chip => {
            chip.setAttribute('aria-selected', String(chip.getAttribute('data-facet') === tag));
        });
    }
    renderExploreList();
}
window.selectExploreFacet = selectExploreFacet;

// Deep-link entry point: open Explore on a category with the search box
// pre-filled. Phase C1 replacement for links that used to jump into a legacy
// tab and scrollIntoView() an anchor inside it (e.g. the Day 5 dinner note,
// which pointed at #cat-sunset inside <section id="food">).
//
// Better than the anchor it replaces, not merely equivalent: the Day 5 link
// is labelled "צפון קורפו" and the old anchor scrolled to a *sunset* heading,
// which is a different thing that merely happened to sit nearby. Explore's
// food search already matches the region field, and "צפון קורפו" is a real
// region with 10 restaurants - so this lands on exactly what the link says.
//
// The search box is filled visibly rather than filtered invisibly, so the
// user can see why the list is narrowed and clear it in one tap.
// `immediate` skips the settle delay for callers that are ALREADY inside
// their own post-switchTab timeout (js/search.js's goToSearchResult, which
// scrolls at 50ms). Without it the default 150ms would land after the caller
// had already looked for a row that did not exist yet - a race that fails
// silently, scrolling nowhere.
function openExploreFiltered(catKey, term, immediate) {
    if (typeof switchTab === 'function') switchTab('explore', true);
    const apply = () => {
        selectExploreCategory(catKey, null);
        const input = document.getElementById('explore-search-input');
        if (input && term) {
            input.value = term;
            handleExploreSearchInput(term);
        }
    };
    if (immediate) apply(); else setTimeout(apply, 150);
}
window.openExploreFiltered = openExploreFiltered;

// --- Inline search (filters ONLY the currently-selected category's already
// -rendered rows, live, client-side substring match - separate from the
// topbar's site-wide global search) -----------------------------------------
let exploreSearchTerm = '';
function handleExploreSearchInput(value) {
    exploreSearchTerm = value || '';
    renderExploreList();
}
window.handleExploreSearchInput = handleExploreSearchInput;

function exploreMatchesSearch(d, catKey, term) {
    if (!term) return true;
    const name = exploreDisplayName(d, catKey).toLowerCase();
    if (name.includes(term)) return true;
    // Food is the one category with a real region field (see
    // EXPLORE_GROUP_FIELD below) - matching it too lets "טאון" find every
    // Corfu-Town restaurant, not just ones whose *name* contains it.
    const region = (d.region || '').toLowerCase();
    return region.includes(term);
}

// --- Sticky sub-group headers -----------------------------------------------
// Grouping is only ever built from a field that genuinely exists on the
// record - never fabricated. Checked every field on all four
// window.CORFU_LOCATIONS arrays: only `food` (69/69 records) carries a real
// region label ("region": "📍 ..."). Beaches/attractions/gems have no
// equivalent (beaches have vibe/beachType/parking; attractions have
// score/tags; gems have vibe/tipHtml) - none of those is a place grouping,
// so those three categories intentionally fall back to one flat, ungrouped
// list rather than inventing a label the data doesn't support.
const EXPLORE_GROUP_FIELD = { food: 'region' };

function buildExploreGroups(catKey) {
    const term = exploreSearchTerm.trim().toLowerCase();
    // Facet AND search - both narrow, neither replaces the other. Applied
    // here rather than at render time so the grouping, empty state, lazy
    // batch threshold and the aria-live count all see the same row set and
    // cannot drift out of sync with each other.
    const rows = (window.CORFU_LOCATIONS[catKey] || [])
        .filter(d => exploreMatchesFacet(d))
        .filter(d => exploreMatchesSearch(d, catKey, term));
    const groupField = EXPLORE_GROUP_FIELD[catKey];
    if (!groupField) return [{ label: null, rows }];

    // Stable first-appearance order (not alphabetical/re-sorted) - keeps
    // groups in the same order the underlying data already lists them in.
    const order = [];
    const byKey = new Map();
    rows.forEach(d => {
        const key = d[groupField] || '';
        if (!byKey.has(key)) { byKey.set(key, []); order.push(key); }
        byKey.get(key).push(d);
    });
    return order.map(key => ({ label: key, rows: byKey.get(key) }));
}

// Flattens groups into a render-order sequence of header/row entries.
function buildExploreEntries(catKey) {
    const entries = [];
    buildExploreGroups(catKey).forEach(g => {
        if (g.label) entries.push({ type: 'header', label: g.label });
        g.rows.forEach(d => entries.push({ type: 'row', data: d }));
    });
    return entries;
}

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

// The per-row "🏖️ חוף" / "🍽️ מסעדה" / etc. category pill is intentionally
// gone as of this commit (Phase D, sub-step 2): with single-select category
// segments, which category you're looking at is already shown once by the
// selected chip - repeating it on every one of up to 69 rows was 100%
// redundant, and per the redesign audit was the single most saturated
// element on screen. Nothing else in the meta row depended on the pill
// being first: the secondary meta (price/rating/score) and the status
// badge each already own their own leading content, so with the pill gone
// the row just starts directly at whichever of those two is first.
function exploreRowCardHtml(d, catKey) {
    const name = exploreDisplayName(d, catKey);
    const img = d.image || {};
    const secondary = exploreSecondaryMeta(d, catKey);
    const status = exploreStatusBadge(d);
    const showReserve = catKey === 'food';

    return `<div class="gt-row-card gt-explore-row" data-loc-cat="${escapeAttr(catKey)}" data-loc-id="${escapeAttr(d.id)}">
      <button type="button" class="gt-explore-row__main" aria-label="${escapeAttr(name)}">
        <img class="gt-row-card__thumb" src="${escapeAttr(img.src || '')}" alt="${escapeAttr(img.alt || name)}" width="64" height="64" loading="lazy" decoding="async">
        <div class="gt-row-card__body">
          <p class="gt-row-card__title">${escapeHtml(name)}</p>
          <div class="gt-row-card__meta">
            ${secondary ? `<span class="gt-tabular">${escapeHtml(secondary)}</span><span class="sep">·</span>` : ''}
            <span class="gt-status ${status.cls}">${status.label}</span>
          </div>
        </div>
      </button>
      <div class="gt-explore-row__actions">
        <button type="button" class="gt-explore-icon-btn" data-explore-action="map" title="הצג במפה" aria-label="הצג את ${escapeAttr(name)} במפה">${GT_ICON_MAP}</button>
        ${showReserve ? `<button type="button" class="gt-explore-icon-btn gt-explore-icon-btn--reserve" data-explore-action="reserve" title="הזמנת מקום" aria-label="הזמנת מקום ב-${escapeAttr(name)}">${GT_ICON_PHONE} הזמן</button>` : ''}
      </div>
    </div>`;
}

// --- Progressive/incremental rendering --------------------------------------
// With single-select, the worst case (food, up to 69 rows) is well past the
// ~40-row mark where building every row's DOM node up front stops being
// cheap. True fixed-height virtualization (windowing by scroll position,
// only ever mounting the visible slice, spacer elements for the rest) was
// considered and rejected: .gt-row-card's height genuinely varies row to
// row (food rows grow a second stacked "📞 הזמן" action button beneath the
// map icon that other categories don't have; the title/meta line can wrap
// on narrow phones), so a fixed-row-height assumption would either clip
// content or leave gaps. What's actually implemented instead is honest
// progressive/incremental rendering, NOT true windowing: render an initial
// batch, then grow the DOM by one more batch at a time as an
// IntersectionObserver sentinel at the bottom of the list nears the
// viewport - so the DOM never holds more nodes than the user has actually
// scrolled to, without pretending to be windowing.
const EXPLORE_VIRTUALIZE_THRESHOLD = 40;
const EXPLORE_BATCH_SIZE = 24;
let exploreRenderState = { catKey: null, entries: [], rendered: 0, observer: null };

function exploreRenderNextBatch(count) {
    const container = document.getElementById('explore-list');
    const state = exploreRenderState;
    if (!container || count <= 0) return;
    const end = Math.min(state.entries.length, state.rendered + count);
    if (end <= state.rendered) return;

    let html = '';
    for (let i = state.rendered; i < end; i++) {
        const entry = state.entries[i];
        html += entry.type === 'header'
            ? `<h3 class="gt-explore-group-header">${escapeHtml(entry.label)}</h3>`
            : exploreRowCardHtml(entry.data, state.catKey);
    }
    const sentinel = document.getElementById('explore-scroll-sentinel');
    if (sentinel) sentinel.insertAdjacentHTML('beforebegin', html);
    else container.insertAdjacentHTML('beforeend', html);
    state.rendered = end;

    if (state.rendered >= state.entries.length && state.observer) {
        state.observer.disconnect();
        state.observer = null;
        if (sentinel) sentinel.remove();
    }
}

function exploreSetupSentinelObserver() {
    const container = document.getElementById('explore-list');
    if (!container) return;
    if (!('IntersectionObserver' in window)) {
        // No IO support: fall back to rendering the rest outright. Still
        // correct, just without the incremental-loading benefit.
        exploreRenderNextBatch(exploreRenderState.entries.length - exploreRenderState.rendered);
        return;
    }
    const sentinel = document.createElement('div');
    sentinel.id = 'explore-scroll-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.height = '1px';
    container.appendChild(sentinel);

    const observer = new IntersectionObserver((observed) => {
        observed.forEach(entry => {
            if (entry.isIntersecting) exploreRenderNextBatch(EXPLORE_BATCH_SIZE);
        });
    }, { rootMargin: '600px 0px', threshold: 0 });
    observer.observe(sentinel);
    exploreRenderState.observer = observer;
}

// Rebuilds #explore-list from scratch for whichever one category is
// currently selected: grouped-by-region for food (its real grouping field),
// one flat ungrouped list for beaches/attractions/gems. Renders everything
// up front for short lists; batches/streams in the rest for long ones (see
// EXPLORE_VIRTUALIZE_THRESHOLD above).
function renderExploreList() {
    const container = document.getElementById('explore-list');
    if (!container || !window.CORFU_LOCATIONS) return;

    if (exploreRenderState.observer) exploreRenderState.observer.disconnect();
    container.innerHTML = '';

    const catKey = exploreActiveCategory;
    const entries = buildExploreEntries(catKey);
    exploreRenderState = { catKey, entries, rendered: 0, observer: null };

    const rowCount = entries.filter(e => e.type === 'row').length;
    const needsIncrementalLoad = rowCount > EXPLORE_VIRTUALIZE_THRESHOLD;
    exploreRenderNextBatch(needsIncrementalLoad ? EXPLORE_BATCH_SIZE : entries.length);
    if (needsIncrementalLoad && exploreRenderState.rendered < entries.length) exploreSetupSentinelObserver();

    const emptyEl = document.getElementById('explore-empty-state');
    if (emptyEl) emptyEl.classList.toggle('hidden', rowCount > 0);

    // Same aria-live="polite" filter-count convention already used by
    // beaches/food/attractions/gems (#beach-filter-count etc., js/filters.js)
    // - announces the new count whenever the selected category changes.
    // Reports the true matched total, not just what's rendered so far -
    // "מציג 69 תוצאות" stays accurate even while most of them are only a
    // scroll-triggered batch away from being in the DOM.
    const countEl = document.getElementById('explore-filter-count');
    if (countEl) {
        countEl.textContent = rowCount === 0
            ? 'לא נמצאו תוצאות עבור הסינון הנוכחי'
            : `מציג ${rowCount} תוצאות`;
    }

    // Keep the map showing exactly what the list shows. The facet chips used
    // to filter the list only, which reads as a broken control rather than a
    // deliberate limit - see setExploreMapVisibleIds() in js/map.js.
    //
    // Driven from `entries` (the already-filtered row set) rather than
    // re-deriving the filter here, so the two views cannot disagree: one
    // filtered set, two renderers consuming it. Passing null when nothing is
    // narrowing restores every marker, including any location the list
    // happens not to render.
    if (typeof setExploreMapVisibleIds === 'function') {
        const narrowing = Boolean(exploreActiveFacet || exploreSearchTerm);
        let visibleIds = null;
        if (narrowing) {
            visibleIds = entries.filter(e => e.type === 'row').map(e => e.data.id);
        }
        setExploreMapVisibleIds(catKey, visibleIds);
    }

    updateExploreStickyOffsets();
}
window.renderExploreList = renderExploreList;

// Measures the chip bar's own rendered height so the sticky group headers
// below it (--gt-explore-subheader-h, css/design-system.css) sit flush
// underneath with no gap, the same way --sticky-filter-top itself is kept
// in sync with the top nav's real height (js/ui.js updateScrollUI()).
function updateExploreStickyOffsets() {
    const subheader = document.getElementById('explore-subheader');
    if (!subheader) return;
    document.documentElement.style.setProperty('--gt-explore-subheader-h', subheader.offsetHeight + 'px');
}
window.addEventListener('resize', () => {
    if (exploreListBuilt) updateExploreStickyOffsets();
});

let exploreListBuilt = false;
function renderExploreTab() {
    if (exploreListBuilt) return;
    exploreListBuilt = true;
    renderExploreFacets();
    renderExploreList();
}
window.renderExploreTab = renderExploreTab;

// One delegated listener for the whole list: open the detail sheet on a row
// tap, or run the row's own map/reserve action when one of those buttons is
// tapped instead (same delegated-listener pattern js/storage.js already uses
// for the personal-tracking widgets). The row's tap-to-open surface
// (.gt-explore-row__main) and its map/reserve actions (.gt-explore-row__actions)
// are true siblings, not nested inside one another (see exploreRowCardHtml()
// above) - each branch below is reached by its own distinct element, so
// there's no double-trigger risk to guard against with stopPropagation()
// the way the old nested-role="button" markup needed.
document.addEventListener('click', (e) => {
    const list = document.getElementById('explore-list');
    if (!list || !list.contains(e.target)) return;

    const actionBtn = e.target.closest('[data-explore-action]');
    if (actionBtn) {
        const row = actionBtn.closest('[data-loc-cat]');
        if (!row) return;
        const catKey = row.getAttribute('data-loc-cat');
        const id = row.getAttribute('data-loc-id');
        const action = actionBtn.getAttribute('data-explore-action');
        // Stays on the Explore tab's inline map rather than jumping to the Map
        // tab like the detail sheet's "במפה" button does: this button is tapped
        // *from the list*, where keeping the surrounding rows on screen is the
        // whole point (and at 1024px+ the inline map is already open beside the
        // list, so a tab switch would throw away a view the user can see).
        if (action === 'map' && typeof showOnExploreMap === 'function') showOnExploreMap(catKey, id);
        if (action === 'reserve') handleExploreReserve(catKey, id);
        return;
    }

    const main = e.target.closest('.gt-explore-row__main');
    if (!main) return;
    const row = main.closest('[data-loc-cat]');
    if (!row) return;
    openExploreSheet(row.getAttribute('data-loc-cat'), row.getAttribute('data-loc-id'));
});
// No separate keydown listener needed: both the row's main tap target
// (.gt-explore-row__main) and its map/reserve actions are now real
// <button> elements (native keyboard/AT semantics for free), so the
// browser turns Enter/Space into a native click event that the delegated
// click listener above already handles.

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
        ? `<button type="button" class="gt-btn gt-btn--primary" onclick="gtCloseExploreSheet(); handleExploreReserve('food','${escapeAttr(id)}');">${GT_ICON_PHONE} הזמנה</button>`
        : '';
    const directionsBtn = d.mapsUrl
        ? `<a href="${escapeAttr(d.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="gt-btn gt-btn--secondary">📍 ניווט</a>`
        : '';
    // Goes to the full-screen Map tab (showOnHomeMap, js/map.js), not the
    // Explore tab's own inline map: showOnExploreMap() re-opens this very sheet
    // through gtOnMarkerTap('explore'), so the panel looked stuck open and the
    // bottom nav stayed on "גלה". The row cards' 🗺️ icon button still uses the
    // inline map on purpose - see the click handler above.
    const mapBtn = `<button type="button" class="gt-btn gt-btn--secondary" onclick="gtCloseExploreSheet(); showOnHomeMap('${escapeAttr(catKey)}','${escapeAttr(id)}');">${GT_ICON_MAP} במפה</button>`;

    bodyEl.innerHTML = `
      ${img.src ? `<img class="gt-explore-sheet-thumb" src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt || name)}" width="640" height="360" loading="lazy" decoding="async">` : ''}
      <div class="gt-row-card__meta" style="margin-bottom:var(--gt-space-2);">
        <span class="gt-cat-${cat.tag}-bg" style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:var(--gt-r-full);font-weight:700;">${cat.icon} ${cat.label}</span>
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

// Desktop split-view (1024px+, css/design-system.css): if the viewport is
// resized across that breakpoint while #explore is already the active tab
// (switchTab()'s own explore.js hook, js/ui.js, only runs on tab *entry*),
// the map still needs to appear without the user re-visiting the tab.
// matchMedia's change event fires exactly on that crossing, both directions
// - resizing back below 1024px is a no-op here (mobile's own toggle button
// still works exactly as before; this listener only ever shows the map,
// never hides it, since a user-opened desktop map shouldn't vanish out
// from under them just for shrinking the window a little).
// Guarded for environments with no matchMedia (jsdom, scripts/smoke-test.js)
// - this listener is purely a desktop-viewport convenience, safe to skip
// entirely where matchMedia doesn't exist.
if (typeof window.matchMedia === 'function') {
    const gtExploreDesktopMQ = window.matchMedia('(min-width:1024px)');
    const gtHandleExploreDesktopChange = (e) => {
        if (!e.matches) return;
        const exploreSection = document.getElementById('explore');
        if (exploreSection && exploreSection.classList.contains('active')
            && typeof ensureExploreMapVisible === 'function') {
            ensureExploreMapVisible();
        }
    };
    if (typeof gtExploreDesktopMQ.addEventListener === 'function') {
        gtExploreDesktopMQ.addEventListener('change', gtHandleExploreDesktopChange);
    }
}

// Test hook: lets scripts/smoke-test.js assert that every CORFU_LOCATIONS
// record reaches Explore's row set, independently of how many rows the lazy
// batching has painted into the DOM at that moment.
window.buildExploreEntriesForTest = buildExploreEntries;

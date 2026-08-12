// Global search across beaches, food, attractions, hidden gems, activities,
// the FAQ, the day-by-day itinerary and the trip-planning/health-safety/
// language-daily reference sections. The index is built once from the DOM
// on DOMContentLoaded (no separate data duplication to maintain) and then
// just filtered on every keystroke, instead of re-running querySelectorAll
// across 176+ cards on every keystroke.
let searchActiveIndex = -1;
let searchIndex = [];

// beaches/food/attractions/gems, activities and faq are NOT indexed via
// DOM querySelector: activities/FAQ used to be safe to read straight off
// the DOM because their markup was static and always present by the time
// DOMContentLoaded fired, but Phase 2 made both destination-data-driven
// (js/activities.js's renderActivitiesGrid() / js/faq-filters.js's
// renderFAQList(), both invoked from js/init.js's own DOMContentLoaded
// handler) - and this file's OWN `document.addEventListener('DOMContentLoaded',
// buildSearchIndex)` below has no guaranteed ordering against that other
// listener (each script registers its own listener in load order, and
// search.js loads before faq-filters.js/js/activities.js). A DOM-query
// source here would silently index 0 activities/FAQ entries on every load.
// Built straight from window.DESTINATION.editorial instead - see
// buildActivityIndexEntries()/buildFaqIndexEntries() below - the same fix
// already applied to beaches/food/attractions/gems via
// buildLocationDataIndexEntries() for the identical reason (lazy-rendered
// tabs, not lazy-rendered-relative-to-this-file's-own-listener, but the
// same underlying hazard: don't query DOM that another listener may not
// have populated yet).

// tabId -> { list: CORFU_LOCATIONS key, getText: item -> its body/description
// text (bodyHtml needs tag-stripping, the rest don't) }. icon values match
// what SEARCH_SOURCES used to hardcode for these same four categories.
const LOCATION_DATA_SOURCES = [
    { listKey: 'beaches', tabId: 'beaches', icon: '🏖️', getName: item => item.name, getText: item => item.description || '' },
    { listKey: 'food', tabId: 'food', icon: '🍽️', getName: item => item.name, getText: item => item.subtitle || '' },
    { listKey: 'attractions', tabId: 'attractions', icon: '📸', getName: item => item.title, getText: item => gtSearchStripTags(item.bodyHtml) },
    { listKey: 'gems', tabId: 'gems', icon: '💎', getName: item => item.name, getText: item => item.description || '' }
];

// window.DESTINATION.nameAliases (js/locations-data.js's window.CORFU_NAME_ALIASES
// for Corfu, each destination's own equivalent otherwise — see
// data/destinations/*.js's `nameAliases` field) maps a canonical place
// spelling to its old/alternate transliterations, e.g.
// 'אכיליון' -> ['אכיליאון']. A haystack that contains any one of those
// spellings gets every spelling appended to it, so a query typed in either
// the itinerary's wording or a card's wording matches the same entries -
// regardless of which specific spelling that entry's own text happens to
// use.
//
// Reads window.DESTINATION.nameAliases (not the bare window.CORFU_NAME_ALIASES
// global) so this expands aliases for the ACTIVE destination - reading the
// bare global here meant every destination's search silently reused Corfu's
// alias table (harmless on its own, since a non-Corfu haystack just never
// matches Corfu's spellings, but see buildLocationDataIndexEntries() and
// buildItineraryIndexEntries() below for the same-shaped bug that DID leak
// visible Corfu content into other destinations' results).
function expandWithAliases(haystack) {
    const aliasMap = (window.DESTINATION && window.DESTINATION.nameAliases) || {};
    let extra = '';
    Object.keys(aliasMap).forEach(canonical => {
        const variants = [canonical, ...aliasMap[canonical]];
        if (variants.some(v => haystack.includes(v))) {
            extra += ' ' + variants.join(' ');
        }
    });
    return extra ? haystack + extra : haystack;
}

// Strips HTML tags for search-haystack/display purposes - mirrors
// js/itinerary-view.js's gtStripTags(), duplicated here rather than
// depended on since search.js loads before itinerary-view.js (script
// order) and this only needs to run at index-build time, not parse time.
function gtSearchStripTags(html) {
    const el = document.createElement('div');
    el.innerHTML = html || '';
    return el.textContent || '';
}

// Same haystack shape as buildHaystack() (name + body text + tags/vibe/
// parking/beachType/bestTime), but reading straight off a CORFU_LOCATIONS
// record instead of a rendered card's DOM/attributes - so beaches/food/
// attractions/gems are indexed correctly even when their tab has never
// been opened yet.
function buildLocationDataHaystack(item, name, text) {
    const extra = [
        text,
        item.tags || '',
        (item.vibe || []).join(' '),
        item.parking || '',
        item.beachType || '',
        item.bestTime || ''
    ].join(' ');
    return expandWithAliases((name + ' ' + extra).toLowerCase());
}

// Activities: same dataId-based approach as buildLocationDataIndexEntries()
// - goToSearchResult() already knows how to fresh-lookup `[data-id]` (the
// exact attribute js/activities.js's renderActivitiesGrid() puts on every
// <article>), so no changes needed there.
function buildActivityIndexEntries() {
    const dest = window.DESTINATION;
    const activities = (dest && dest.editorial && Array.isArray(dest.editorial.activities)) ? dest.editorial.activities : [];
    return activities.map(a => {
        const name = [a.emoji, a.title].filter(Boolean).join(' ').trim();
        const extra = [a.description || '', (a.chips || []).join(' '), a.equipmentTip || '', a.warningTip || '', a.expertTip || ''].join(' ');
        return { name, tab: 'activities', icon: '🚤', dataId: a.id, haystack: expandWithAliases((name + ' ' + extra).toLowerCase()) };
    });
}

// FAQ: same shape, using the data-id renderFAQList() (js/faq-filters.js)
// now puts on every rendered <details> for exactly this purpose.
function buildFaqIndexEntries() {
    const dest = window.DESTINATION;
    const faq = (dest && dest.editorial && Array.isArray(dest.editorial.faq)) ? dest.editorial.faq : [];
    return faq.map(f => {
        const name = (f.q || '').trim();
        const answerText = gtSearchStripTags(f.a || '');
        return { name, tab: 'faq', icon: '❓', dataId: f.id, haystack: expandWithAliases((name + ' ' + answerText).toLowerCase()) };
    });
}

// Reads window.DESTINATION.locations (not the bare window.CORFU_LOCATIONS
// global) — the same real bug expandWithAliases() above notes, but visible
// here: js/locations-data.js's window.CORFU_LOCATIONS always exists (it's
// unconditionally loaded for every destination, same as every
// data/destinations/*.js file), so reading it directly meant every
// destination's beaches/food/attractions/gems search results were always
// Corfu's, regardless of which destination was active - a second
// destination (testdest) with a deliberately different, non-overlapping
// category taxonomy never surfaced this, since its fake "museums"/"trails"
// results just sat alongside Corfu's real ones without looking wrong; a
// third, real destination with real place names did.
function buildLocationDataIndexEntries() {
    const entries = [];
    const data = (window.DESTINATION && window.DESTINATION.locations) || {};
    LOCATION_DATA_SOURCES.forEach(src => {
        (data[src.listKey] || []).forEach(item => {
            const name = (src.getName(item) || '').trim();
            const text = src.getText(item) || '';
            const haystack = buildLocationDataHaystack(item, name, text);
            // dataId (not el): the card for this item may not exist in the
            // DOM at all yet, since its tab may never have been opened -
            // goToSearchResult() looks it up fresh by [data-id] after
            // switchTab() has forced the tab (and its cards) to render.
            // locCat (not just dataId): Phase C2 routes these results into
            // the unified Explore tab, which needs to know WHICH category to
            // select before the row exists to scroll to.
            entries.push({ name, tab: 'explore', locCat: src.listKey, icon: src.icon, dataId: item.id, haystack });
        });
    });
    return entries;
}

// The itinerary as a search source: one entry per timeline event (each
// item in js/itinerary-data.js's window.ITINERARY_DAYS, covering both the
// 7 numbered days and the 2 optional/alternate days under "ימים חלופיים")
// rather than one entry per day - so a query like "אכיליון" or "Kanoni"
// lands on the exact stop it's describing instead of just "day 5"
// generically.
// Reads window.DESTINATION.itineraryDays (not the bare window.ITINERARY_DAYS
// global) — same bug class as buildLocationDataIndexEntries() above.
function buildItineraryIndexEntries() {
    const entries = [];
    ((window.DESTINATION && window.DESTINATION.itineraryDays) || []).forEach(day => {
        const fullLabel = gtSearchStripTags(typeof gtItineraryDayTitle === 'function' ? gtItineraryDayTitle(day) : (day.title || ''));
        const shortLabel = day.isAlt ? 'יום חלופי' : `יום ${day.dayNumber}`;

        (day.items || []).forEach((item, index) => {
            const titleText = gtSearchStripTags(item.title);
            if (!titleText) return;
            const descText = gtSearchStripTags(item.html);
            const haystack = expandWithAliases(
                (titleText + ' ' + fullLabel + ' ' + descText).toLowerCase()
            );
            entries.push({
                name: `${shortLabel} · ${titleText}`,
                tab: 'itinerary',
                icon: '🗓️',
                haystack,
                dayKey: day.key,
                itemIndex: index,
                // Select this item's day/alt-card in the day-scrubber view
                // (js/itinerary-view.js) before goToSearchResult() scrolls
                // to it - the new view only ever renders the currently
                // selected day's row-cards, so the target row doesn't
                // exist in the DOM at all until this runs.
                expand: () => {
                    if (typeof gtSelectItineraryDay === 'function') gtSelectItineraryDay(day.key);
                }
            });
        });
    });
    return entries;
}

// Strips a leading decorative emoji (+ variation-selector/ZWJ glue and the
// whitespace after it) from a heading's text, e.g. "💶 כמה עולה..." ->
// "כמה עולה...". Mirrors the trailing-emoji stripping in
// extractLocationNameVariants() (js/itinerary.js), just anchored to the
// front instead of the back.
function stripLeadingIcon(text) {
    return (text || '').replace(/^[\s‍️\p{Extended_Pictographic}]+/gu, '').trim();
}

// Finds the first emoji-like character anywhere in an element's text - in
// this codebase's markup that's reliably the section/block's own icon,
// whether it lives in a sibling span before the heading or inline inside
// the heading itself (both patterns exist across plan-*/health-*/lang-*
// blocks). Falls back to a caller-supplied default if none is found.
function extractLeadingIcon(el, fallback) {
    const match = (el.textContent || '').match(/\p{Extended_Pictographic}️?/u);
    return match ? match[0] : fallback;
}

// Trip Planning / Health & Safety / Language & Daily Life: each tab is a
// handful of named sub-blocks (ids like plan-accommodation, health-
// emergency, lang-shopping...) rather than repeating cards, so - like
// FAQ's <details> - one search entry per block, keyed by its own heading
// text plus its full body text.
function buildContentBlockIndexEntries(sectionId, tabId, idPrefix, defaultIcon) {
    const entries = [];
    document.querySelectorAll(`#${sectionId} [id^="${idPrefix}"]`).forEach(block => {
        const heading = block.querySelector('h3, h4');
        if (!heading) return;
        const headingText = heading.textContent.trim();
        const name = stripLeadingIcon(headingText) || headingText;
        const icon = extractLeadingIcon(block, defaultIcon);
        const haystack = expandWithAliases((headingText + ' ' + (block.textContent || '')).toLowerCase());
        entries.push({ name, tab: tabId, icon, el: block, scrollEl: block, haystack });
    });
    return entries;
}

function buildSearchIndex() {
    const index = [];
    index.push(...buildActivityIndexEntries());
    index.push(...buildFaqIndexEntries());
    index.push(...buildLocationDataIndexEntries());
    index.push(...buildItineraryIndexEntries());
    index.push(...buildContentBlockIndexEntries('trip-planning', 'trip-planning', 'plan-', '🧭'));
    index.push(...buildContentBlockIndexEntries('health-safety', 'health-safety', 'health-', '🚑'));
    index.push(...buildContentBlockIndexEntries('language-daily', 'language-daily', 'lang-', '🇬🇷'));
    searchIndex = index;
}

document.addEventListener('DOMContentLoaded', buildSearchIndex);

// Debounces the actual search so it runs once per pause in typing, not on
// every keystroke.
function debounce(fn, delayMs) {
    let timer = null;
    return function debounced(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delayMs);
    };
}

function performGlobalSearch(query) {
    const resultsBox = document.getElementById('global-search-results');
    const input = document.getElementById('global-search-input');
    const q = query.trim().toLowerCase();
    searchActiveIndex = -1;

    if (q.length < 2) {
        resultsBox.classList.add('hidden');
        resultsBox.innerHTML = '';
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-activedescendant', '');
        return;
    }

    // Two-tier rank: a query matching the item's own name (e.g. searching a
    // beach's name) is what the user is almost always after, so it should
    // never be pushed below a result that only matches somewhere buried in
    // its body text/tags, even though both are valid haystack substring
    // hits. Sort is stable, so within each tier the original index order
    // (and thus category grouping) is preserved.
    let matches = searchIndex.filter(m => m.haystack.includes(q));
    matches.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(q) ? 0 : 1;
        const bNameMatch = b.name.toLowerCase().includes(q) ? 0 : 1;
        return aNameMatch - bNameMatch;
    });
    matches = matches.slice(0, 8);

    resultsBox.innerHTML = '';
    if (matches.length === 0) {
        const p = document.createElement('p');
        p.className = 'p-4 text-sm text-slate-400 text-center';
        p.textContent = `לא נמצאו תוצאות עבור "${query.trim()}"`;
        resultsBox.appendChild(p);
    } else {
        matches.forEach((m, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = `search-option-${i}`;
            btn.setAttribute('role', 'option');
            btn.className = 'w-full text-right px-4 py-2.5 text-sm hover:bg-teal-50 flex items-center gap-2 border-b border-slate-50 last:border-0';
            btn.addEventListener('click', () => goToSearchResult(i));
            btn.addEventListener('mouseenter', () => setSearchActiveIndex(i));

            const iconSpan = document.createElement('span');
            iconSpan.textContent = m.icon;
            const nameSpan = document.createElement('span');
            nameSpan.textContent = m.name;

            btn.appendChild(iconSpan);
            btn.appendChild(nameSpan);
            resultsBox.appendChild(btn);
        });
    }
    window._searchMatches = matches;
    resultsBox.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
}

// Keyboard-drive the results list: Down/Up move the highlighted option,
// Enter selects it (or the first result if none highlighted yet),
// Escape closes the dropdown and gives focus back to a clean input.
function handleSearchKeydown(event) {
    const resultsBox = document.getElementById('global-search-results');
    const matches = window._searchMatches || [];
    if (resultsBox.classList.contains('hidden') || matches.length === 0) return;

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSearchActiveIndex((searchActiveIndex + 1) % matches.length);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSearchActiveIndex((searchActiveIndex - 1 + matches.length) % matches.length);
    } else if (event.key === 'Enter') {
        event.preventDefault();
        goToSearchResult(searchActiveIndex >= 0 ? searchActiveIndex : 0);
    } else if (event.key === 'Escape') {
        event.preventDefault();
        resultsBox.classList.add('hidden');
        event.target.setAttribute('aria-expanded', 'false');
        event.target.value = '';
    }
}

function setSearchActiveIndex(index) {
    const options = document.querySelectorAll('#global-search-results [role="option"]');
    options.forEach(opt => opt.classList.remove('bg-teal-50'));
    searchActiveIndex = index;
    const active = options[index];
    if (active) {
        active.classList.add('bg-teal-50');
        active.scrollIntoView({ block: 'nearest' });
        document.getElementById('global-search-input').setAttribute('aria-activedescendant', active.id);
    }
}

// Phase C2: SEARCH_RESULT_FILTER_RESET (filterBeaches('all') etc.) is gone
// with js/filters.js and the four legacy tabs it served. Explore's equivalent
// problem - a result hidden behind whatever facet/search was last active - is
// solved in goToSearchResult() below by driving Explore's own search box to
// the result's name, which both clears the previous narrowing and guarantees
// the row is rendered.

function goToSearchResult(index) {
    const match = (window._searchMatches || [])[index];
    if (!match) return;

    switchTab(match.tab, true);
    // A location result now lands in Explore. Two things make the old
    // "switchTab then querySelector" approach insufficient there:
    //   1. Explore lazy-renders in batches above EXPLORE_VIRTUALIZE_THRESHOLD,
    //      so row #60 of 69 simply is not in the DOM yet, and
    //   2. any facet or search left active from earlier browsing could be
    //      filtering the result out.
    // Driving Explore's own search box to the result's name fixes both at
    // once: it clears prior narrowing, and it cuts the list short enough that
    // the row is always in the first batch.
    document.getElementById('global-search-results').classList.add('hidden');
    document.getElementById('global-search-input').value = '';

    const highlightAndScroll = () => {
        let card;
        if (match.dayKey != null) {
            // Itinerary result: the row-card only exists in the DOM for
            // whichever day is currently selected in the day-scrubber
            // view (js/itinerary-view.js) - match.expand() (called above)
            // already selected the right one, so it's there by now.
            card = document.querySelector(`#gt-itinerary-row-list .gt-itinerary-row[data-gt-row-index="${match.itemIndex}"]`);
            if (!card) return;
        } else if (match.dataId != null) {
            // beaches/food/attractions/gems entries carry a dataId instead
            // of a live element (built from CORFU_LOCATIONS, not the DOM -
            // see buildLocationDataIndexEntries()), since their card may not
            // have existed yet at index-build time. switchTab() above already
            // ran ensureTabRendered() for match.tab, so the card is in the
            // DOM by now regardless of whether this tab had been visited
            // before this click.
            // Explore rows carry data-loc-id (js/explore.js); the legacy
            // cards used data-id. Both are checked so this keeps working
            // either way rather than silently scrolling nowhere.
            card = document.querySelector(`[data-loc-id="${CSS.escape(match.dataId)}"]`)
                || document.querySelector(`[data-id="${CSS.escape(match.dataId)}"]`);
            if (!card) return;
        } else {
            // match.scrollEl lets a source point straight at its own
            // target (a plan-*/health-*/lang-* section) instead of
            // relying on the generic card-ancestor guess below, which
            // stays the fallback for every source that doesn't set it.
            card = match.scrollEl || match.el.closest('article, .bg-white.rounded-2xl') || match.el;
        }
        if (card.tagName === 'DETAILS') card.open = true;
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('search-highlight');
        setTimeout(() => card.classList.remove('search-highlight'), 2000);
    };

    // Wait for the tab's display to update before scrolling to the card
    setTimeout(() => {
        // Applied here, inside the settle delay, so the row is rendered
        // before highlightAndScroll() looks for it (see the `immediate`
        // note in openExploreFiltered).
        if (match.locCat && typeof openExploreFiltered === 'function') {
            openExploreFiltered(match.locCat, match.name, true);
        }
        if (typeof match.expand === 'function') {
            // e.g. an itinerary result: expand its collapsed day first,
            // then give the layout a moment to settle before measuring
            // where to scroll to (same pattern as viewTodayInItinerary()
            // in js/itinerary.js).
            match.expand();
            setTimeout(highlightAndScroll, 150);
        } else {
            highlightAndScroll();
        }
    }, 50);
}

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    const searchBox = document.getElementById('global-search-results');
    const searchInput = document.getElementById('global-search-input');
    if (searchBox && searchInput && !searchInput.contains(e.target) && !searchBox.contains(e.target)) {
        searchBox.classList.add('hidden');
    }
});

const debouncedGlobalSearch = debounce(performGlobalSearch, 150);

window.performGlobalSearch = performGlobalSearch;
window.debouncedGlobalSearch = debouncedGlobalSearch;
window.handleSearchKeydown = handleSearchKeydown;

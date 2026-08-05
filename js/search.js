// Global search across beaches, food, attractions, hidden gems, activities,
// the FAQ, the day-by-day itinerary and the trip-planning/health-safety/
// language-daily reference sections. The index is built once from the DOM
// on DOMContentLoaded (no separate data duplication to maintain) and then
// just filtered on every keystroke, instead of re-running querySelectorAll
// across 176+ cards on every keystroke.
let searchActiveIndex = -1;
let searchIndex = [];

const SEARCH_SOURCES = [
    { selector: '#beaches [data-name]', tabId: 'beaches', icon: '🏖️', getName: el => el.getAttribute('data-name') },
    { selector: '#food h4', tabId: 'food', icon: '🍽️', getName: el => el.textContent },
    { selector: '#attractions h3', tabId: 'attractions', icon: '📸', getName: el => el.textContent.replace(/^\d+\.\s*/, '') },
    { selector: '#gems h3', tabId: 'gems', icon: '💎', getName: el => el.textContent },
    { selector: '#activities-grid article h3', tabId: 'activities', icon: '🚤', getName: el => el.textContent },
    { selector: '#faq-list details', tabId: 'faq', icon: '❓', getName: el => (el.querySelector('summary span')?.textContent || '') }
];

// Everything a query can match against, lowercased: the name, the card's
// full visible text (description, badges, info panel, etc. - wherever it
// lives, category to category), its data-tags, and the data-vibe/
// data-parking/data-beach-type/data-best-time metadata added earlier.
// Falls back to the source element itself when there's no [data-id]
// ancestor (e.g. FAQ <details>, which already IS the whole item).
function buildHaystack(el, name) {
    const card = el.closest('[data-id]') || el;
    const extra = [
        card.textContent || '',
        card.getAttribute('data-tags') || '',
        card.getAttribute('data-vibe') || '',
        card.getAttribute('data-parking') || '',
        card.getAttribute('data-beach-type') || '',
        card.getAttribute('data-best-time') || ''
    ].join(' ');
    return expandWithAliases((name + ' ' + extra).toLowerCase());
}

// window.CORFU_NAME_ALIASES (js/locations-data.js) maps a canonical place
// spelling to its old/alternate transliterations, e.g.
// 'אכיליון' -> ['אכיליאון']. A haystack that contains any one of those
// spellings gets every spelling appended to it, so a query typed in either
// the itinerary's wording or a card's wording matches the same entries -
// regardless of which specific spelling that entry's own text happens to
// use.
function expandWithAliases(haystack) {
    const aliasMap = window.CORFU_NAME_ALIASES;
    if (!aliasMap) return haystack;
    let extra = '';
    Object.keys(aliasMap).forEach(canonical => {
        const variants = [canonical, ...aliasMap[canonical]];
        if (variants.some(v => haystack.includes(v))) {
            extra += ' ' + variants.join(' ');
        }
    });
    return extra ? haystack + extra : haystack;
}

// The itinerary as a search source: one entry per timeline event (the
// .premium-event-title blocks inside each #day-N-body, plus the two
// optional/alternate day cards under "ימים חלופיים") rather than one entry
// per day - so a query like "אכיליון" or "Kanoni" lands on the exact stop
// it's describing instead of just "day 5" generically.
function buildItineraryIndexEntries() {
    const entries = [];
    document.querySelectorAll('#itinerary .premium-day-card').forEach(card => {
        const header = card.querySelector('.premium-day-header');
        const body = header && header.nextElementSibling;
        if (!header || !body) return;

        // Numbered days (1-7) carry an <h3> "יום N (...): ..." header; the
        // two optional/alternate day cards have no day number, only a
        // standalone <h4> title - both are handled here rather than
        // hand-typing 7 ids, so a future 8th day or renamed alt card is
        // picked up automatically.
        const numberedTitle = header.querySelector('h3');
        const altTitle = !numberedTitle ? header.querySelector('h4') : null;
        let shortLabel = 'יום';
        let fullLabel = '';
        if (numberedTitle) {
            fullLabel = numberedTitle.textContent.trim();
            const m = fullLabel.match(/^יום\s*\d+/);
            shortLabel = m ? m[0] : fullLabel;
        } else if (altTitle) {
            fullLabel = altTitle.textContent.trim();
            shortLabel = 'יום חלופי';
        }

        body.querySelectorAll('.premium-timeline-item').forEach(item => {
            const titleEl = item.querySelector('.premium-event-title');
            if (!titleEl) return;
            const titleText = titleEl.textContent.trim();
            const descEl = item.querySelector('.premium-event-desc');
            const haystack = expandWithAliases(
                (titleText + ' ' + fullLabel + ' ' + (descEl ? descEl.textContent : '')).toLowerCase()
            );
            entries.push({
                name: `${shortLabel} · ${titleText}`,
                tab: 'itinerary',
                icon: '🗓️',
                el: item,
                scrollEl: item,
                haystack,
                // Expand the day's collapsed body (reusing the itinerary's
                // own accordion toggle, not hand-rolled class removal)
                // before goToSearchResult() scrolls to it - otherwise the
                // target event sits inside a display:none-equivalent block.
                expand: () => {
                    if (body.classList.contains('day-card-collapsed')) {
                        toggleDayCard(header);
                    }
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
    SEARCH_SOURCES.forEach(src => {
        document.querySelectorAll(src.selector).forEach(el => {
            const name = src.getName(el).trim();
            const haystack = buildHaystack(el, name);
            index.push({ name, tab: src.tabId, icon: src.icon, el, haystack });
        });
    });
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

    let matches = searchIndex.filter(m => m.haystack.includes(q));
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

// Tab id -> the filter-reset call that shows every card in that grid again.
// A search result can otherwise land on a card hidden by whatever tag
// filter was last active on that tab, so switchTab() alone isn't enough.
const SEARCH_RESULT_FILTER_RESET = {
    beaches: () => filterBeaches('all'),
    food: () => filterFood('all'),
    attractions: () => filterAttractions('all'),
    gems: () => filterGems('all')
};

function goToSearchResult(index) {
    const match = (window._searchMatches || [])[index];
    if (!match) return;

    switchTab(match.tab, true);
    const resetFilter = SEARCH_RESULT_FILTER_RESET[match.tab];
    if (resetFilter) resetFilter();
    document.getElementById('global-search-results').classList.add('hidden');
    document.getElementById('global-search-input').value = '';

    const highlightAndScroll = () => {
        // match.scrollEl lets a source point straight at its own target
        // (an itinerary event's timeline block, a plan-*/health-*/lang-*
        // section) instead of relying on the generic card-ancestor guess
        // below, which stays the fallback for every source that doesn't
        // set it.
        let card = match.scrollEl || match.el.closest('article, .bg-white.rounded-2xl') || match.el;
        if (card.tagName === 'DETAILS') card.open = true;
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('search-highlight');
        setTimeout(() => card.classList.remove('search-highlight'), 2000);
    };

    // Wait for the tab's display to update before scrolling to the card
    setTimeout(() => {
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

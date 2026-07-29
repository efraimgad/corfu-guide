// Global search across beaches, food, attractions, hidden gems, activities
// and the FAQ.
//
// The four card categories are indexed from window.CORFU_LOCATIONS (the
// data), NOT from the rendered DOM. That matters since those tabs render
// lazily on first open (js/ui.js switchTab -> ensureTabRendered): a
// DOM-scraped index could only ever contain tabs the visitor had already
// opened, so searching for a beach before visiting the beaches tab found
// nothing. Indexing the data instead makes search complete from first
// paint, and also means the index no longer has to be rebuilt whenever a
// tab renders.
//
// Activities and the FAQ have no data-layer equivalent (still hand-written
// markup in index.html) and are always present in the DOM, so those two
// stay DOM-sourced.
let searchActiveIndex = -1;
let searchIndex = [];

const SEARCH_DOM_SOURCES = [
    { selector: '#activities-grid article h3', tabId: 'activities', icon: '🚤', getName: el => el.textContent },
    { selector: '#faq-list details', tabId: 'faq', icon: '❓', getName: el => (el.querySelector('summary span')?.textContent || '') }
];

// Which CORFU_LOCATIONS fields feed each category's searchable text, and
// where its display name comes from. Attraction titles carry a leading
// "12. " ordinal in the data that shouldn't show up in results.
const SEARCH_DATA_SOURCES = [
    { key: 'beaches', tabId: 'beaches', icon: '🏖️', getName: d => d.name,
      textFields: ['description', 'tagBadgesHtml', 'featureBadgesHtml', 'infoPanelHtml'] },
    { key: 'food', tabId: 'food', icon: '🍽️', getName: d => d.name,
      textFields: ['subtitle', 'region', 'restHtml', 'ratingPriceHtml'] },
    { key: 'attractions', tabId: 'attractions', icon: '📸', getName: d => String(d.title || '').replace(/^\d+\.\s*/, ''),
      textFields: ['bodyHtml'] },
    { key: 'gems', tabId: 'gems', icon: '💎', getName: d => d.name,
      textFields: ['description', 'tipHtml', 'typeBadgeHtml'] }
];

// The data's rich-text fields are HTML fragments; strip tags so a query
// can never accidentally match a class name or an attribute value.
function stripHtml(html) {
    return String(html == null ? '' : html).replace(/<[^>]*>/g, ' ');
}

// Everything a query can match against for a data-backed card, lowercased:
// name, tags, the per-category text fields above, and the vibe/parking/
// beachType/bestTime metadata.
function buildDataHaystack(d, src, name) {
    const parts = [name, d.tags || '', (d.vibe || []).join(' '), d.parking || '', d.beachType || '', d.bestTime || ''];
    src.textFields.forEach(f => parts.push(stripHtml(d[f])));
    return parts.join(' ').replace(/\s+/g, ' ').toLowerCase();
}

// DOM-sourced equivalent, for the two categories with no data layer.
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
    return (name + ' ' + extra).toLowerCase();
}

function buildSearchIndex() {
    const index = [];

    const data = window.CORFU_LOCATIONS;
    if (data) {
        SEARCH_DATA_SOURCES.forEach(src => {
            (data[src.key] || []).forEach(d => {
                const name = String(src.getName(d) || '').trim();
                if (!name) return;
                // id, not an element reference: the card may not be
                // rendered yet, so the result is resolved to a DOM node
                // only when it's actually selected (goToSearchResult).
                index.push({ name, tab: src.tabId, icon: src.icon, id: d.id, el: null, haystack: buildDataHaystack(d, src, name) });
            });
        });
    }

    SEARCH_DOM_SOURCES.forEach(src => {
        document.querySelectorAll(src.selector).forEach(el => {
            const name = src.getName(el).trim();
            index.push({ name, tab: src.tabId, icon: src.icon, id: null, el, haystack: buildHaystack(el, name) });
        });
    });

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

function goToSearchResult(index) {
    const match = (window._searchMatches || [])[index];
    if (!match) return;

    // Opening the tab is also what renders it, for the four lazily-rendered
    // card categories - so a data-backed match's element only exists after
    // this call, and is looked up by id below rather than held from
    // indexing time.
    switchTab(match.tab, true);
    document.getElementById('global-search-results').classList.add('hidden');
    document.getElementById('global-search-input').value = '';

    // Wait for the tab's display to update before scrolling to the card
    setTimeout(() => {
        const target = match.el || document.querySelector(`[data-id="${CSS.escape(match.id)}"]`);
        if (!target) return;
        let card = target.closest('article, .bg-white.rounded-2xl') || target;
        if (card.tagName === 'DETAILS') card.open = true;
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('search-highlight');
        setTimeout(() => card.classList.remove('search-highlight'), 2000);
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

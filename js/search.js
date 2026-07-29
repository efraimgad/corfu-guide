// Global search across beaches, food, attractions, hidden gems, activities
// and the FAQ. The index is built once from the DOM on DOMContentLoaded
// (no separate data duplication to maintain) and then just filtered on
// every keystroke, instead of re-running querySelectorAll across 176+
// cards on every keystroke.
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
    return (name + ' ' + extra).toLowerCase();
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

    switchTab(match.tab, true);
    document.getElementById('global-search-results').classList.add('hidden');
    document.getElementById('global-search-input').value = '';

    // Wait for the tab's display to update before scrolling to the card
    setTimeout(() => {
        let card = match.el.closest('article, .bg-white.rounded-2xl') || match.el;
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

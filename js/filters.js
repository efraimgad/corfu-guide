// Card filter system (beaches / food / attractions / gems). These four
// sections used to be four near-identical copies of the same filter/count/
// empty-state logic - only the DOM ids and Hebrew noun forms differed.
// Consolidated into one generic applyCardFilter() driven by a small config
// per section, so a future fix/feature only needs to be written once.
const FILTER_CONFIGS = {
    beaches: {
        cardsSelector: '#beaches-grid [data-tags]',
        btnSelector: '.beach-filter-btn',
        countId: 'beach-filter-count',
        emptyStateId: 'beaches-empty-state',
        noun: 'חופים', nounDefinite: 'החופים', savedAdjective: 'שמורים',
        syncMobileNav: 'beaches'
    },
    attractions: {
        cardsSelector: '#attractions-grid [data-tags]',
        btnSelector: '.attr-filter-btn',
        countId: 'attr-filter-count',
        emptyStateId: 'attractions-empty-state',
        noun: 'אטרקציות', nounDefinite: 'האטרקציות', savedAdjective: 'שמורות'
    },
    gems: {
        cardsSelector: '#gems-container-grid [data-tags]',
        btnSelector: '.gem-filter-btn',
        countId: 'gem-filter-count',
        emptyStateId: 'gems-empty-state',
        noun: 'פנינים', nounDefinite: 'הפנינים', savedAdjective: 'שמורות'
    },
    food: {
        cardsSelector: '#food [data-tags]',
        btnSelector: '.food-filter-btn',
        countId: 'food-filter-count',
        emptyStateId: 'food-empty-state',
        noun: 'מסעדות', nounDefinite: 'המסעדות', savedAdjective: 'שמורות',
        // Food's filter pills keep their own category color (green/blue/
        // purple/amber) when inactive, and price-tier pills (budget/
        // midrange/upscale/luxury) never get the plain gray treatment -
        // the other three sections don't have this per-category coloring.
        setButtonState(btn, isActive) {
            if (isActive) {
                btn.classList.add('bg-blue-600', 'text-white');
                btn.classList.remove('bg-gray-100', 'bg-green-50', 'bg-blue-50', 'bg-purple-50', 'bg-amber-50', 'text-gray-700', 'text-green-800', 'text-blue-800', 'text-purple-800', 'text-amber-800');
            } else {
                btn.classList.remove('bg-blue-600', 'text-white');
                if (!btn.classList.contains('bg-gray-100') && !['budget', 'midrange', 'upscale', 'luxury'].includes(btn.getAttribute('data-filter'))) {
                    btn.classList.add('bg-gray-100', 'text-gray-700');
                }
            }
        }
    }
};

function defaultFilterButtonState(btn, isActive) {
    btn.classList.toggle('bg-blue-600', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('bg-gray-100', !isActive);
    btn.classList.toggle('text-gray-700', !isActive);
}

function applyCardFilter(tag, config) {
    const cards = document.querySelectorAll(config.cardsSelector);
    let visibleCount = 0;
    const favorites = getFavorites();

    cards.forEach(card => {
        const cardTags = (card.getAttribute('data-tags') || '').split(',');
        let show;
        if (tag === 'all') {
            show = true;
        } else if (tag === 'favorites') {
            show = favorites.includes(card.getAttribute('data-id'));
        } else {
            show = cardTags.includes(tag);
        }
        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });

    const setButtonState = config.setButtonState || defaultFilterButtonState;
    document.querySelectorAll(config.btnSelector).forEach(btn => {
        const isActive = btn.getAttribute('data-filter') === tag;
        btn.classList.toggle('active', isActive);
        setButtonState(btn, isActive);
    });

    if (config.syncMobileNav) syncMobileBottomNav(config.syncMobileNav);

    const countEl = document.getElementById(config.countId);
    if (countEl) {
        const total = cards.length;
        if (tag === 'favorites') {
            countEl.textContent = visibleCount > 0
                ? `מציג ${visibleCount} ${config.noun} ${config.savedAdjective} ❤️`
                : `עדיין לא שמרתם ${config.noun} - לחצו על הלב 🤍 בכרטיס כדי להוסיף`;
        } else {
            countEl.textContent = (tag === 'all')
                ? `מציג את כל ${total} ${config.nounDefinite}`
                : `מציג ${visibleCount} מתוך ${total} ${config.noun}`;
        }
    }
    const emptyEl = document.getElementById(config.emptyStateId);
    if (emptyEl) emptyEl.classList.toggle('hidden', !(visibleCount === 0 && tag !== 'favorites'));
}

function filterBeaches(tag) { applyCardFilter(tag, FILTER_CONFIGS.beaches); }
function filterFood(tag) { applyCardFilter(tag, FILTER_CONFIGS.food); }
function filterAttractions(tag) { applyCardFilter(tag, FILTER_CONFIGS.attractions); }
function filterGems(tag) { applyCardFilter(tag, FILTER_CONFIGS.gems); }

// Every filter pill used to carry its own onclick="filterX('tag')" - always
// an exact duplicate of the data-filter attribute already on the same
// button (needed anyway by applyCardFilter() to mark the active pill). One
// delegated listener per section reads that existing attribute instead.
const FILTER_BTN_DELEGATES = [
    ['.beach-filter-btn', filterBeaches],
    ['.food-filter-btn', filterFood],
    ['.attr-filter-btn', filterAttractions],
    ['.gem-filter-btn', filterGems]
];
document.addEventListener('click', (e) => {
    for (const [selector, filterFn] of FILTER_BTN_DELEGATES) {
        const btn = e.target.closest(selector);
        if (btn) { filterFn(btn.getAttribute('data-filter')); return; }
    }
});

// FAQ search/filter
let faqActiveCategory = 'all';

function applyFAQFilters() {
    const input = document.getElementById('faq-search-input');
    const q = (input ? input.value : '').trim().toLowerCase();
    const items = document.querySelectorAll('#faq-list details');
    let visibleCount = 0;

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        const matchesQuery = q.length < 2 || text.includes(q);
        const matchesCategory = faqActiveCategory === 'all' || item.getAttribute('data-cat') === faqActiveCategory;
        const show = matchesQuery && matchesCategory;
        item.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });

    const countEl = document.getElementById('faq-search-count');
    if (countEl) {
        countEl.textContent = (q.length < 2 && faqActiveCategory === 'all')
            ? `מציג את כל ${items.length} השאלות`
            : `מציג ${visibleCount} מתוך ${items.length} שאלות`;
    }
    const emptyEl = document.getElementById('faq-empty-state');
    if (emptyEl) emptyEl.classList.toggle('hidden', visibleCount !== 0);
}

function filterFAQ(query) {
    applyFAQFilters();
}

// #faq-search-input used to carry oninput="filterFAQ(this.value)" directly.
const faqSearchInputEl = document.getElementById('faq-search-input');
if (faqSearchInputEl) faqSearchInputEl.addEventListener('input', (e) => filterFAQ(e.target.value));

function filterFAQCategory(cat) {
    faqActiveCategory = cat;
    document.querySelectorAll('.faq-filter-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-filter') === cat;
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('bg-indigo-600', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('bg-gray-100', !isActive);
        btn.classList.toggle('text-gray-700', !isActive);
    });
    applyFAQFilters();
}

// Same pattern as the beach/food/attractions/gems pills above. The one
// exception is the "clear filter" pill (.faq-clear-btn), which used to also
// blank the search input inline before calling filterFAQCategory('all') -
// that side effect is now handled here instead of losing it.
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-filter-btn');
    if (!btn) return;
    if (btn.classList.contains('faq-clear-btn')) {
        const input = document.getElementById('faq-search-input');
        if (input) input.value = '';
    }
    filterFAQCategory(btn.getAttribute('data-filter'));
});

window.filterBeaches = filterBeaches;
window.filterAttractions = filterAttractions;
window.filterGems = filterGems;
window.filterFood = filterFood;
window.filterFAQ = filterFAQ;
window.filterFAQCategory = filterFAQCategory;

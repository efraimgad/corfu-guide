// Shared tag-filter engine for beaches/attractions/gems/food. All four
// grids filter identically (match data-tags, or the favorites list, or
// show everything) and only differ in which grid/buttons/count-text/
// empty-state they target - filterFood also has its own button-styling
// branch (colored budget-tier pills) instead of the plain active/inactive
// toggle the other three use.
function defaultButtonStyle(btn, isActive) {
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('filter-pill--active', isActive);
    btn.classList.toggle('bg-gray-100', !isActive);
    btn.classList.toggle('text-gray-700', !isActive);
}

function foodButtonStyle(btn, isActive) {
    btn.classList.toggle('active', isActive);
    if (isActive) {
        btn.classList.add('filter-pill--active');
        btn.classList.remove('bg-gray-100', 'bg-green-50', 'bg-blue-50', 'bg-purple-50', 'bg-amber-50', 'text-gray-700', 'text-green-800', 'text-blue-800', 'text-purple-800', 'text-amber-800');
    } else {
        btn.classList.remove('filter-pill--active');
        if (!btn.classList.contains('bg-gray-100') && !['budget','midrange','upscale','luxury'].includes(btn.getAttribute('data-filter'))) {
            btn.classList.add('bg-gray-100', 'text-gray-700');
        }
    }
}

function applyFilter(config, tag) {
    const cards = config.getCards();
    if (!cards) return;
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

    document.querySelectorAll(config.btnSelector).forEach(btn => {
        const isActive = btn.getAttribute('data-filter') === tag;
        config.styleButton(btn, isActive);
    });
    if (config.afterButtons) config.afterButtons();

    const countEl = document.getElementById(config.countElId);
    if (countEl) {
        const total = cards.length;
        if (tag === 'favorites') {
            countEl.textContent = visibleCount > 0 ? config.labels.favShown(visibleCount) : config.labels.favEmpty;
        } else {
            countEl.textContent = (tag === 'all') ? config.labels.all(total) : config.labels.partial(visibleCount, total);
        }
    }
    const emptyEl = document.getElementById(config.emptyElId);
    if (emptyEl) emptyEl.classList.toggle('hidden', !(visibleCount === 0 && tag !== 'favorites'));
}

const BEACH_FILTER_CONFIG = {
    getCards: () => {
        const grid = document.getElementById('beaches-grid');
        return grid ? grid.querySelectorAll('[data-tags]') : null;
    },
    btnSelector: '.beach-filter-btn',
    styleButton: defaultButtonStyle,
    afterButtons: () => syncMobileBottomNav('beaches'),
    countElId: 'beach-filter-count',
    emptyElId: 'beaches-empty-state',
    labels: {
        favShown: (n) => `מציג ${n} חופים שמורים ❤️`,
        favEmpty: `עדיין לא שמרתם חופים - לחצו על הלב 🤍 בכרטיס כדי להוסיף`,
        all: (total) => `מציג את כל ${total} החופים`,
        partial: (n, total) => `מציג ${n} מתוך ${total} חופים`
    }
};

const ATTRACTIONS_FILTER_CONFIG = {
    getCards: () => {
        const grid = document.getElementById('attractions-grid');
        return grid ? grid.querySelectorAll('[data-tags]') : null;
    },
    btnSelector: '.attr-filter-btn',
    styleButton: defaultButtonStyle,
    countElId: 'attr-filter-count',
    emptyElId: 'attractions-empty-state',
    labels: {
        favShown: (n) => `מציג ${n} אטרקציות שמורות ❤️`,
        favEmpty: `עדיין לא שמרתם אטרקציות - לחצו על הלב 🤍 בכרטיס כדי להוסיף`,
        all: (total) => `מציג את כל ${total} האטרקציות`,
        partial: (n, total) => `מציג ${n} מתוך ${total} אטרקציות`
    }
};

const GEMS_FILTER_CONFIG = {
    getCards: () => {
        const grid = document.getElementById('gems-container-grid');
        return grid ? grid.querySelectorAll('[data-tags]') : null;
    },
    btnSelector: '.gem-filter-btn',
    styleButton: defaultButtonStyle,
    countElId: 'gem-filter-count',
    emptyElId: 'gems-empty-state',
    labels: {
        favShown: (n) => `מציג ${n} פנינים שמורות ❤️`,
        favEmpty: `עדיין לא שמרתם פנינים - לחצו על הלב 🤍 בכרטיס כדי להוסיף`,
        all: (total) => `מציג את כל ${total} הפנינים`,
        partial: (n, total) => `מציג ${n} מתוך ${total} פנינים`
    }
};

const FOOD_FILTER_CONFIG = {
    getCards: () => document.querySelectorAll('#food [data-tags]'),
    btnSelector: '.food-filter-btn',
    styleButton: foodButtonStyle,
    countElId: 'food-filter-count',
    emptyElId: 'food-empty-state',
    labels: {
        favShown: (n) => `מציג ${n} מסעדות שמורות ❤️`,
        favEmpty: `עדיין לא שמרתם מסעדות - לחצו על הלב 🤍 בכרטיס כדי להוסיף`,
        all: (total) => `מציג את כל ${total} המסעדות`,
        partial: (n, total) => `מציג ${n} מתוך ${total} מסעדות`
    }
};

function filterBeaches(tag) { applyFilter(BEACH_FILTER_CONFIG, tag); }
function filterAttractions(tag) { applyFilter(ATTRACTIONS_FILTER_CONFIG, tag); }
function filterGems(tag) { applyFilter(GEMS_FILTER_CONFIG, tag); }
function filterFood(tag) { applyFilter(FOOD_FILTER_CONFIG, tag); }

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

window.filterBeaches = filterBeaches;
window.filterAttractions = filterAttractions;
window.filterGems = filterGems;
window.filterFood = filterFood;
window.filterFAQ = filterFAQ;
window.filterFAQCategory = filterFAQCategory;

// Beach filter system
function filterBeaches(tag) {
    const grid = document.getElementById('beaches-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('[data-tags]');
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

    // Update button active states
    document.querySelectorAll('.beach-filter-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-filter') === tag;
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('bg-blue-600', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('bg-gray-100', !isActive);
        btn.classList.toggle('text-gray-700', !isActive);
    });
    syncMobileBottomNav('beaches');

    // Update count message
    const countEl = document.getElementById('beach-filter-count');
    if (countEl) {
        const total = cards.length;
        if (tag === 'favorites') {
            countEl.textContent = visibleCount > 0
                ? `מציג ${visibleCount} חופים שמורים ❤️`
                : `עדיין לא שמרתם חופים - לחצו על הלב 🤍 בכרטיס כדי להוסיף`;
        } else {
            countEl.textContent = (tag === 'all')
                ? `מציג את כל ${total} החופים`
                : `מציג ${visibleCount} מתוך ${total} חופים`;
        }
    }
    const emptyEl = document.getElementById('beaches-empty-state');
    if (emptyEl) emptyEl.classList.toggle('hidden', !(visibleCount === 0 && tag !== 'favorites'));
}

// Attractions filter system
function filterAttractions(tag) {
    const grid = document.getElementById('attractions-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('[data-tags]');
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

    document.querySelectorAll('.attr-filter-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-filter') === tag;
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('bg-blue-600', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('bg-gray-100', !isActive);
        btn.classList.toggle('text-gray-700', !isActive);
    });

    const countEl = document.getElementById('attr-filter-count');
    if (countEl) {
        const total = cards.length;
        if (tag === 'favorites') {
            countEl.textContent = visibleCount > 0
                ? `מציג ${visibleCount} אטרקציות שמורות ❤️`
                : `עדיין לא שמרתם אטרקציות - לחצו על הלב 🤍 בכרטיס כדי להוסיף`;
        } else {
            countEl.textContent = (tag === 'all')
                ? `מציג את כל ${total} האטרקציות`
                : `מציג ${visibleCount} מתוך ${total} אטרקציות`;
        }
    }
    const emptyEl = document.getElementById('attractions-empty-state');
    if (emptyEl) emptyEl.classList.toggle('hidden', !(visibleCount === 0 && tag !== 'favorites'));
}

// Hidden gems filter system
function filterGems(tag) {
    const grid = document.getElementById('gems-container-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('[data-tags]');
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

    document.querySelectorAll('.gem-filter-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-filter') === tag;
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('bg-blue-600', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('bg-gray-100', !isActive);
        btn.classList.toggle('text-gray-700', !isActive);
    });

    const countEl = document.getElementById('gem-filter-count');
    if (countEl) {
        const total = cards.length;
        if (tag === 'favorites') {
            countEl.textContent = visibleCount > 0
                ? `מציג ${visibleCount} פנינים שמורות ❤️`
                : `עדיין לא שמרתם פנינים - לחצו על הלב 🤍 בכרטיס כדי להוסיף`;
        } else {
            countEl.textContent = (tag === 'all')
                ? `מציג את כל ${total} הפנינים`
                : `מציג ${visibleCount} מתוך ${total} פנינים`;
        }
    }
    const emptyEl = document.getElementById('gems-empty-state');
    if (emptyEl) emptyEl.classList.toggle('hidden', !(visibleCount === 0 && tag !== 'favorites'));
}

// Restaurant filter system
function filterFood(tag) {
    const cards = document.querySelectorAll('#food [data-tags]');
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

    document.querySelectorAll('.food-filter-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-filter') === tag;
        btn.classList.toggle('active', isActive);
        if (isActive) {
            btn.classList.add('bg-blue-600', 'text-white');
            btn.classList.remove('bg-gray-100', 'bg-green-50', 'bg-blue-50', 'bg-purple-50', 'bg-amber-50', 'text-gray-700', 'text-green-800', 'text-blue-800', 'text-purple-800', 'text-amber-800');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white');
            if (!btn.classList.contains('bg-gray-100') && !['budget','midrange','upscale','luxury'].includes(btn.getAttribute('data-filter'))) {
                btn.classList.add('bg-gray-100', 'text-gray-700');
            }
        }
    });

    const countEl = document.getElementById('food-filter-count');
    if (countEl) {
        const total = cards.length;
        if (tag === 'favorites') {
            countEl.textContent = visibleCount > 0
                ? `מציג ${visibleCount} מסעדות שמורות ❤️`
                : `עדיין לא שמרתם מסעדות - לחצו על הלב 🤍 בכרטיס כדי להוסיף`;
        } else {
            countEl.textContent = (tag === 'all')
                ? `מציג את כל ${total} המסעדות`
                : `מציג ${visibleCount} מתוך ${total} מסעדות`;
        }
    }
    const emptyEl = document.getElementById('food-empty-state');
    if (emptyEl) emptyEl.classList.toggle('hidden', !(visibleCount === 0 && tag !== 'favorites'));
}

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

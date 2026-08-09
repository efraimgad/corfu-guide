// FAQ search + category filtering.
//
// Phase C1 (extraction): this was previously the tail of js/filters.js, whose
// other half exists purely to serve the four legacy category tabs
// (beaches/food/attractions/gems) and dies with them in Phase C2. The FAQ
// panel does NOT die - it is one of the five surviving panels inside the
// merged Guide tab - and it has 12 call sites in index.html.
//
// Moved out rather than left behind because the whole point of Phase C2 is
// that deleting the legacy tabs should also delete the code that only ever
// existed for them. Leaving js/filters.js alive purely to host these three
// functions would have preserved ~130 lines of dead beach/food/attraction
// filtering as the price of keeping FAQ search working.
//
// Nothing here touches applyFilter() or the *ButtonStyle helpers in
// filters.js, so this is a clean lift with no shared state.

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

window.filterFAQ = filterFAQ;
window.filterFAQCategory = filterFAQCategory;

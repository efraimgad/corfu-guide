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
//
// Phase 2 (FAQ data migration): #faq-list used to be 51-53 hand-written
// <details> elements baked directly into index.html. renderFAQList() below
// now builds that same markup at runtime from window.DESTINATION.editorial.faq
// (an array of {id, q, a, cat}, populated per-destination — see
// js/corfu-faq.js / js/testdest-faq.js, auto-generated/placeholder
// respectively). applyFAQFilters()/filterFAQ()/filterFAQCategory() below are
// UNCHANGED: they only ever queried the live DOM (#faq-list details), so
// they work identically whether those <details> were typed by hand or
// rendered by renderFAQList() — the render step just has to run first.

let faqActiveCategory = 'all';

// Builds the exact same <details data-cat="..."> markup the static HTML
// used to hand-author, from window.DESTINATION.editorial.faq. Gracefully
// renders nothing (leaves #faq-list empty) when a destination has no FAQ
// data yet (null/missing/empty array — e.g. the content-free 'empty'
// destination), rather than throwing.
function renderFAQList() {
    const list = document.getElementById('faq-list');
    if (!list) return;

    const dest = window.DESTINATION;
    const faq = (dest && dest.editorial && Array.isArray(dest.editorial.faq)) ? dest.editorial.faq : [];

    list.innerHTML = faq.map(item => {
        const cat = escapeAttr(item.cat || '');
        const q = escapeHtml(item.q || '');
        // item.a is trusted, pre-built HTML (extracted verbatim from the
        // original hand-authored markup / written as placeholder data
        // alongside this codebase) — inserted as-is, same as the static
        // markup it replaces, so any nested tags (e.g. <strong>) survive.
        const a = item.a || '';
        // data-id (not present in the original hand-authored markup) lets
        // js/search.js's global search jump straight to the right answer
        // via a fresh [data-id] lookup after switching tabs - the same
        // mechanism location cards already use - instead of depending on a
        // stale element reference captured before this function ran.
        const id = escapeAttr(item.id || '');
        return `<details data-cat="${cat}" data-id="${id}" class="group bg-white rounded-xl shadow-sm border gt-border-hair overflow-hidden hover:shadow-md transition duration-300">
    <summary class="cursor-pointer font-bold p-5 gt-bg-sunken gt-text-900 text-lg gt-bg-accent-soft gt-text-accent transition-colors flex justify-between items-center select-none">
        <span class="pl-4">${q}</span>
        <span class="text-2xl group-open:rotate-180 transition-transform gt-text-accent">▾</span>
    </summary>
    <div class="p-6 gt-text-700 bg-white border-t gt-border-hair leading-relaxed text-base">
        ${a}
    </div>
</details>`;
    }).join('\n');

    // The intro paragraph above the search box used to hand-state a
    // question count ("ריכזנו עבורכם 51 שאלות..."); replace that number
    // with the real, live count instead of leaving it able to go stale
    // again (the count now known to have drifted once already — 51 vs the
    // real 53 — is exactly the failure mode this avoids repeating).
    const introEl = document.querySelector('#faq p.max-w-3xl');
    if (introEl) {
        introEl.textContent = introEl.textContent.replace(/\d+/, String(faq.length));
    }

    // Recompute #faq-search-count / the empty-state now that #faq-list
    // actually has (or doesn't have) content, so the count shown on first
    // paint reflects the real data instead of the static HTML's fallback
    // text.
    applyFAQFilters();
}

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
window.renderFAQList = renderFAQList;

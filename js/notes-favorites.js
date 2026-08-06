// ============================================================================
// notes-favorites.js — "Our Notes & Favorites": a read-only aggregated view
// over the personal tracking state (visited / rating / note) that
// js/storage.js already keeps per item in ITEM_STATE_CACHE_KEY. No new data
// model - this just walks window.CORFU_LOCATIONS and pulls in whatever
// getItemState() already knows for each item.
// ============================================================================

const NOTES_FAVORITES_CATEGORY_LABELS = {
    beaches: 'חוף',
    food: 'קולינריה',
    attractions: 'אטרקציה',
    gems: 'פנינה נסתרת'
};

function collectNotesFavorites() {
    const locations = window.CORFU_LOCATIONS || {};
    const results = [];
    Object.keys(NOTES_FAVORITES_CATEGORY_LABELS).forEach(cat => {
        (locations[cat] || []).forEach(item => {
            const state = getItemState(item.id);
            const hasNote = !!(state.note && state.note.trim());
            if (!state.is_visited && state.rating == null && !hasNote) return;
            results.push({
                id: item.id,
                name: item.name || item.title || item.id,
                categoryKey: cat,
                categoryLabel: NOTES_FAVORITES_CATEGORY_LABELS[cat],
                is_visited: !!state.is_visited,
                rating: state.rating,
                note: state.note || '',
                updated_at: state.updated_at
            });
        });
    });
    // Most recently updated first - the entries someone is most likely to want to revisit.
    results.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
    return results;
}

function notesFavoritesRowHtml(entry) {
    const starsHtml = entry.rating
        ? `<span class="text-amber-500 font-semibold" aria-label="דירוג ${entry.rating} מתוך 5">${'★'.repeat(entry.rating)}${'☆'.repeat(5 - entry.rating)}</span>`
        : '';
    return `
    <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <p class="font-bold text-gray-900 min-w-0">${escapeHtml(entry.name)}</p>
        <span class="shrink-0 text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">${escapeHtml(entry.categoryLabel)}</span>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-sm mb-1.5">
        ${entry.is_visited ? '<span class="text-emerald-700 font-semibold">✔️ ביקרנו</span>' : ''}
        ${starsHtml}
      </div>
      ${entry.note ? `<p class="text-sm text-gray-600 leading-relaxed">"${escapeHtml(entry.note)}"</p>` : ''}
      <button onclick="scrollToLocationCard('${escapeAttr(entry.id)}','${escapeAttr(entry.categoryKey)}')" class="text-xs font-semibold text-blue-600 hover:underline mt-2">צפייה בכרטיס ←</button>
    </div>`;
}

function renderNotesFavoritesModalContent() {
    const container = document.getElementById('notes-favorites-list');
    const emptyEl = document.getElementById('notes-favorites-empty');
    if (!container) return;
    const entries = collectNotesFavorites();
    if (!entries.length) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');
    container.innerHTML = entries.map(notesFavoritesRowHtml).join('');
}

function renderNotesFavoritesDashboardTile() {
    const valEl = document.getElementById('dash-notes-count');
    if (!valEl) return;
    valEl.textContent = collectNotesFavorites().length;
}

let notesModalTriggerEl = null;

function openNotesModal() {
    notesModalTriggerEl = document.activeElement;
    renderNotesFavoritesModalContent();
    const backdrop = document.getElementById('notes-favorites-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('hidden');
    document.body.classList.add('modal-open');
    const closeBtn = backdrop.querySelector('.notes-favorites-close');
    if (closeBtn) closeBtn.focus();
}

function closeNotesModal() {
    const backdrop = document.getElementById('notes-favorites-backdrop');
    if (!backdrop) return;
    backdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
    if (notesModalTriggerEl) notesModalTriggerEl.focus();
}

document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('notes-favorites-backdrop');
    if (!modal || modal.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
        closeNotesModal();
        return;
    }

    if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll(
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

// Jumps to the item's own tab/card, reusing the same switch+filter-reset+
// scroll+highlight mechanics as a global search result (js/search.js).
function scrollToLocationCard(id, tab) {
    closeNotesModal();
    switchTab(tab, true);
    const resetFilter = typeof SEARCH_RESULT_FILTER_RESET !== 'undefined' ? SEARCH_RESULT_FILTER_RESET[tab] : null;
    if (resetFilter) resetFilter();
    setTimeout(() => {
        const card = document.querySelector(`[data-id="${CSS.escape(id)}"]`);
        if (!card) return;
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('search-highlight');
        setTimeout(() => card.classList.remove('search-highlight'), 2000);
    }, 150);
}

function initNotesFavorites() {
    renderNotesFavoritesDashboardTile();
}

// Keeps the dashboard "התיעוד שלנו" count live as visited/rating/note change
// on any card, without storage.js needing to know this feature exists.
document.addEventListener('click', (e) => {
    if (e.target.closest('.pt-visited-btn') || e.target.closest('.pt-star')) {
        renderNotesFavoritesDashboardTile();
    }
});
let notesFavoritesTileRefreshTimer = null;
document.addEventListener('input', (e) => {
    if (!e.target.closest('.pt-note-textarea')) return;
    clearTimeout(notesFavoritesTileRefreshTimer);
    notesFavoritesTileRefreshTimer = setTimeout(renderNotesFavoritesDashboardTile, 600);
});

window.openNotesModal = openNotesModal;
window.closeNotesModal = closeNotesModal;
window.scrollToLocationCard = scrollToLocationCard;
window.CorfuNotesFavorites = { init: initNotesFavorites, refresh: renderNotesFavoritesDashboardTile };

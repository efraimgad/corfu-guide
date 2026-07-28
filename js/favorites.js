const FAVORITES_KEY = 'corfu-guide-favorites';

function getFavorites() {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveFavorites(favArr) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favArr));
    } catch (e) {
        console.warn('Could not save favorites', e);
    }
}

function toggleFavorite(btnEl) {
    const card = btnEl.closest('[data-id]');
    if (!card) return;
    const id = card.getAttribute('data-id');
    let favorites = getFavorites();

    let isFavorite;
    if (favorites.includes(id)) {
        favorites = favorites.filter(f => f !== id);
        btnEl.textContent = '🤍';
        btnEl.classList.remove('text-red-500', 'bg-red-50');
        btnEl.classList.add('text-gray-400', 'bg-gray-50');
        isFavorite = false;
    } else {
        favorites.push(id);
        btnEl.textContent = '❤️';
        btnEl.classList.remove('text-gray-400', 'bg-gray-50');
        btnEl.classList.add('text-red-500', 'bg-red-50');
        isFavorite = true;
    }
    btnEl.setAttribute('aria-pressed', String(isFavorite));
    saveFavorites(favorites);
    updateDashFavCount();
    if (window.CorfuStorage) window.CorfuStorage.markItemDirty(id);
    // Push this change to Supabase in the background (Step 7) - never
    // blocks or reverts the local toggle above, even if it fails.
    if (typeof queueItemStateSync === 'function') queueItemStateSync(id);

    // Small tactile confirmation that the tap registered
    btnEl.classList.remove('heart-pop');
    void btnEl.offsetWidth; // restart the animation even if toggled twice quickly
    btnEl.classList.add('heart-pop');

    // If currently viewing "favorites only" in any filterable section,
    // refresh that view live so an unfavorited card disappears immediately.
    [
        ['.beach-filter-btn', filterBeaches],
        ['.food-filter-btn', filterFood],
        ['.attr-filter-btn', filterAttractions],
        ['.gem-filter-btn', filterGems]
    ].forEach(([selector, filterFn]) => {
        const activeBtn = document.querySelector(selector + '.active');
        if (activeBtn && activeBtn.getAttribute('data-filter') === 'favorites') {
            filterFn('favorites');
        }
    });
}

// Applies saved favorite state to every heart button on the page (all sections, not just beaches)
function initFavoriteButtons() {
    const favorites = getFavorites();
    document.querySelectorAll('[data-id]').forEach(card => {
        const id = card.getAttribute('data-id');
        const btn = card.querySelector('.favorite-btn');
        if (!btn) return;
        const isFavorite = favorites.includes(id);
        btn.setAttribute('aria-pressed', String(isFavorite));
        if (isFavorite) {
            btn.textContent = '❤️';
            btn.classList.remove('text-gray-400', 'bg-gray-50');
            btn.classList.add('text-red-500', 'bg-red-50');
        }
    });
}

// One delegated listener for all 176 favorite buttons instead of an inline
// onclick="toggleFavorite(this)" on each - keeps the buttons runnable under
// a script-src CSP with no 'unsafe-inline', and means a card added later
// (e.g. dynamically) gets the same behavior for free, with nothing to wire up.
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.favorite-btn');
    if (btn) toggleFavorite(btn);
});

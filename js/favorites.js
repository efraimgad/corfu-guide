const FAVORITES_KEY = gtDestKey('corfu-guide-favorites');
gtMigrateLegacyKey('corfu-guide-favorites');

function getFavorites() {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
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

// isFavorite() + toggleFavoriteId() are the id-level primitives every
// favouriting surface shares (legacy Activities cards, Explore row/sheet
// save buttons, the Saved tab). Everything else in this file is UI: reading
// an id off a specific piece of markup and painting the result back.
function isFavoriteId(id) {
    return getFavorites().includes(id);
}

function toggleFavoriteId(id) {
    let favorites = getFavorites();
    let isFav;
    if (favorites.includes(id)) {
        favorites = favorites.filter(f => f !== id);
        isFav = false;
    } else {
        favorites.push(id);
        isFav = true;
    }
    saveFavorites(favorites);
    updateDashFavCount();
    if (window.CorfuStorage) window.CorfuStorage.markItemDirty(id);
    // Push this change to Supabase in the background (Step 7) - never
    // blocks or reverts the local toggle above, even if it fails.
    if (typeof queueItemStateSync === 'function') queueItemStateSync(id);
    return isFav;
}

// Paints one save/heart button's visuals + a11y state. Three markup shapes
// share this: the legacy large .favorite-btn (Tailwind color-pair classes),
// the compact .gt-explore-icon-btn used by Explore rows and the Saved tab
// (a single --saved modifier class, styled in design-system.css), and the
// explore sheet's full-width .gt-btn--secondary "שמירה" button (label text
// carries the state, no colour swap - it already has its own resting style).
function setFavoriteHeartUI(btnEl, isFav) {
    if (!btnEl) return;
    btnEl.setAttribute('aria-pressed', isFav ? 'true' : 'false');
    if (btnEl.classList.contains('gt-explore-icon-btn')) {
        btnEl.textContent = isFav ? '❤️' : '🤍';
        btnEl.classList.toggle('gt-explore-icon-btn--saved', isFav);
    } else if (btnEl.classList.contains('favorite-btn')) {
        btnEl.textContent = isFav ? '❤️' : '🤍';
        btnEl.classList.toggle('text-red-500', isFav);
        btnEl.classList.toggle('bg-red-50', isFav);
        btnEl.classList.toggle('text-gray-400', !isFav);
        btnEl.classList.toggle('bg-gray-50', !isFav);
    } else {
        btnEl.textContent = isFav ? '❤️ נשמר' : '🤍 שמירה';
    }
}

function heartPop(btnEl) {
    // Small tactile confirmation that the tap registered - restarts even if
    // toggled twice quickly.
    btnEl.classList.remove('heart-pop');
    void btnEl.offsetWidth;
    btnEl.classList.add('heart-pop');
}

function toggleFavorite(btnEl) {
    const card = btnEl.closest('[data-id]');
    if (!card) return;
    const id = card.getAttribute('data-id');
    const isFav = toggleFavoriteId(id);
    setFavoriteHeartUI(btnEl, isFav);
    heartPop(btnEl);

    // If the Activities tab is currently filtered to favourites, refresh it
    // live so an unfavourited card disappears immediately.
    //
    // This used to iterate ['.beach-filter-btn', filterBeaches] and three
    // siblings. All four functions were deleted with the legacy category tabs
    // in Phase C2, and the .*-filter-btn selectors they paired with match zero
    // elements now, so this block threw a ReferenceError on EVERY heart tap —
    // after the favourite itself had already been saved above, which is why
    // the bug stayed invisible in normal use.
    if (activityFavoritesOnly) showActivityFavoritesOnly(true);
}

// Explore rows, the Explore detail sheet, and the Saved tab all favourite a
// window.DESTINATION.locations record (data-loc-id, not the legacy
// data-id) - this is their shared handler. Beyond the toggle itself, it
// keeps every other on-screen copy of the same id's save button in sync
// (a place can appear as an Explore row AND in the Saved tab at once), and
// refreshes the Saved tab live if it's the one currently open.
function toggleExploreFavorite(id, btnEl) {
    const isFav = toggleFavoriteId(id);
    if (btnEl) {
        setFavoriteHeartUI(btnEl, isFav);
        heartPop(btnEl);
    }
    document.querySelectorAll(`[data-loc-id="${CSS.escape(id)}"] [data-explore-action="save"]`).forEach(el => {
        if (el !== btnEl) setFavoriteHeartUI(el, isFav);
    });
    const sheet = document.getElementById('explore-sheet');
    const sheetSaveBtn = document.getElementById('explore-sheet-save-btn');
    if (sheet && sheetSaveBtn && sheet.getAttribute('data-sheet-loc-id') === id) {
        setFavoriteHeartUI(sheetSaveBtn, isFav);
    }
    if (typeof refreshSavedTabIfActive === 'function') refreshSavedTabIfActive();
}
window.toggleExploreFavorite = toggleExploreFavorite;
window.isFavoriteId = isFavoriteId;

// --- "Favourites only" view for the Activities tab --------------------------
//
// Favourites are an ACTIVITIES-tab feature and only ever an activities one:
// the only [data-id] elements in the document are the 14
// <article data-id="activity-N"> cards in #activities-grid, and they are the
// only cards carrying a .favorite-btn. Explore's rows use data-loc-id and have
// no heart at all, and window.CORFU_LOCATIONS contains zero `activity-*` ids
// (see the note at the top of js/explore.js explaining that #activities is
// hand-written HTML, not data-driven). So a saved favourite is always an
// activity, and the Activities tab is the only place one can be shown.
//
// Filtering is a plain inline display toggle rather than a class, because the
// cards carry Tailwind's `flex flex-col`, which would out-specify [hidden].
let activityFavoritesOnly = false;
const ACTIVITY_FAV_BAR_ID = 'activity-fav-bar';

function showActivityFavoritesOnly(on) {
    const grid = document.getElementById('activities-grid');
    if (!grid) return 0;
    activityFavoritesOnly = !!on;

    const favorites = getFavorites();
    const cards = Array.from(grid.querySelectorAll('article[data-id]'));
    let shown = 0;
    cards.forEach(card => {
        const visible = !activityFavoritesOnly || favorites.includes(card.getAttribute('data-id'));
        card.style.display = visible ? '' : 'none';
        if (visible) shown++;
    });

    // A filtered view with no way back out is a trap, so the status bar is
    // created alongside the filter and removed with it — it is never left
    // behind as dead chrome when the filter is off.
    let bar = document.getElementById(ACTIVITY_FAV_BAR_ID);
    if (!activityFavoritesOnly) {
        if (bar) bar.remove();
        return shown;
    }
    if (!bar) {
        bar = document.createElement('div');
        bar.id = ACTIVITY_FAV_BAR_ID;
        bar.className = 'glass-panel rounded-2xl p-4 mb-6 flex items-center justify-between gap-3 flex-wrap';
        bar.setAttribute('role', 'status');
        grid.parentNode.insertBefore(bar, grid);
    }
    // Static Hebrew + an integer only — no user-controlled data reaches this
    // markup, so there is nothing here for escapeHtml to guard.
    bar.innerHTML =
        '<span class="gt-text-700 font-semibold">' +
        (shown === 0
            ? 'עדיין לא שמרתם פעילויות במועדפים'
            : 'מציג ' + shown + ' פעילויות שמורות') +
        '</span>' +
        '<button type="button" class="gt-btn gt-btn--secondary" ' +
        'onclick="showActivityFavoritesOnly(false)">הצג את כל הפעילויות</button>';
    return shown;
}
window.showActivityFavoritesOnly = showActivityFavoritesOnly;
window.isActivityFavoritesOnly = () => activityFavoritesOnly;

// Applies saved favorite state to every heart button on the page - the
// legacy Activities cards' .favorite-btn, and every Explore/Saved row's
// compact save button.
function initFavoriteButtons() {
    const favorites = getFavorites();
    document.querySelectorAll('[data-id]').forEach(card => {
        const id = card.getAttribute('data-id');
        const btn = card.querySelector('.favorite-btn');
        if (btn) setFavoriteHeartUI(btn, favorites.includes(id));
    });
    document.querySelectorAll('[data-loc-id] [data-explore-action="save"]').forEach(btn => {
        const id = btn.closest('[data-loc-id]').getAttribute('data-loc-id');
        setFavoriteHeartUI(btn, favorites.includes(id));
    });
}

window.toggleFavorite = toggleFavorite;

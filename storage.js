// ============================================================================
// storage.js — local persistence layer + the new "personal tracking" widget
// (visited / rating / note) added to every item card.
//
// This file is the only thing that talks to localStorage for the new
// per-item fields (visited/note/rating). Favorites and itinerary-day
// completion already had their own localStorage-backed logic before this
// integration existed (FAVORITES_KEY / TRIP_PROGRESS_KEY, saveFavorites(),
// saveCompletedDays(), initFavoriteButtons(), initTripProgress()) — rather
// than duplicating that, cloud data for those two is merged straight into
// the existing keys/functions, so nothing about how they work changes.
//
// Writes made here are LOCAL ONLY for now (exactly how favorites/itinerary
// already behaved before any of this Supabase work started). Pushing these
// writes to the cloud, with offline queueing, is sync.js in Step 7.
// ============================================================================

const ITEM_STATE_CACHE_KEY = 'corfu-guide-item-state-cache';

// --- Local cache for visited / note / rating --------------------------
// Shape: { [itemId]: { is_visited, note, rating, updated_at } }

function getItemStateCache() {
    try {
        const raw = localStorage.getItem(ITEM_STATE_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function saveItemStateCache(cache) {
    try {
        localStorage.setItem(ITEM_STATE_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.warn('Could not save item-state cache', e);
    }
}

function getItemState(itemId) {
    return getItemStateCache()[itemId] || { is_visited: false, note: '', rating: null, updated_at: null };
}

function setItemState(itemId, partial) {
    const cache = getItemStateCache();
    cache[itemId] = { ...getItemState(itemId), ...partial, updated_at: new Date().toISOString() };
    saveItemStateCache(cache);
    return cache[itemId];
}

// --- Loading everything from the cloud on page open ---------------------
// Cloud rows win on load: they're the last-synced truth from any previous
// session/device. Local storage exists to make the *next* load instant and
// to hold changes made while offline (Step 7).

async function loadAllFromCloud() {
    const [itemStates, itineraryRows] = await Promise.all([
        window.CorfuDB.fetchAllItemStates(),
        window.CorfuDB.fetchItineraryProgress()
    ]);

    // Favorites merge into the EXISTING FAVORITES_KEY array so toggleFavorite()/
    // getFavorites()/initFavoriteButtons() keep working completely untouched.
    saveFavorites(itemStates.filter(r => r.is_favorite).map(r => r.item_id));

    // Visited / note / rating populate the new cache (no prior home for these).
    const cache = {};
    itemStates.forEach(row => {
        cache[row.item_id] = {
            is_visited: row.is_visited,
            note: row.note || '',
            rating: row.rating,
            updated_at: row.updated_at
        };
    });
    saveItemStateCache(cache);

    // Itinerary day-completion merges into the EXISTING TRIP_PROGRESS_KEY array
    // so initTripProgress() keeps working completely untouched.
    saveCompletedDays(itineraryRows.filter(r => r.completed).map(r => String(r.day_number)));
}

// Called once on page load. The page has already rendered from whatever was
// cached locally from a previous visit (existing init calls + the widget
// injection below) — this runs afterward, in the background, and only
// re-renders if the cloud actually had something to add. Never blocks first
// paint on a network round trip.
async function initCloudSync() {
    try {
        await loadAllFromCloud();
        if (typeof initFavoriteButtons === 'function') initFavoriteButtons();
        if (typeof initTripProgress === 'function') initTripProgress();
        document.querySelectorAll('[data-id]').forEach(card => renderPersonalTrackingWidget(card.dataset.id));
    } catch (e) {
        // Offline, SDK blocked, or any Supabase error: the page already works
        // from local data, so this is a soft failure, not a broken page.
        console.warn('Cloud sync unavailable, continuing with local data only:', e.message);
    }
}

// --- Personal tracking widget: visited toggle, 1-5 rating, note field -----
// Injected once per item card (every element with a data-id, ~176 cards
// across beaches/food/attractions/gems/activities) rather than hand-added
// to each card's HTML, so there's exactly one place that defines this UI.

function buildPersonalTrackingWidgetHTML() {
    const stars = [1, 2, 3, 4, 5].map(v => `
        <button type="button" class="pt-star" data-value="${v}" aria-label="דרגו ${v} מתוך 5 כוכבים">
            <svg class="icon-line" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.5Z"/></svg>
        </button>`).join('');

    return `
    <div class="personal-tracking-widget">
        <button type="button" class="pt-visited-btn" aria-pressed="false" title="סמנו כמקום שביקרתם בו">
            <svg class="icon-line" viewBox="0 0 24 24"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
            <span class="pt-visited-label">ביקרתי</span>
        </button>
        <div class="pt-rating" role="radiogroup" aria-label="דירוג אישי">${stars}</div>
        <button type="button" class="pt-note-toggle" aria-expanded="false" title="הוסיפו הערה אישית">
            <svg class="icon-line" viewBox="0 0 24 24"><path d="M4 20l1-4.2L16.8 4a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1L8.2 19 4 20Z"/></svg>
        </button>
        <textarea class="pt-note-textarea hidden" rows="2" placeholder="הערה אישית..." aria-label="הערה אישית"></textarea>
    </div>`;
}

function renderPersonalTrackingWidget(itemId) {
    const card = document.querySelector(`[data-id="${CSS.escape(itemId)}"]`);
    const widget = card && card.querySelector('.personal-tracking-widget');
    if (!widget) return;
    const state = getItemState(itemId);

    const visitedBtn = widget.querySelector('.pt-visited-btn');
    visitedBtn.classList.toggle('pt-visited-btn--active', !!state.is_visited);
    visitedBtn.setAttribute('aria-pressed', String(!!state.is_visited));

    widget.querySelectorAll('.pt-star').forEach(star => {
        const value = Number(star.dataset.value);
        star.classList.toggle('pt-star--active', state.rating != null && value <= state.rating);
    });

    widget.querySelector('.pt-note-toggle')
        .classList.toggle('pt-note-toggle--has-note', !!(state.note && state.note.trim()));

    const textarea = widget.querySelector('.pt-note-textarea');
    // Never stomp on text the user is actively typing.
    if (document.activeElement !== textarea) {
        textarea.value = state.note || '';
    }
}

function injectPersonalTrackingWidgets() {
    document.querySelectorAll('[data-id]').forEach(card => {
        if (card.querySelector('.personal-tracking-widget')) return; // don't double-inject
        card.insertAdjacentHTML('beforeend', buildPersonalTrackingWidgetHTML());
        renderPersonalTrackingWidget(card.dataset.id);
    });
}

// Local-only writes for now (see file header) — one delegated listener
// instead of inline onclick on every one of the ~176 injected widgets.
document.addEventListener('click', (e) => {
    const visitedBtn = e.target.closest('.pt-visited-btn');
    if (visitedBtn) {
        const itemId = visitedBtn.closest('[data-id]').dataset.id;
        setItemState(itemId, { is_visited: !getItemState(itemId).is_visited });
        renderPersonalTrackingWidget(itemId);
        // Push to Supabase in the background (Step 7) - the line above already
        // applied the change locally and on screen, so this never blocks or
        // reverts it, even if the save fails or the user is offline.
        if (typeof queueItemStateSync === 'function') queueItemStateSync(itemId);
        return;
    }

    const starBtn = e.target.closest('.pt-star');
    if (starBtn) {
        const itemId = starBtn.closest('[data-id]').dataset.id;
        const value = Number(starBtn.dataset.value);
        // Clicking the currently-set star clears the rating (common star-widget convention).
        const newRating = getItemState(itemId).rating === value ? null : value;
        setItemState(itemId, { rating: newRating });
        renderPersonalTrackingWidget(itemId);
        if (typeof queueItemStateSync === 'function') queueItemStateSync(itemId);
        return;
    }

    const noteToggle = e.target.closest('.pt-note-toggle');
    if (noteToggle) {
        const textarea = noteToggle.closest('.personal-tracking-widget').querySelector('.pt-note-textarea');
        const nowHidden = textarea.classList.toggle('hidden');
        noteToggle.setAttribute('aria-expanded', String(!nowHidden));
        if (!nowHidden) textarea.focus();
    }
});

// Debounced so typing a note doesn't hit localStorage on every keystroke.
const noteSaveTimers = {};
document.addEventListener('input', (e) => {
    const textarea = e.target.closest('.pt-note-textarea');
    if (!textarea) return;
    const itemId = textarea.closest('[data-id]').dataset.id;
    clearTimeout(noteSaveTimers[itemId]);
    noteSaveTimers[itemId] = setTimeout(() => {
        setItemState(itemId, { note: textarea.value });
        renderPersonalTrackingWidget(itemId);
        if (typeof queueItemStateSync === 'function') queueItemStateSync(itemId);
    }, 500);
});

window.CorfuStorage = {
    getItemState,
    setItemState,
    getItemStateCache,
    loadAllFromCloud,
    initCloudSync,
    injectPersonalTrackingWidgets,
    renderPersonalTrackingWidget
};

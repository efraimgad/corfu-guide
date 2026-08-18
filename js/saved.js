// ============================================================================
// saved.js — the "שמורים" (Saved) tab: every favourited location, grouped by
// category. Renders with js/explore.js's OWN row-card markup
// (exploreRowCardHtml()) and detail sheet (openExploreSheet()) rather than a
// second card design - a saved beach looks and opens exactly like it does in
// Discover, because it's the same data and the same renderer.
//
// Unlike every other tab, this one is rebuilt on every visit rather than
// rendered once and cached (see js/ui.js's CATEGORY_RENDERERS/switchTab) -
// its whole point is to reflect favourites toggled elsewhere (Explore rows,
// the detail sheet's "שמירה" button), so a stale one-time render would
// silently hide newly-saved places.
//
// Legacy Activities favourites (the 14 hand-authored #activities-grid
// cards, data-id="activity-N" - see js/favorites.js's own history note)
// have no window.DESTINATION.locations record to render a row from, so
// they're surfaced as a link into that tab's existing favourites-only view
// (viewFavorites(), js/dashboard.js) rather than invented a second time here.
// ============================================================================

// Phase 3: grouped by real mood/use, not raw data category - "the places
// we want to remember" reads as a personal list, not a database export.
// Priority order below matters: a sunset-tagged beach lands under "לשקיעה"
// (the more specific, distinguishing reason it was saved), not duplicated
// into "לשחות" too - every saved place appears in exactly one bucket.
// Built from the same real `tags`/category fields Discover's mood grid
// already reads, not a new classification.
const GT_SAVED_BUCKETS = [
    { key: 'sunset', emoji: '🌅', label: 'לשקיעה', test: (d, catKey) => (d.tags || '').split(',').map(t => t.trim()).includes('sunset') },
    { key: 'swim', emoji: '🌊', label: 'לשחות', test: (d, catKey) => catKey === 'beaches' },
    { key: 'eat', emoji: '🍴', label: 'לאכול', test: (d, catKey) => catKey === 'food' },
    { key: 'mustsee', emoji: '⭐', label: 'לא לפספס', test: () => true }
];

function gtSavedGroupsByMood() {
    const favorites = (typeof getFavorites === 'function') ? getFavorites() : [];
    const favSet = new Set(favorites);
    const locations = (window.DESTINATION && window.DESTINATION.locations) || {};
    const categories = (typeof EXPLORE_CATEGORIES !== 'undefined') ? EXPLORE_CATEGORIES : [];

    // A handful of real places are catalogued twice under two categories at
    // the same coordinates (Phase 4 content audit - e.g. Afionas village
    // under both attractions and gems - see the identical dedup in
    // js/location-shared.js's gtNearHotelItems() and js/explore.js's
    // gtSelectMood()). Saving both copies from two different browsing
    // contexts is easy to do without realizing they're the same place, and
    // showing them as two separate cards here would read as a duplicate-
    // entry bug in the one list this app frames as a personal, curated
    // shortlist - so it gets the same coordinate-rounding dedup as those
    // other two lists, keeping whichever copy is favorited/encountered
    // first.
    const seenCoords = new Set();
    let remaining = [];
    categories.forEach(cat => {
        (locations[cat.key] || []).forEach(d => {
            if (!favSet.has(d.id)) return;
            if (typeof d.lat === 'number' && typeof d.lon === 'number') {
                const coordKey = d.lat.toFixed(4) + ',' + d.lon.toFixed(4);
                if (seenCoords.has(coordKey)) return;
                seenCoords.add(coordKey);
            }
            remaining.push({ d, catKey: cat.key });
        });
    });

    const groups = [];
    GT_SAVED_BUCKETS.forEach(bucket => {
        const items = remaining.filter(s => bucket.test(s.d, s.catKey));
        if (items.length) groups.push({ bucket, items });
        remaining = remaining.filter(s => !bucket.test(s.d, s.catKey));
    });
    return groups;
}

function renderSavedTab() {
    const container = document.getElementById('saved-list');
    if (!container) return;

    const groups = gtSavedGroupsByMood();
    let html = '';
    groups.forEach(({ bucket, items }) => {
        html += `<h3 class="gt-explore-group-header">${bucket.emoji} ${escapeHtml(bucket.label)} · ${items.length}</h3>`;
        items.forEach(({ d, catKey }) => { html += exploreRowCardHtml(d, catKey); });
    });
    container.innerHTML = html;

    const favorites = (typeof getFavorites === 'function') ? getFavorites() : [];
    const hasSavedActivities = favorites.some(id => String(id).indexOf('activity-') === 0);
    const linkWrap = document.getElementById('saved-activities-link');
    if (linkWrap) linkWrap.classList.toggle('hidden', !hasSavedActivities);

    const emptyEl = document.getElementById('saved-empty-state');
    if (emptyEl) emptyEl.classList.toggle('hidden', groups.length > 0 || hasSavedActivities);

    // Paints the just-rendered save buttons with their current state (they
    // always start life as ❤️ candidates here - everything in this list is
    // saved by definition - but exploreRowCardHtml() itself has no idea
    // that, so it always emits the resting 🤍 markup like any other row).
    if (typeof initFavoriteButtons === 'function') initFavoriteButtons();
}
window.renderSavedTab = renderSavedTab;

function refreshSavedTabIfActive() {
    const tab = document.getElementById('saved');
    if (tab && tab.classList.contains('active')) renderSavedTab();
}
window.refreshSavedTabIfActive = refreshSavedTabIfActive;

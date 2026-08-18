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

function gtSavedGroupsByCategory() {
    const favorites = (typeof getFavorites === 'function') ? getFavorites() : [];
    const favSet = new Set(favorites);
    const locations = (window.DESTINATION && window.DESTINATION.locations) || {};
    const categories = (typeof EXPLORE_CATEGORIES !== 'undefined') ? EXPLORE_CATEGORIES : [];

    return categories
        .map(cat => ({ cat, items: (locations[cat.key] || []).filter(d => favSet.has(d.id)) }))
        .filter(group => group.items.length > 0);
}

function renderSavedTab() {
    const container = document.getElementById('saved-list');
    if (!container) return;

    const groups = gtSavedGroupsByCategory();
    let html = '';
    groups.forEach(({ cat, items }) => {
        html += `<h3 class="gt-explore-group-header">${escapeHtml(cat.label)} · ${items.length}</h3>`;
        items.forEach(d => { html += exploreRowCardHtml(d, cat.key); });
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

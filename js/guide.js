// ============================================================================
// guide.js — Phase 4, final batch: the merged "מדריך" (Guide) tab.
//
// Approach: SHOW/HIDE, not physical relocation (see the HTML comment above
// #guide in index.html for the full rationale). The four real content
// sections - #trip-planning, #health-safety, #language-daily, #faq - stay
// exactly where they've always lived in the DOM, byte-for-byte unchanged.
// This file only toggles which one of the four is currently display:block
// (driven by #guide's .gt-chip sub-nav, or by js/ui.js's switchTab()
// redirecting a direct call like switchTab('faq') into this tab - see the
// GT_GUIDE_PANEL_IDS handling there), and keeps the chip row's
// aria-pressed state in sync with the current selection.
//
// Deliberately its own file (like js/explore.js, js/itinerary-view.js
// before it) rather than folded into js/ui.js or js/app-shell.js, so this
// batch's diff stays easy to review in isolation from the tab-switching
// engine itself.
// ============================================================================

// Must stay in sync with GT_GUIDE_PANEL_IDS (js/ui.js) - the two lists are
// the same set seen from two sides: that one decides which switchTab() calls
// redirect into Guide, this one decides which panels Guide can show. A
// mismatch is silent (a tab that redirects to a panel that never displays),
// so scripts/test-guide-panels.js asserts they are equal.
const GT_GUIDE_PANEL_IDS_LIST = ['trip-planning', 'health-safety', 'language-daily', 'faq', 'activities'];

// Remembers the last panel shown, so re-opening Guide via the bottom nav
// (switchTab('guide'), no specific panel named) returns to wherever the
// user last left it instead of always resetting to תכנון.
let gtCurrentGuidePanel = 'trip-planning';

function gtShowGuidePanel(panelId) {
    if (!GT_GUIDE_PANEL_IDS_LIST.includes(panelId)) panelId = gtCurrentGuidePanel;
    gtCurrentGuidePanel = panelId;

    GT_GUIDE_PANEL_IDS_LIST.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const show = id === panelId;
        el.style.display = show ? 'block' : 'none';
        el.classList.toggle('active', show);
        // These sections used to get this treatment from switchTab() itself
        // (back when each was its own standalone tab) - now that switchTab()
        // only ever directly animates #guide, the shown panel needs the same
        // one-time reveal-on-scroll wiring here, or its cards/FAQ entries
        // would stay at opacity:0 forever (see .reveal-on-scroll in
        // css/design-system.css). setupRevealAnimations() is safe to call
        // repeatedly - it skips anything already marked [data-revealed].
        if (show && typeof setupRevealAnimations === 'function') setupRevealAnimations(el);
    });

    // role="tab" chips take aria-selected, not aria-pressed (that combo is
    // invalid per the ARIA tabs pattern already used by the main premium-nav
    // tablist - see index.html's #tab-about etc. and js/ui.js's
    // handleTablistKeydown(), reused as-is via #guide-chip-nav's
    // onkeydown="handleTablistKeydown(event)").
    let activeChipLabel = '';
    document.querySelectorAll('#guide-chip-nav .gt-chip').forEach((chip) => {
        const isActive = chip.getAttribute('data-guide-panel') === panelId;
        chip.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive) activeChipLabel = chip.textContent.trim();
    });

    // Same aria-live="polite" convention already used for the site's
    // dynamic filter counts (#beach-filter-count etc.) - announces which
    // Guide section is now showing, since the panel switch itself is a
    // plain display:none/block toggle with nothing else to tell a screen
    // reader user the content just changed underneath the chip row.
    const liveEl = document.getElementById('guide-panel-live');
    if (liveEl) liveEl.textContent = activeChipLabel ? `מוצג: ${activeChipLabel}` : '';
}

// Chip click handler - same panelId values as GT_GUIDE_PANEL_IDS_LIST above.
function gtSelectGuideChip(panelId) {
    gtShowGuidePanel(panelId);
}

window.gtShowGuidePanel = gtShowGuidePanel;
window.gtSelectGuideChip = gtSelectGuideChip;

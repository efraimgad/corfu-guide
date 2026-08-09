// ============================================================================
// tools-fab.js — Phase 4, final batch: the floating "quick tools" button
// (currency converter + distance calculator), reachable from every tab via
// #gt-tools-fab-btn (see index.html, placed outside every .tab-content
// section like #back-to-top-btn/#map-fab-btn).
//
// This never duplicates the converter/calculator. It temporarily relocates
// the exact same #plan-money-converter-block and #plan-transport-distance-
// block DOM nodes - the real ones that live inside Guide → תכנון
// (#plan-money/#plan-transport, see index.html) - into this sheet's two
// slots while it's open, then moves them back to their original spot the
// moment it closes. Same live inputs (#currency-eur-input, #dist-from,
// #dist-to, ...), same convertCurrency()/calculateDistance() (js/tools.js),
// no second copy that could drift out of sync. This is the same
// gtRelocate()/gtRestoreRelocatedNodes() node-move pattern
// js/itinerary-view.js established for its day-context bar, reimplemented
// here with its own private tracking array so the two features stay
// independent (this sheet can open/close freely regardless of which
// itinerary day is currently selected, and vice versa).
// ============================================================================

const gtToolsRelocatedNodes = [];
function gtToolsRelocate(el, container) {
    if (!el || !container) return;
    if (!el._gtToolsPlaceholder) {
        const marker = document.createComment('gt-tools-relocated');
        el.parentNode.insertBefore(marker, el);
        el._gtToolsPlaceholder = marker;
    }
    gtToolsRelocatedNodes.push(el);
    container.appendChild(el);
}
function gtToolsRestoreRelocatedNodes() {
    gtToolsRelocatedNodes.forEach((el) => {
        if (el._gtToolsPlaceholder && el._gtToolsPlaceholder.parentNode) {
            el._gtToolsPlaceholder.parentNode.insertBefore(el, el._gtToolsPlaceholder);
            el._gtToolsPlaceholder.remove();
        }
        el._gtToolsPlaceholder = null;
    });
    gtToolsRelocatedNodes.length = 0;
}

let gtToolsSheetTriggerEl = null;
function gtOpenToolsSheet() {
    const currencyBlock = document.getElementById('plan-money-converter-block');
    const distanceBlock = document.getElementById('plan-transport-distance-block');
    const currencySlot = document.getElementById('gt-tools-currency-slot');
    const distanceSlot = document.getElementById('gt-tools-distance-slot');
    // Both selects are populated once at page load (populateDistanceSelects(),
    // js/init.js) and the currency result spans are kept current by
    // convertCurrency()'s own oninput handler on #currency-eur-input -
    // relocating these nodes carries their already-set values/options
    // along with them, nothing needs re-running here.
    gtToolsRelocate(currencyBlock, currencySlot);
    gtToolsRelocate(distanceBlock, distanceSlot);

    const backdrop = document.getElementById('gt-tools-sheet-backdrop');
    const sheet = document.getElementById('gt-tools-sheet');
    if (!backdrop || !sheet) return;
    gtToolsSheetTriggerEl = document.activeElement;
    backdrop.classList.remove('hidden');
    sheet.classList.remove('hidden');
    document.body.classList.add('modal-open');
    const closeBtn = sheet.querySelector('button[aria-label="סגירה"]');
    if (closeBtn) closeBtn.focus();
}

function gtCloseToolsSheet() {
    gtToolsRestoreRelocatedNodes();

    const backdrop = document.getElementById('gt-tools-sheet-backdrop');
    const sheet = document.getElementById('gt-tools-sheet');
    if (backdrop) backdrop.classList.add('hidden');
    if (sheet) sheet.classList.add('hidden');
    // isAnyGtSheetOpen() (js/app-shell.js) also checks this sheet - see the
    // small addition there - so 'modal-open' only clears once every one of
    // the app's sheets (More/Trip/Tools) is closed.
    if (typeof isAnyGtSheetOpen !== 'function' || !isAnyGtSheetOpen()) {
        document.body.classList.remove('modal-open');
    }
    if (gtToolsSheetTriggerEl) gtToolsSheetTriggerEl.focus();
}

// Escape closes this sheet too, and Tab/Shift+Tab are trapped inside it
// while it's open - same convention as the More/Trip sheets (js/app-shell.js)
// and the emergency modal (js/ui.js).
document.addEventListener('keydown', (e) => {
    const sheet = document.getElementById('gt-tools-sheet');
    if (!sheet || sheet.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
        gtCloseToolsSheet();
        return;
    }

    if (e.key === 'Tab') {
        const focusable = sheet.querySelectorAll(
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

window.gtOpenToolsSheet = gtOpenToolsSheet;
window.gtCloseToolsSheet = gtCloseToolsSheet;

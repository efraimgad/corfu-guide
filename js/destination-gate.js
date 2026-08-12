// ============================================================================
// destination-gate.js — shows the destination-selector or unknown-destination
// takeover screen for the 'selector'/'unknown' states from
// js/destination-registry.js, and hides it entirely for 'ready'.
//
// Runs as a plain <script defer>, so by the time it executes the DOM (the
// #destination-gate markup in index.html) already exists - no need to wait
// for DOMContentLoaded. Must load after js/destination-registry.js (reads
// window.GT_DESTINATION_STATE/window.GT_REQUESTED_DESTINATION_ID) and after
// js/html-utils.js (uses escapeHtml/escapeAttr).
// ============================================================================

(function () {
    const gate = document.getElementById('destination-gate');
    if (!gate) return;

    if (window.GT_DESTINATION_STATE === 'ready') {
        gate.classList.add('hidden');
        return;
    }

    gate.classList.remove('hidden');

    const selectorView = document.getElementById('destination-selector-view');
    const unknownView = document.getElementById('destination-unknown-view');

    if (window.GT_DESTINATION_STATE === 'selector') {
        if (selectorView) selectorView.classList.remove('hidden');
        if (unknownView) unknownView.classList.add('hidden');
        renderDestinationSelectorList();
    } else {
        // 'unknown'
        if (unknownView) unknownView.classList.remove('hidden');
        if (selectorView) selectorView.classList.add('hidden');
        const idEl = document.getElementById('destination-unknown-id');
        if (idEl) idEl.textContent = window.GT_REQUESTED_DESTINATION_ID || '';
    }

    // Cards are generated from window.DESTINATIONS (the registry every
    // data/destinations/*.js file populates) - never a hardcoded list, so a
    // newly added destination package appears here automatically.
    function renderDestinationSelectorList() {
        const list = document.getElementById('destination-selector-list');
        if (!list) return;
        const registry = window.DESTINATIONS || {};
        const ids = Object.keys(registry).sort();
        const esc = window.escapeHtml || (s => String(s == null ? '' : s));
        const escAttr = window.escapeAttr || esc;

        if (!ids.length) {
            list.innerHTML = '<p class="gt-text-500 col-span-full">לא נמצאו יעדים רשומים.</p>';
            return;
        }

        list.innerHTML = ids.map(id => {
            const d = registry[id] || {};
            const name = esc(d.name || d.nameEn || id);
            const country = esc(d.countryEn || d.country || '');
            return `<a href="?destination=${escAttr(id)}" class="block p-5 rounded-2xl border gt-border-hair bg-white shadow-sm hover:shadow-md transition-shadow">
                <div class="text-xl font-bold gt-text-900">${name}</div>
                ${country ? `<div class="text-sm gt-text-500 mt-1">${country}</div>` : ''}
            </a>`;
        }).join('');
    }
})();

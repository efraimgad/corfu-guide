// ============================================================================
// packing.js — interactive packing checklist: a pre-trip list plus a daily
// "beach bag" list, each item checkable and persisted locally.
// ============================================================================

const PACKING_STATE_KEY = gtDestKey('corfu-guide-packing-state');
gtMigrateLegacyKey('corfu-guide-packing-state');
// Shape: { [itemId]: boolean }

// Destination-sourced (was a hardcoded object literal tuned for a September
// couple's self-drive trip to Corfu). See data/destinations/*.js's own
// `packingDefaults` field - editable there if a destination's actual packing
// needs differ.
const PACKING_ITEMS = window.DESTINATION.packingDefaults;

function getPackingState() {
    try {
        const raw = localStorage.getItem(PACKING_STATE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) {
        return {};
    }
}

function savePackingState(state) {
    try {
        localStorage.setItem(PACKING_STATE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save packing state', e);
    }
}

function buildPackingListHtml(items) {
    return items.map(it => `
      <label class="flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl px-3 py-2.5 cursor-pointer text-sm">
        <input type="checkbox" class="packing-checkbox w-5 h-5 accent-emerald-600 rounded shrink-0" data-item-id="${it.id}" onchange="togglePackingItem(this)">
        <span>${escapeHtml(it.label)}</span>
      </label>`).join('');
}

function renderPackingLists() {
    const preEl = document.getElementById('packing-pretrip-list');
    const beachEl = document.getElementById('packing-beach-list');
    if (preEl) preEl.innerHTML = buildPackingListHtml(PACKING_ITEMS.pretrip);
    if (beachEl) beachEl.innerHTML = buildPackingListHtml(PACKING_ITEMS.beach);
    hydratePackingState();
}

function hydratePackingState() {
    const state = getPackingState();
    document.querySelectorAll('.packing-checkbox').forEach(cb => {
        cb.checked = !!state[cb.dataset.itemId];
    });
    updatePackingDashboardTile();
}

function togglePackingItem(checkboxEl) {
    const state = getPackingState();
    state[checkboxEl.dataset.itemId] = checkboxEl.checked;
    savePackingState(state);
    updatePackingDashboardTile();
}

function updatePackingDashboardTile() {
    const valEl = document.getElementById('dash-packing-value');
    if (!valEl) return;
    const state = getPackingState();
    const allItems = [...PACKING_ITEMS.pretrip, ...PACKING_ITEMS.beach];
    const checked = allItems.filter(it => state[it.id]).length;
    valEl.textContent = `${checked}/${allItems.length}`;
}

function viewPacking() {
    const panel = document.getElementById('packing-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initPacking() {
    renderPackingLists();
}

window.togglePackingItem = togglePackingItem;
window.viewPacking = viewPacking;
window.CorfuPacking = { init: initPacking };

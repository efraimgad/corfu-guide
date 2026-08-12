// ============================================================================
// destination-registry.js — resolves which of three states this page load
// is in, and (for the 'ready' state) which destination is ACTIVE.
//
// Destinations self-register into window.DESTINATIONS[id] = {...} (see
// data/destinations/*.js). This file decides ONE of three states from the
// ?destination=<id> query param ALONE — no localStorage fallback, no
// default destination. Root URL with no param is a deliberate landing
// state, not an implicit choice of Corfu:
//
//   - no ?destination= param at all         -> state 'selector'
//   - ?destination=<id> matches the registry -> state 'ready', that
//                                                destination is active
//   - ?destination=<id> matches nothing      -> state 'unknown'
//
// window.GT_DESTINATION_STATE carries this. window.GT_REQUESTED_DESTINATION_ID
// carries the raw query-param value (or null), for the 'unknown' screen to
// echo back. js/destination-gate.js reads both and shows/hides the
// selector/unknown takeover screen accordingly.
//
// window.DESTINATION is ALWAYS a valid, fully-shaped object, even in the
// 'selector'/'unknown' states — it points at window.DESTINATIONS.empty (see
// data/destinations/empty.js), which is real content-free data, not a
// Corfu fallback. This is what lets every other script that reads
// window.DESTINATION.* at its own top level (solar.js, tools.js, packing.js,
// dashboard.js, map.js, explore.js) run without special-casing "is there
// even a destination yet" — there always is one, it's just empty when nothing
// real is being shown (the destination-gate overlay covers the page in that
// case, so nothing Corfu- or content-shaped is ever visible regardless).
//
// Load order: this file must load AFTER every data/destinations/*.js file
// (so window.DESTINATIONS is fully populated) and BEFORE any script that
// reads window.DESTINATION at its own top level. See index.html's script
// order comment for the full list this constrains.
// ============================================================================

const FALLBACK_DESTINATION_ID = 'empty';

function gtGetRequestedDestinationId() {
    try {
        const params = new URLSearchParams(window.location.search);
        return params.get('destination'); // null when the param is absent
    } catch (e) {
        return null;
    }
}

const GT_REQUESTED_DESTINATION_ID = gtGetRequestedDestinationId();
const GT_DESTINATION_REGISTRY = window.DESTINATIONS || {};

let GT_DESTINATION_STATE;
if (GT_REQUESTED_DESTINATION_ID === null) {
    GT_DESTINATION_STATE = 'selector';
} else if (Object.prototype.hasOwnProperty.call(GT_DESTINATION_REGISTRY, GT_REQUESTED_DESTINATION_ID)) {
    GT_DESTINATION_STATE = 'ready';
} else {
    GT_DESTINATION_STATE = 'unknown';
}

window.GT_DESTINATION_STATE = GT_DESTINATION_STATE;
window.GT_REQUESTED_DESTINATION_ID = GT_REQUESTED_DESTINATION_ID;

window.DESTINATION = (GT_DESTINATION_STATE === 'ready')
    ? GT_DESTINATION_REGISTRY[GT_REQUESTED_DESTINATION_ID]
    : GT_DESTINATION_REGISTRY[FALLBACK_DESTINATION_ID];

if (!window.DESTINATION) {
    // Fails loud rather than letting every consumer below throw its own
    // cryptic "Cannot read properties of null" - this can only happen if
    // data/destinations/empty.js is missing from index.html's script list.
    console.error('[destination-registry] No destination data registered — check that data/destinations/*.js loaded before this file.');
}

if (GT_DESTINATION_STATE === 'ready') {
    try { localStorage.setItem('gt-last-destination', GT_REQUESTED_DESTINATION_ID); } catch (e) { /* private mode etc. */ }
}

// ---------------------------------------------------------------------------
// Destination-scoped storage keys. Unchanged from Phase 1 — every module
// that persists per-destination user state (favorites, itinerary progress,
// notes, packing, reservations, dashboard overrides, sync queue) builds its
// localStorage key with gtDestKey() instead of a bare literal, so two
// destinations never share a key.
// ---------------------------------------------------------------------------
function gtDestKey(baseKey) {
    const id = (window.DESTINATION && window.DESTINATION.id) || FALLBACK_DESTINATION_ID;
    return `${baseKey}:${id}`;
}

// One-time migration: copies a legacy un-namespaced key's value forward to
// the namespaced key, only for the original default destination (corfu, the
// one this app shipped as before namespacing existed) and only if the
// namespaced key doesn't already exist.
function gtMigrateLegacyKey(baseKey) {
    if (!window.DESTINATION || window.DESTINATION.id !== 'corfu') return;
    try {
        const namespaced = gtDestKey(baseKey);
        if (localStorage.getItem(namespaced) !== null) return;
        const legacy = localStorage.getItem(baseKey);
        if (legacy !== null) localStorage.setItem(namespaced, legacy);
    } catch (e) { /* private mode etc. */ }
}

window.gtDestKey = gtDestKey;
window.gtMigrateLegacyKey = gtMigrateLegacyKey;

// ============================================================================
// destination-registry.js — resolves which destination's data populates
// window.DESTINATION for this page load, and every destination-scoped
// storage key.
//
// Destinations self-register into window.DESTINATIONS[id] = {...} (see
// data/destinations/*.js). This file only picks which one is ACTIVE:
//   1. ?destination=<id> query param (also remembered for next visit)
//   2. a previously-remembered choice in localStorage
//   3. 'corfu' — the shipped default
//
// Load order: this file must load AFTER every data/destinations/*.js file
// (so window.DESTINATIONS is fully populated) and BEFORE any script that
// reads window.DESTINATION at its own top level — solar.js, tools.js,
// packing.js, dashboard.js, map.js and explore.js all do this, since they
// derive their own top-level constants from it. See index.html's script
// order comment for the full list this constrains.
// ============================================================================

const DEFAULT_DESTINATION_ID = 'corfu';
const ACTIVE_DESTINATION_STORAGE_KEY = 'gt-active-destination';

function gtResolveActiveDestinationId() {
    const registry = window.DESTINATIONS || {};
    try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('destination');
        if (fromQuery && registry[fromQuery]) {
            try { localStorage.setItem(ACTIVE_DESTINATION_STORAGE_KEY, fromQuery); } catch (e) { /* private mode etc. */ }
            return fromQuery;
        }
        const fromStorage = localStorage.getItem(ACTIVE_DESTINATION_STORAGE_KEY);
        if (fromStorage && registry[fromStorage]) return fromStorage;
    } catch (e) { /* private mode etc. */ }
    return DEFAULT_DESTINATION_ID;
}

const GT_ACTIVE_DESTINATION_ID = gtResolveActiveDestinationId();
window.DESTINATION = (window.DESTINATIONS && window.DESTINATIONS[GT_ACTIVE_DESTINATION_ID])
    || (window.DESTINATIONS && window.DESTINATIONS[DEFAULT_DESTINATION_ID])
    || null;

if (!window.DESTINATION) {
    // Fails loud rather than letting every consumer below throw its own
    // cryptic "Cannot read properties of null" - this can only happen if a
    // data/destinations/*.js file is missing from index.html's script list.
    console.error('[destination-registry] No destination data registered — check that data/destinations/*.js loaded before this file.');
}

// ---------------------------------------------------------------------------
// Destination-scoped storage keys.
//
// Every module that persists per-destination user state (favorites,
// itinerary progress, notes, packing, reservations, dashboard overrides,
// sync queue) should build its localStorage key with gtDestKey() instead of
// a bare literal, so two destinations never share a key - switching
// destinations never bleeds one guide's favorites/progress into another's.
// ---------------------------------------------------------------------------
function gtDestKey(baseKey) {
    const id = (window.DESTINATION && window.DESTINATION.id) || DEFAULT_DESTINATION_ID;
    return `${baseKey}:${id}`;
}

// One-time migration: copies a legacy un-namespaced key's value forward to
// the namespaced key, only for the default destination (corfu, the one this
// app shipped as before namespacing existed) and only if the namespaced key
// doesn't already exist. Existing users' favorites/progress/notes are
// carried forward instead of appearing to reset.
function gtMigrateLegacyKey(baseKey) {
    if (!window.DESTINATION || window.DESTINATION.id !== DEFAULT_DESTINATION_ID) return;
    try {
        const namespaced = gtDestKey(baseKey);
        if (localStorage.getItem(namespaced) !== null) return;
        const legacy = localStorage.getItem(baseKey);
        if (legacy !== null) localStorage.setItem(namespaced, legacy);
    } catch (e) { /* private mode etc. */ }
}

window.gtDestKey = gtDestKey;
window.gtMigrateLegacyKey = gtMigrateLegacyKey;

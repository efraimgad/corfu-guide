// ============================================================================
// sync.js — pushes local changes to Supabase (via database.js), with
// optimistic updates, offline queueing, and automatic retry when the
// connection returns.
//
// "Optimistic" here means storage.js already updated localStorage and the
// on-screen widget instantly, before any function in this file ever runs -
// a cloud save failing never undoes what the user already saw happen. This
// file's only job is best-effort delivery of that already-applied change to
// Supabase, and holding onto it until it succeeds if the first attempt
// can't reach the network.
// ============================================================================

const SYNC_QUEUE_KEY = 'corfu-guide-sync-queue';

function getSyncQueue() {
    try {
        const raw = localStorage.getItem(SYNC_QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveSyncQueue(queue) {
    try {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.warn('Could not save sync queue', e);
    }
}

// Replaces any existing queued entry for the same (type, key) rather than
// appending, so several offline edits to the same item collapse into a
// single pending write instead of piling up redundant requests.
function enqueue(type, key, entry) {
    const queue = getSyncQueue().filter(q => !(q.type === type && q.key === key));
    queue.push({ type, key, ...entry });
    saveSyncQueue(queue);
}

function dequeue(type, key) {
    saveSyncQueue(getSyncQueue().filter(q => !(q.type === type && q.key === key)));
}

// Merges the two local homes for an item's state - the favorites array and
// the visited/note/rating cache - into the single row shape Supabase
// expects. Kept in one place so every save path (immediate or queued/
// retried) builds the payload identically.
function buildItemStatePayload(itemId) {
    const cached = getItemState(itemId);
    return {
        is_favorite: getFavorites().includes(itemId),
        is_visited: cached.is_visited,
        note: cached.note,
        rating: cached.rating
    };
}

// Called after storage.js has already applied a change locally. Tries to
// save it to Supabase right away; if that fails for any reason (offline,
// SDK unreachable, a transient Supabase error), the change is queued
// instead of lost, to retry on the next 'online' event or page load.
async function queueItemStateSync(itemId) {
    if (!navigator.onLine) {
        enqueue('item_state', itemId, { itemId });
        return;
    }
    try {
        await window.CorfuDB.upsertItemState(itemId, buildItemStatePayload(itemId));
        dequeue('item_state', itemId);
    } catch (e) {
        enqueue('item_state', itemId, { itemId });
    }
}

async function queueItineraryDaySync(dayNumber, completed) {
    if (!navigator.onLine) {
        enqueue('itinerary_day', dayNumber, { dayNumber, completed });
        return;
    }
    try {
        await window.CorfuDB.upsertItineraryDay(dayNumber, completed);
        dequeue('itinerary_day', dayNumber);
    } catch (e) {
        enqueue('itinerary_day', dayNumber, { dayNumber, completed });
    }
}

// Retries every queued write, in order, stopping at the first failure
// (still offline, or Supabase still unreachable) so the rest stay queued
// for the next attempt rather than firing a burst of doomed requests.
// Item-state entries re-read the CURRENT cache rather than trusting
// whatever was queued, in case the same item changed again since - the
// queue only needs to remember *which* items are dirty, not their values.
async function flushSyncQueue() {
    if (!navigator.onLine) return;
    for (const entry of getSyncQueue()) {
        try {
            if (entry.type === 'item_state') {
                await window.CorfuDB.upsertItemState(entry.itemId, buildItemStatePayload(entry.itemId));
            } else if (entry.type === 'itinerary_day') {
                await window.CorfuDB.upsertItineraryDay(entry.dayNumber, entry.completed);
            }
            dequeue(entry.type, entry.key);
        } catch (e) {
            break;
        }
    }
}

// "Automatically sync when back online": the browser tells us the instant
// connectivity returns, no polling needed.
window.addEventListener('online', flushSyncQueue);

// Also flush once shortly after load, in case the tab was closed and
// reopened while a queue was still pending from a previous offline session.
// Delayed slightly so it doesn't race ensureAuth() during first paint.
setTimeout(flushSyncQueue, 1500);

window.CorfuSync = { queueItemStateSync, queueItineraryDaySync, flushSyncQueue, getSyncQueue };

// ============================================================================
// database.js — Supabase SDK integration.
//
// This file's only job is talking to Supabase: initializing the client,
// bootstrapping anonymous auth, and running raw reads/writes against the
// two tables from supabase/schema.sql. It does not know about localStorage,
// offline queues, or which button the user clicked — that's storage.js
// (local cache) and sync.js (orchestration between the two), added in
// later steps.
//
// Depends on (must be loaded first): the Supabase SDK CDN script, then
// supabase-config.js (defines SUPABASE_URL / SUPABASE_ANON_KEY).
// ============================================================================

// Guarded rather than a bare `window.supabase.createClient(...)` call: if the
// CDN script above ever fails to load (ad-blocker, offline, CDN hiccup), this
// stays a clean `null` instead of throwing an uncaught error that could stop
// this file's execution partway through and leave window.CorfuDB half-built.
// Every function below checks for this and fails as a normal rejected
// promise instead, which storage.js/sync.js can catch like any other error.
const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Anonymous auth is bootstrapped lazily and only once: the first caller
// triggers it, every later caller (even concurrent ones) awaits the same
// promise instead of racing to sign in twice.
let authReadyPromise = null;

async function ensureAuth() {
    if (!supabaseClient) {
        throw new Error('Supabase client unavailable (SDK failed to load)');
    }
    if (!authReadyPromise) {
        authReadyPromise = (async () => {
            // Supabase persists the session in localStorage itself (separate
            // from this app's own storage.js cache), so a returning visitor
            // reuses the same anonymous identity instead of getting a new
            // user_id every visit.
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session?.user) {
                return session.user.id;
            }
            const { data, error } = await supabaseClient.auth.signInAnonymously();
            if (error) throw error;
            return data.user.id;
        })();
    }
    return authReadyPromise;
}

// --- user_item_state: favorites, visited, notes, ratings -------------------

// Fetches every item-state row for the current user in one call, so the
// caller (storage.js, in Step 6) can populate its local cache from a single
// round trip instead of one request per card.
async function fetchAllItemStates() {
    const userId = await ensureAuth();
    const { data, error } = await supabaseClient
        .from('user_item_state')
        .select('item_id, is_favorite, is_visited, note, rating, extra, updated_at')
        .eq('user_id', userId);
    if (error) throw error;
    return data;
}

// Partial upsert: pass only the fields that changed (e.g. { is_favorite: true }).
// Relies on the (user_id, item_id) unique constraint from the schema so this
// is always a single safe call, never a manual "insert or update?" check.
async function upsertItemState(itemId, partialState) {
    const userId = await ensureAuth();
    const { error } = await supabaseClient
        .from('user_item_state')
        .upsert(
            { user_id: userId, item_id: itemId, ...partialState },
            { onConflict: 'user_id,item_id' }
        );
    if (error) throw error;
}

// --- user_itinerary_progress: day-completion checkboxes ---------------------

async function fetchItineraryProgress() {
    const userId = await ensureAuth();
    const { data, error } = await supabaseClient
        .from('user_itinerary_progress')
        .select('day_number, completed, completed_at')
        .eq('user_id', userId);
    if (error) throw error;
    return data;
}

async function upsertItineraryDay(dayNumber, completed) {
    const userId = await ensureAuth();
    const { error } = await supabaseClient
        .from('user_itinerary_progress')
        .upsert(
            {
                user_id: userId,
                day_number: dayNumber,
                completed,
                completed_at: completed ? new Date().toISOString() : null
            },
            { onConflict: 'user_id,day_number' }
        );
    if (error) throw error;
}

// --- Anonymous-session upgrade (Step 1.2) -----------------------------
// Anonymous auth (Step 1's identity model) has one real downside: the
// account is scoped to this browser's local storage. Clear site data,
// switch devices, or lose the browser profile and every favorite/note/
// rating/itinerary-day is gone with it, since nothing else identifies
// "this user" to Supabase. Linking an email fixes that WITHOUT creating
// a new account or migrating data: Supabase keeps the exact same
// auth.uid() when an anonymous user links an identity, so every row
// already saved under this session stays exactly as it is - it just
// stops being tied to a single browser's storage.

// True only once confirmed against the live session - never assumed.
async function isAnonymousSession() {
    await ensureAuth(); // guarantees a session exists before checking it
    const { data: { session } } = await supabaseClient.auth.getSession();
    // Older supabase-js sessions may not carry is_anonymous at all; treat
    // that as "anonymous" too rather than silently hiding the banner for
    // users who'd actually benefit from it.
    return !!session && session.user.is_anonymous !== false;
}

// Sends a confirmation link to `email`. The account only actually
// upgrades once that link is clicked (Supabase's own safeguard against
// someone else claiming this session's data by guessing an email) - the
// caller's UI copy should reflect "sent", not "done".
async function upgradeSessionWithEmail(email) {
    await ensureAuth();
    const { error } = await supabaseClient.auth.updateUser({ email });
    if (error) throw error;
}

// Exposed as a single namespaced object rather than loose globals, so
// storage.js/sync.js (and the console, when debugging) have one clear
// entry point for every Supabase operation this app performs.
window.CorfuDB = {
    ensureAuth,
    fetchAllItemStates,
    upsertItemState,
    fetchItineraryProgress,
    upsertItineraryDay,
    isAnonymousSession,
    upgradeSessionWithEmail
};

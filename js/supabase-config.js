// ============================================================================
// Supabase configuration — fill these in after Step 4 of the setup guide
// (Supabase Dashboard → Settings → API).
//
// The anon/public key is SAFE to commit and ship to the browser: it has no
// special privileges by itself. Every table it can touch is locked down by
// the Row-Level Security policies in schema.sql, which only allow a request
// to read/write rows owned by that same request's authenticated user
// (auth.uid()). Never put the service_role key here or anywhere in frontend
// code — that key bypasses RLS entirely.
//
// WHILE THESE REMAIN PLACEHOLDERS, cloud sync is switched off entirely
// (SUPABASE_ENABLED below is false). That matters: previously the app would
// happily "queue" every favourite and note for a project ref that does not
// resolve, leaving the status dot stuck on "pending sync" forever and firing
// a doomed DNS lookup on every interaction. Off is honest; broken is not.
//
// Everything still works without it — favourites, notes, ratings and day
// progress are all persisted in localStorage. Supabase only adds sync
// ACROSS devices.
// ============================================================================

const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';

// The SDK is loaded on demand (see js/database.js) rather than from a <script>
// tag, so an unconfigured install downloads nothing at all.
const SUPABASE_SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0';
const SUPABASE_SDK_INTEGRITY = 'sha384-fPWur1rx/DE6YtXP/x0MD6dd90RgnVsz5yX/DIg7CcVAnTBZsENWuIcpvVTM39ti';

// True only once BOTH values above have been replaced with real ones.
const SUPABASE_ENABLED =
    typeof SUPABASE_URL === 'string' &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    !SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
    !SUPABASE_ANON_KEY.includes('YOUR-ANON-PUBLIC-KEY') &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(SUPABASE_URL.trim());

window.SUPABASE_ENABLED = SUPABASE_ENABLED;

// ============================================================================
// Supabase configuration — fill these in after Step 4 of the setup guide
// (Supabase Dashboard → Settings → API).
//
// The anon/public key below is SAFE to commit and ship to the browser: it
// has no special privileges by itself. Every table it can touch is locked
// down by the Row-Level Security policies in supabase/schema.sql, which only
// allow a request to read/write rows owned by that same request's
// authenticated user (auth.uid()). Never put the service_role key here or
// anywhere in frontend code — that key bypasses RLS entirely.
// ============================================================================

const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';

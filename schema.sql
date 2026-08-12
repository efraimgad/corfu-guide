-- ============================================================================
-- Corfu Guide — Supabase schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run.
--
-- Identity model: Supabase Anonymous Auth (see Step 4 for the config side).
-- Every row is owned by auth.uid() — no login screen, but still a real
-- authenticated user, so Row-Level Security below is genuine security,
-- not just a client-side convention.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Table 1: user_item_state
-- One row per (user, destination, item) — favorites, "visited", notes,
-- ratings, and a JSONB catch-all for future preferences. `item_id` reuses
-- the data-id string already on every card in the HTML (e.g.
-- "beach-רוביניה-Rovinia", "attr-26", "gem-1") — no new ID scheme to keep
-- in sync. `destination` (e.g. "corfu") keeps item_id collisions between
-- unrelated destinations from clobbering each other if this project is
-- ever pointed at more than one destination against the same Supabase
-- project.
-- ----------------------------------------------------------------------------
create table if not exists public.user_item_state (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    destination  text not null default 'corfu',
    item_id      text not null,
    is_favorite  boolean not null default false,
    is_visited   boolean not null default false,
    note         text,
    rating       smallint check (rating between 1 and 5),
    extra        jsonb not null default '{}'::jsonb,
    updated_at   timestamptz not null default now(),

    -- One row per item per user per destination — this is what lets the
    -- frontend use a single upsert() instead of "check if a row exists,
    -- then insert or update" every time something changes.
    unique (user_id, destination, item_id)
);

-- Every list/detail query the frontend makes is "give me all of this user's
-- item rows" — the unique constraint above already creates a composite
-- index starting with user_id, so it doubles as this lookup index too.
-- (No separate index needed.)


-- ----------------------------------------------------------------------------
-- Table 2: user_itinerary_progress
-- One row per (user, destination, day) — mirrors the existing data-day
-- attribute on .day-complete-checkbox exactly. Kept separate from Table 1
-- because it's keyed by day-number, not item-id. `day_number` is only
-- required to be positive (not capped at 7) since a destination's trip
-- length isn't guaranteed to be exactly 7 days; `destination` keeps two
-- different trips' day numbers (both often starting at 1) from colliding.
-- ----------------------------------------------------------------------------
create table if not exists public.user_itinerary_progress (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references auth.users(id) on delete cascade,
    destination    text not null default 'corfu',
    day_number     smallint not null check (day_number > 0),
    completed      boolean not null default false,
    completed_at   timestamptz,

    unique (user_id, destination, day_number)
);


-- ----------------------------------------------------------------------------
-- Keep updated_at accurate automatically, so the frontend never has to
-- remember to set it manually on every save (and can't forget to).
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_user_item_state_updated_at on public.user_item_state;
create trigger trg_user_item_state_updated_at
    before update on public.user_item_state
    for each row
    execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- Row-Level Security: every policy below reduces to the same rule —
-- you may only ever read or write rows where user_id = your own auth.uid().
-- Without this, the public anon key (which the frontend must embed) would
-- let any visitor read or edit any other visitor's data.
--
-- `destination` does NOT need to appear in any of these policies: they
-- already restrict every row to auth.uid() = user_id regardless of which
-- destination it belongs to, and a user is not a security boundary between
-- destinations here — they're just allowed to have state in more than one.
-- The only jobs `destination` does are (1) disambiguating item_id/day_number
-- collisions between destinations, handled entirely by the unique
-- constraints above, and (2) letting the frontend filter its own reads/
-- writes to the active destination via .eq('destination', ...), which is
-- an app-level concern, not a security one.
-- ----------------------------------------------------------------------------
alter table public.user_item_state enable row level security;
alter table public.user_itinerary_progress enable row level security;

create policy "select own item state"
    on public.user_item_state for select
    using (auth.uid() = user_id);

create policy "insert own item state"
    on public.user_item_state for insert
    with check (auth.uid() = user_id);

create policy "update own item state"
    on public.user_item_state for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "delete own item state"
    on public.user_item_state for delete
    using (auth.uid() = user_id);

create policy "select own itinerary progress"
    on public.user_itinerary_progress for select
    using (auth.uid() = user_id);

create policy "insert own itinerary progress"
    on public.user_itinerary_progress for insert
    with check (auth.uid() = user_id);

create policy "update own itinerary progress"
    on public.user_itinerary_progress for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "delete own itinerary progress"
    on public.user_itinerary_progress for delete
    using (auth.uid() = user_id);


-- ============================================================================
-- Migration for existing deployments (destination-scoping):
-- Run ONLY this section (not the file above) against a Supabase project
-- that already ran the original version of this script — i.e. one whose
-- user_item_state / user_itinerary_progress tables predate the
-- `destination` column and the destination-aware unique constraints added
-- above. Safe to run multiple times: every statement either targets an
-- object by its known original name (so a second run fails loudly instead
-- of silently double-applying) or is itself idempotent.
--
-- Existing rows backfill to destination = 'corfu' via the column default,
-- which is correct for every row written before this project supported
-- more than one destination.
-- ============================================================================

-- Table 1: user_item_state
alter table public.user_item_state
    add column if not exists destination text not null default 'corfu';

alter table public.user_item_state
    drop constraint if exists user_item_state_user_id_item_id_key;

alter table public.user_item_state
    add constraint user_item_state_user_id_destination_item_id_key
        unique (user_id, destination, item_id);

-- Table 2: user_itinerary_progress
alter table public.user_itinerary_progress
    add column if not exists destination text not null default 'corfu';

alter table public.user_itinerary_progress
    drop constraint if exists user_itinerary_progress_user_id_day_number_key;

alter table public.user_itinerary_progress
    add constraint user_itinerary_progress_user_id_destination_day_number_key
        unique (user_id, destination, day_number);

-- Loosen the old fixed 1–7 range: a destination's trip length is no longer
-- guaranteed to be exactly 7 days. Drops the original 1..7 check (named by
-- Postgres's default convention for an inline column check) and replaces
-- it with a lower-bound-only check.
alter table public.user_itinerary_progress
    drop constraint if exists user_itinerary_progress_day_number_check;

alter table public.user_itinerary_progress
    add constraint user_itinerary_progress_day_number_check
        check (day_number > 0);

-- No RLS policy changes needed here — see the note above the policies:
-- they are scoped by auth.uid() = user_id, which is unaffected by the
-- destination column.

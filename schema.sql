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
-- One row per (user, item) — favorites, "visited", notes, ratings, and a
-- JSONB catch-all for future preferences. `item_id` reuses the data-id
-- string already on every card in the HTML (e.g. "beach-רוביניה-Rovinia",
-- "attr-26", "gem-1") — no new ID scheme to keep in sync.
-- ----------------------------------------------------------------------------
create table if not exists public.user_item_state (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    item_id      text not null,
    is_favorite  boolean not null default false,
    is_visited   boolean not null default false,
    note         text,
    rating       smallint check (rating between 1 and 5),
    extra        jsonb not null default '{}'::jsonb,
    updated_at   timestamptz not null default now(),

    -- One row per item per user — this is what lets the frontend use a
    -- single upsert() instead of "check if a row exists, then insert or
    -- update" every time something changes.
    unique (user_id, item_id)
);

-- Every list/detail query the frontend makes is "give me all of this user's
-- item rows" — the unique constraint above already creates a composite
-- index starting with user_id, so it doubles as this lookup index too.
-- (No separate index needed.)


-- ----------------------------------------------------------------------------
-- Table 2: user_itinerary_progress
-- One row per (user, day 1–7) — mirrors the existing data-day attribute on
-- .day-complete-checkbox exactly. Kept separate from Table 1 because it's
-- keyed by day-number, not item-id.
-- ----------------------------------------------------------------------------
create table if not exists public.user_itinerary_progress (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references auth.users(id) on delete cascade,
    day_number     smallint not null check (day_number between 1 and 7),
    completed      boolean not null default false,
    completed_at   timestamptz,

    unique (user_id, day_number)
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

-- Initial schema for the Flashcards app.
-- Mirrors docs/07-database-design.md and ADR-0007/ADR-0008/ADR-0017 exactly —
-- this file is the executable source of truth; if it and the docs ever
-- disagree, that's a bug to fix (see docs/adr/README.md).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- App-specific data about a user, separate from auth.users (whose schema we
-- don't own). Populated automatically by a trigger on auth.users insert —
-- the application never creates this row directly.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select
  using (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Reused by every table below that has an updated_at column.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- decks
-- ---------------------------------------------------------------------------
-- Every deck represents one study language, constrained to the languages
-- the UI supports (ADR-0017) — not free text, despite the column name
-- suggesting otherwise historically.
--
-- user_id defaults to auth.uid() so application code never has to manage
-- ownership explicitly on insert; the RLS policy below is what actually
-- enforces it regardless of what a client sends.

create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  language text not null check (language in ('en', 'pt', 'ru', 'de', 'ja')),
  color text not null default '#3b82f6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index decks_user_id_idx on public.decks (user_id);

alter table public.decks enable row level security;

create trigger decks_set_updated_at
  before update on public.decks
  for each row execute function public.set_updated_at();

-- Decks have no parent to validate ownership against, so the cheap
-- denormalized check (used for every other table below) is the whole story
-- here: `using` governs what's visible/targetable, `with check` governs the
-- proposed new row on insert/update. See ADR-0008.
create policy "decks_owner_rw" on public.decks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- cards
-- ---------------------------------------------------------------------------
-- Content only (front/back + optional pronunciation/notes/example) — never
-- study state, which lives in card_study_state. See ADR-0007.

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  front text not null,
  back text not null,
  pronunciation text,
  notes text,
  example_sentence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cards_deck_id_idx on public.cards (deck_id);

-- RLS's `using` clause filters directly on user_id (see policy below), and
-- `cardsApi.countAll()` queries every card a user owns with no deck_id
-- filter at all — without this index that query (and the RLS check
-- evaluated on every other query) falls back to a full table scan.
create index cards_user_id_idx on public.cards (user_id);

alter table public.cards enable row level security;

create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

-- `using` is the cheap, denormalized check (no join) for reads/deletes.
-- `with check` additionally validates, on writes, that the denormalized
-- user_id actually matches the deck being written into — without this, a
-- client could insert a card into someone else's deck by simply claiming
-- its own user_id. See ADR-0008 for why this two-tier shape exists.
create policy "cards_owner_rw" on public.cards
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and user_id = (select user_id from public.decks where decks.id = deck_id)
  );

-- ---------------------------------------------------------------------------
-- card_study_state
-- ---------------------------------------------------------------------------
-- Per-card study stats driving the weighted-random card picker in
-- src/domain/study — one-to-one with cards. Deliberately not a spaced-
-- repetition schedule (no due date): every card is always a candidate, just
-- a more-or-less likely one. See ADR-0026 (supersedes ADR-0013/ADR-0023,
-- which committed to and tuned an SM-2 algorithm this table no longer backs).

create table public.card_study_state (
  card_id uuid primary key references public.cards (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  weight integer not null default 5 check (weight between 1 and 8),
  times_seen integer not null default 0,
  times_again integer not null default 0,
  times_good integer not null default 0,
  times_easy integer not null default 0,
  last_studied_at timestamptz
);

create index card_study_state_user_id_idx on public.card_study_state (user_id);

alter table public.card_study_state enable row level security;

create policy "card_study_state_owner_rw" on public.card_study_state
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and user_id = (select user_id from public.cards where cards.id = card_id)
  );

-- A card_study_state row is created automatically on every cards insert,
-- mirroring the handle_new_user trigger above — application code never
-- creates this row directly, so it can never drift out of sync with cards.
create function public.handle_new_card()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.card_study_state (card_id, user_id) values (new.id, new.user_id);
  return new;
end;
$$;

create trigger on_card_created
  after insert on public.cards
  for each row execute function public.handle_new_card();

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
-- scheduling state, which lives in card_review_state. See ADR-0007.

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
-- card_review_state
-- ---------------------------------------------------------------------------
-- Current spaced-repetition scheduling state, one-to-one with cards. Created
-- here per docs/07-database-design.md so the schema is complete ahead of the
-- study feature — no application code reads/writes this table yet (ADR-0013,
-- docs/13-roadmap.md Phase 1: the algorithm itself is not built).

create table public.card_review_state (
  card_id uuid primary key references public.cards (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  state text not null default 'new' check (state in ('new', 'learning', 'review', 'relearning')),
  due_at timestamptz not null default now(),
  interval_days real not null default 0,
  ease_factor real not null default 2.5,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  last_reviewed_at timestamptz
);

-- Composite, not due_at alone: the due-card query is always scoped to "this
-- user's due cards" (per-deck or the cross-deck view), never "due cards"
-- globally — see docs/07-database-design.md and ADR-0008.
create index card_review_state_user_due_idx on public.card_review_state (user_id, due_at);

alter table public.card_review_state enable row level security;

create policy "card_review_state_owner_rw" on public.card_review_state
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and user_id = (select user_id from public.cards where cards.id = card_id)
  );

-- ---------------------------------------------------------------------------
-- review_logs
-- ---------------------------------------------------------------------------
-- Append-only review history. Same "not used yet" note as card_review_state.

create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating text not null check (rating in ('again', 'good', 'easy')),
  reviewed_at timestamptz not null default now(),
  interval_before real,
  interval_after real
);

create index review_logs_card_id_idx on public.review_logs (card_id);
create index review_logs_user_reviewed_idx on public.review_logs (user_id, reviewed_at);

alter table public.review_logs enable row level security;

create policy "review_logs_owner_rw" on public.review_logs
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and user_id = (select user_id from public.cards where cards.id = card_id)
  );

-- ---------------------------------------------------------------------------
-- Migrate from SM-2 spaced-repetition to weighted-random study (ADR-0026)
-- ---------------------------------------------------------------------------
-- Context: the initial schema shipped card_review_state (SM-2 schedule) and
-- review_logs (append-only SM-2 history). ADR-0026 replaced that with a
-- simpler weighted-random picker: every card is always a candidate, a weight
-- (1–8) controls relative probability, and three counters track how often the
-- user rated each card Again/Good/Easy.
--
-- This migration:
--   1. Creates card_study_state with the new shape.
--   2. Seeds it from card_review_state, mapping SM-2 fields as described
--      below, so existing study history is not silently discarded.
--   3. Backfills any cards that had no card_review_state row with defaults.
--   4. Installs the handle_new_card trigger so future card inserts are
--      automatically covered.
--
-- card_review_state and review_logs are intentionally kept. They are no
-- longer read or written by the application but represent real historical
-- data that may be useful later (analytics, potential SM-2 revival, etc.).
--
-- SM-2 → weighted-random field mapping
-- ─────────────────────────────────────
-- weight       ← derived from ease_factor via linear scale:
--                  ease_factor 1.3 (floor) → weight 1
--                  ease_factor 2.5 (default, untouched card) → weight 5
--                  ease_factor 3.5 (ceiling in practice) → weight 8
--                  formula: round(1 + (ease_factor − 1.3) / 2.2 × 7), clamped 1–8
-- times_seen   ← repetitions (total successful reviews in SM-2)
-- times_again  ← lapses  (reviews rated 'again' from review/relearning state)
-- times_good   ← repetitions − lapses (remaining reviews were not lapses)
-- times_easy   ← 0  (SM-2 had no distinct 'easy' rating)
-- last_studied_at ← last_reviewed_at

-- ---------------------------------------------------------------------------
-- 1. Create card_study_state
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 2. Seed from card_review_state (preserves historical study data)
-- ---------------------------------------------------------------------------

insert into public.card_study_state (
  card_id,
  user_id,
  weight,
  times_seen,
  times_again,
  times_good,
  times_easy,
  last_studied_at
)
select
  crs.card_id,
  crs.user_id,
  -- Linear map from SM-2 ease_factor (practical range 1.3–3.5) to weight
  -- (1–8). ease_factor 2.5 (the untouched default) maps to weight 5 so that
  -- cards the user never studied start neutral, not biased. Clamp is a
  -- safety rail against edge-case ease_factor values outside the expected
  -- range (SM-2 allows > 3.5 after many 'easy' ratings).
  greatest(1, least(8,
    round((1.0 + (crs.ease_factor - 1.3) / 2.2 * 7.0)::numeric, 0)::integer
  )),
  crs.repetitions,
  crs.lapses,
  greatest(0, crs.repetitions - crs.lapses),
  0,
  crs.last_reviewed_at
from public.card_review_state crs;

-- ---------------------------------------------------------------------------
-- 3. Backfill cards that had no card_review_state row
-- ---------------------------------------------------------------------------
-- Should be zero rows in a healthy database, but guards against any cards
-- that were inserted before the trigger below is installed.

insert into public.card_study_state (card_id, user_id)
select c.id, c.user_id
from public.cards c
where not exists (
  select 1 from public.card_study_state css where css.card_id = c.id
);

-- ---------------------------------------------------------------------------
-- 4. Trigger: auto-create a card_study_state row on every future card insert
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_card()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.card_study_state (card_id, user_id)
  values (new.id, new.user_id);
  return new;
end;
$$;

create trigger on_card_created
  after insert on public.cards
  for each row execute function public.handle_new_card();

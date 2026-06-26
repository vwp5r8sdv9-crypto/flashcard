# Database Design

Postgres, managed by Supabase. Schema is maintained as versioned SQL migrations in `supabase/migrations/` (see [Folder Structure](06-folder-structure.md)).

## Entity overview

```
auth.users (managed by Supabase Auth)
      │ 1
      │
      ▼ 1
  profiles
      │ 1
      │
      ▼ N
   decks ────────────┐
      │ 1             │ (future: forked_from_deck_id)
      │               │
      ▼ N             ▼
   cards          (self-reference, deferred)
      │ 1
      ├──────────────┐
      ▼ 1            ▼ N
card_review_state  review_logs
```

- A user has many decks.
- A deck has many cards.
- A card has exactly one review-state record and many historical review-log entries.
- `cards`, `card_review_state`, and `review_logs` each also carry a **denormalized `user_id`**, in addition to their natural parent reference — see §Row Level Security below for why.

## Tables

### `profiles`
App-specific data about a user, separate from Supabase's own `auth.users` table (which we don't own the schema of).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK, references `auth.users(id)` | Same id as the auth user. |
| `display_name` | `text`, nullable | Shown in the UI; falls back to email if null. |
| `created_at` | `timestamptz`, default `now()` | |

Populated automatically by a Postgres trigger on `auth.users` insert (standard Supabase pattern) — the application never creates this row directly.

### `decks`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK, default `gen_random_uuid()` | |
| `user_id` | `uuid`, references `profiles(id)`, not null | Owner. |
| `name` | `text`, not null | |
| `description` | `text`, nullable | |
| `language` | `text`, nullable | Free-text tag (e.g. "Russian") — not an enum, since users study arbitrary subjects, not just languages (see [Product Vision](01-product-vision.md)). |
| `created_at` | `timestamptz`, default `now()` | |
| `updated_at` | `timestamptz`, default `now()` | Updated via trigger on row update. |

Index: `decks(user_id)`.

### `cards`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK, default `gen_random_uuid()` | |
| `deck_id` | `uuid`, references `decks(id)` on delete cascade, not null | |
| `user_id` | `uuid`, references `profiles(id)`, not null | Denormalized from the parent deck's owner — see §Row Level Security. |
| `front` | `text`, not null | |
| `back` | `text`, not null | |
| `notes` | `text`, nullable | Optional hint/mnemonic — see [MVP Scope](03-mvp-scope.md). |
| `created_at` | `timestamptz`, default `now()` | |
| `updated_at` | `timestamptz`, default `now()` | |

Index: `cards(deck_id)` (also speeds up the cascade delete when a deck is removed).

**Decision:** `front`/`back`/`notes` are plain `text`, not JSON/rich-text, for the MVP.
**Why:** Matches the MVP scope (plain-text cards); rich content (images/audio/formatting) is an explicit fast-follow (see [Roadmap](13-roadmap.md)) and would change this to a structured format — deferring it avoids designing for a feature that isn't built yet.

### `card_review_state`

Holds the *current* spaced-repetition scheduling state for a card — kept in its own table rather than as columns on `cards`.

| Column | Type | Notes |
|---|---|---|
| `card_id` | `uuid` PK, references `cards(id)` on delete cascade | One-to-one with `cards`. |
| `user_id` | `uuid`, references `profiles(id)`, not null | Denormalized — see §Row Level Security. |
| `state` | `text`, not null, default `'new'` | Constrained via `check (state in ('new','learning','review','relearning'))` — see note below. |
| `due_at` | `timestamptz`, not null, default `now()` | When the card next becomes eligible for study. |
| `interval_days` | `real`, not null, default `0` | Current scheduling interval. |
| `ease_factor` | `real`, not null, default `2.5` | SM-2-style ease multiplier. |
| `repetitions` | `integer`, not null, default `0` | Consecutive successful reviews. |
| `lapses` | `integer`, not null, default `0` | Times the card was rated "Again" after leaving the `new` state. |
| `last_reviewed_at` | `timestamptz`, nullable | |

Index: **composite `card_review_state(user_id, due_at)`**. The study session's core query — for both a single deck and the cross-deck "study all due" view (see [User Flows](08-user-flows.md) §4) — is "give me this user's cards where `due_at <= now()`." A composite index on `(user_id, due_at)` answers that directly with no join to `cards`/`decks`, and scales as both the user base and per-user card counts grow. (A `due_at`-only index doesn't help here — it can't be used to filter by owner — see §Row Level Security for why `user_id` is denormalized onto this table at all.)

**Decision:** Scheduling state is a separate table from `cards`, not extra columns on `cards`.
**Why:** Keeps `cards` purely about *content* (what import/export cares about) and `card_review_state` purely about *scheduling progress*. This separation means export/import logic doesn't need to special-case scheduling columns, and a future "reset my progress on this deck" feature is a delete on one table, not a selective column reset on another.
**Note on the algorithm itself:** the exact constants and transition rules (how much `ease_factor` changes on "Again" vs "Easy", how `interval_days` is computed) are an SM-2-family algorithm and are an implementation detail of the `domain/srs` module (see [Architecture](04-architecture.md)) finalized when the study module is actually built — not decided in this document, since this is a design doc, not an implementation.
**Note on `state`/`rating` as `text` + `check`, not a native Postgres `enum`:** both this column and `review_logs.rating` (below) use `text` with a `check` constraint listing valid values, rather than a Postgres `enum` type. A `check` constraint is altered with an ordinary migration (`alter table ... drop constraint ..., add constraint ...`); native enum types require a separate, more awkward catalog change (`alter type ... add value`). Since this list of states/ratings may plausibly grow (e.g. a future "suspended" state), the more easily extensible option was chosen deliberately.

### `review_logs`

Append-only history of every rating a user has given a card. Not used by the scheduling algorithm itself (which only needs current state), but kept from day one because:
- it's the only way to ever build stats/insights ([Roadmap](13-roadmap.md) Phase 3) without having thrown the data away,
- it's useful for debugging/tuning the algorithm later,
- append-only tables carry essentially no design risk to add now vs. later, unlike a column you might need to remove.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK, default `gen_random_uuid()` | |
| `card_id` | `uuid`, references `cards(id)` on delete cascade, not null | |
| `user_id` | `uuid`, references `profiles(id)`, not null | Denormalized — see §Row Level Security. |
| `rating` | `text`, not null | Constrained via `check (rating in ('again','good','easy'))`. |
| `reviewed_at` | `timestamptz`, not null, default `now()` | |
| `interval_before` | `real`, nullable | Interval prior to this review. |
| `interval_after` | `real`, nullable | Interval resulting from this review. |

Indexes: `review_logs(card_id)` (cascade-delete performance) and `review_logs(user_id, reviewed_at)` (anticipates the Phase 3 stats queries in [Roadmap](13-roadmap.md) — "show my study activity over time" is exactly this access pattern).

**Scalability note:** this table is append-only and has no delete path other than cascading from its card — it grows forever. That's an accepted tradeoff at MVP scale (see [Goals](02-goals.md) §Non-goals — not designing for premature scale). If it ever becomes large enough to matter operationally, the standard fix (time-based partitioning or archiving old rows) is additive and doesn't require changing anything upstream of this table.

## Row Level Security

RLS is enabled on every table. Authorization is enforced at the database, not just in application code (see [Architecture](04-architecture.md) §Security model).

**Decision:** `cards`, `card_review_state`, and `review_logs` each carry a denormalized `user_id`, in addition to their natural parent reference (`deck_id` / `card_id`). Every table's RLS policy checks this direct column rather than joining up to `decks` on every query.
**Why:** The most frequent query in the whole app is "find this user's due cards" (every study session — see [User Flows](08-user-flows.md) §4). Without a direct `user_id` column, that query — and the RLS check evaluated on every row — would need to join `card_review_state → cards → decks` just to know who owns a row. Denormalizing the owner id turns that into a single indexed equality check, and is what makes the composite index above possible. It also makes the global "study every due card across all decks" view (in MVP scope — see [MVP Scope](03-mvp-scope.md)) a plain single-table query instead of a three-table join.
**Risk this introduces, and how it's handled:** a denormalized column can drift from the truth if something is allowed to write it incorrectly. Two things prevent that here: (1) there is no feature that ever reassigns who owns a card or its review state — these rows are created once by their owner and never transferred, so there's no update path that could cause drift; (2) every table's policy still validates the denormalized `user_id` against its authoritative parent **on write** (in `with check`), so Postgres rejects an insert/update that tries to attach a row to a parent it doesn't actually own — a client cannot insert a card into someone else's deck merely by claiming its own `user_id`. Reads pay only the cheap direct check; writes pay one cheap subquery to guarantee integrity. This is the standard safe pattern for this kind of denormalization: cheap reads, validated writes.

Policy for `decks` (the one table with no parent to validate against):

```sql
create policy "decks_owner_rw" on decks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Policy for `cards` — the `with check` clause validates the denormalized `user_id` against the deck the card is actually being attached to, not just against the caller's own id:

```sql
create policy "cards_owner_rw" on cards
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and user_id = (select user_id from decks where decks.id = deck_id)
  );
```

Policy for `card_review_state` and `review_logs` — identical shape, validated against `cards.user_id`. Because that column is itself already guaranteed correct by the policy above, this only needs to check one level up, not all the way to `decks`:

```sql
create policy "card_review_state_owner_rw" on card_review_state
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and user_id = (select user_id from cards where cards.id = card_id)
  );

create policy "review_logs_owner_rw" on review_logs
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and user_id = (select user_id from cards where cards.id = card_id)
  );
```

**Why this matters:** even if a future bug in frontend code forgot to filter by user, Postgres refuses to return or modify another user's rows — and, per the integrity check above, refuses to let a user attach a row to a parent they don't own. This is the actual security boundary, not a nicety on top of one.

## Future extensibility (not built now, but designed for)

These are explicitly *not* part of the MVP schema, called out here only so today's design doesn't accidentally make them harder later (see [Roadmap](13-roadmap.md)):

- **Community sharing:** adding `decks.is_public boolean default false` and `decks.forked_from_deck_id uuid references decks(id)` later is additive — no existing column changes meaning.
- **Rich media:** would likely mean `cards.front`/`back` becoming structured (JSON blocks) or adding a separate `card_attachments` table referencing Supabase Storage — deferred until the feature is actually scoped.
- **Native clients:** the schema has no web-specific assumptions, so a future mobile client reads/writes the same tables with no changes needed.

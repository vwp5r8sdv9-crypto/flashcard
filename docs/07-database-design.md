# Database Design

Postgres, managed by Supabase. Schema is maintained as versioned SQL migrations in `supabase/migrations/` (see [Folder Structure](06-folder-structure.md)) — `supabase/migrations/20260627234219_init_schema.sql` is the executable implementation of everything in this document; if the two ever disagree, the migration is what actually runs, and the doc needs fixing (see ADR-0020).

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
      ▼ 1
card_study_state
```

- A user has many decks.
- A deck has many cards.
- A card has exactly one study-state record.
- `cards` and `card_study_state` each also carry a **denormalized `user_id`**, in addition to their natural parent reference — see §Row Level Security below for why.

## Tables

### `profiles`

App-specific data about a user, separate from Supabase's own `auth.users` table (which we don't own the schema of).

| Column         | Type                                   | Notes                                         |
| -------------- | -------------------------------------- | --------------------------------------------- |
| `id`           | `uuid` PK, references `auth.users(id)` | Same id as the auth user.                     |
| `display_name` | `text`, nullable                       | Shown in the UI; falls back to email if null. |
| `created_at`   | `timestamptz`, default `now()`         |                                               |

Populated automatically by a Postgres trigger on `auth.users` insert (standard Supabase pattern) — the application never creates this row directly.

### `decks`

| Column        | Type                                        | Notes                                                                                                                                                                 |
| ------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `uuid` PK, default `gen_random_uuid()`      |                                                                                                                                                                       |
| `user_id`     | `uuid`, references `profiles(id)`, not null | Owner.                                                                                                                                                                |
| `name`        | `text`, not null                            |                                                                                                                                                                       |
| `description` | `text`, nullable                            |                                                                                                                                                                       |
| `language`    | `text`, not null                            | Constrained to the supported language codes (`en`/`pt`/`ru`/`de`/`ja`) via `check`, not free text — see ADR-0017 for why this reverses the original free-text design. |
| `color`       | `text`, not null, default `'#3b82f6'`       | Hex color for visual identification in the deck grid — added when deck management was built; see [User Flows](08-user-flows.md) §2.                                   |
| `created_at`  | `timestamptz`, default `now()`              |                                                                                                                                                                       |
| `updated_at`  | `timestamptz`, default `now()`              | Updated via trigger on row update.                                                                                                                                    |

Index: `decks(user_id)`.

### `cards`

| Column             | Type                                                       | Notes                                                                |
| ------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `id`               | `uuid` PK, default `gen_random_uuid()`                     |                                                                      |
| `deck_id`          | `uuid`, references `decks(id)` on delete cascade, not null |                                                                      |
| `user_id`          | `uuid`, references `profiles(id)`, not null                | Denormalized from the parent deck's owner — see §Row Level Security. |
| `front`            | `text`, not null                                           | Original word or sentence.                                           |
| `back`             | `text`, not null                                           | Translation.                                                         |
| `pronunciation`    | `text`, nullable                                           | Optional — added alongside the Cards feature build.                  |
| `notes`            | `text`, nullable                                           | Optional hint/mnemonic — see [MVP Scope](03-mvp-scope.md).           |
| `example_sentence` | `text`, nullable                                           | Optional — added alongside the Cards feature build.                  |
| `created_at`       | `timestamptz`, default `now()`                             |                                                                      |
| `updated_at`       | `timestamptz`, default `now()`                             |                                                                      |

Indexes: `cards(deck_id)` (also speeds up the cascade delete when a deck is removed) and `cards(user_id)` (the RLS policy below filters directly on `user_id`, and `cardsApi.countAll()` queries every card a user owns with no `deck_id` filter at all — without this index, that query and the RLS check on every other query fall back to a full table scan).

**Decision:** `front`/`back`/`notes` are plain `text`, not JSON/rich-text, for the MVP.
**Why:** Matches the MVP scope (plain-text cards); rich content (images/audio/formatting) is an explicit fast-follow (see [Roadmap](13-roadmap.md)) and would change this to a structured format — deferring it avoids designing for a feature that isn't built yet.

### `card_study_state`

Holds the _current_ study stats for a card — kept in its own table rather than as columns on `cards`. Deliberately not a spaced-repetition schedule: there's no due date, every card is always a candidate to study, just a more-or-less likely one. See ADR-0026 (supersedes ADR-0013/ADR-0023, which committed to and tuned an SM-2 algorithm this table no longer backs).

| Column            | Type                                                | Notes                                                                                                                                    |
| ----------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `card_id`         | `uuid` PK, references `cards(id)` on delete cascade | One-to-one with `cards`.                                                                                                                 |
| `user_id`         | `uuid`, references `profiles(id)`, not null         | Denormalized — see §Row Level Security.                                                                                                  |
| `weight`          | `integer`, not null, default `5`                    | Constrained via `check (weight between 1 and 8)` — higher means more likely to be picked next; see ADR-0026 for the selection algorithm. |
| `times_seen`      | `integer`, not null, default `0`                    |                                                                                                                                          |
| `times_again`     | `integer`, not null, default `0`                    |                                                                                                                                          |
| `times_good`      | `integer`, not null, default `0`                    |                                                                                                                                          |
| `times_easy`      | `integer`, not null, default `0`                    |                                                                                                                                          |
| `last_studied_at` | `timestamptz`, nullable                             |                                                                                                                                          |

Index: `card_study_state(user_id)`. Unlike the due-date scheduling table this replaces, the study session's core query is "give me every card this user owns in scope" with no time-range filter at all — the weighted-random pick happens client-side over that full set (see [Architecture](04-architecture.md) and ADR-0026), so a plain owner index is enough.

**Decision:** Study state is a separate table from `cards`, not extra columns on `cards`.
**Why:** Keeps `cards` purely about _content_ (what import/export cares about) and `card_study_state` purely about _study progress_. This separation means export/import logic doesn't need to special-case study columns, and a future "reset my progress on this deck" feature is a delete on one table, not a selective column reset on another.
**Note on the algorithm itself:** the exact weight deltas and clamp bounds are implemented as pure functions in `src/domain/study/getNextCard.ts` and `src/domain/study/applyRating.ts` (see [Architecture](04-architecture.md)) — finalized in ADR-0026, not decided in this document, since this is a design doc, not an implementation.

**Note on row creation:** every `cards` insert automatically gets a matching `card_study_state` row via a database trigger (`handle_new_card`, mirroring `handle_new_user` above), not application code — see `supabase/migrations/20260627234219_init_schema.sql` and ADR-0026.

## Row Level Security

RLS is enabled on every table. Authorization is enforced at the database, not just in application code (see [Architecture](04-architecture.md) §Security model).

**Decision:** `cards` and `card_study_state` each carry a denormalized `user_id`, in addition to their natural parent reference (`deck_id` / `card_id`). Every table's RLS policy checks this direct column rather than joining up to `decks` on every query.
**Why:** The most frequent query in the whole app is "find this user's cards in scope" (every study session — see [User Flows](08-user-flows.md) §4). Without a direct `user_id` column, that query — and the RLS check evaluated on every row — would need to join `card_study_state → cards → decks` just to know who owns a row. Denormalizing the owner id turns that into a single indexed equality check. It also makes the global "study everything across all decks" view (in MVP scope — see [MVP Scope](03-mvp-scope.md)) a plain single-table query instead of a three-table join.
**Risk this introduces, and how it's handled:** a denormalized column can drift from the truth if something is allowed to write it incorrectly. Two things prevent that here: (1) there is no feature that ever reassigns who owns a card or its study state — these rows are created once by their owner and never transferred, so there's no update path that could cause drift; (2) every table's policy still validates the denormalized `user_id` against its authoritative parent **on write** (in `with check`), so Postgres rejects an insert/update that tries to attach a row to a parent it doesn't actually own — a client cannot insert a card into someone else's deck merely by claiming its own `user_id`. Reads pay only the cheap direct check; writes pay one cheap subquery to guarantee integrity. This is the standard safe pattern for this kind of denormalization: cheap reads, validated writes.

**Implementation detail (added when the migration was written, see ADR-0020):** every `user_id` column is declared `default auth.uid()`, so application code never sets it explicitly on insert — the repository (`decksApi`/`cardsApi`) only ever sends content columns, and the database fills in the owner. This doesn't weaken the integrity check above: `with check` still validates the resulting value against the row's actual parent, it's just that the value being validated is now supplied by a column default instead of a client-sent field.

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

Policy for `card_study_state` — validated against `cards.user_id`. Because that column is itself already guaranteed correct by the policy above, this only needs to check one level up, not all the way to `decks`:

```sql
create policy "card_study_state_owner_rw" on card_study_state
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and user_id = (select user_id from cards where cards.id = card_id)
  );
```

**Why this matters:** even if a future bug in frontend code forgot to filter by user, Postgres refuses to return or modify another user's rows — and, per the integrity check above, refuses to let a user attach a row to a parent they don't own. This is the actual security boundary, not a nicety on top of one.

## Future extensibility (not built now, but designed for)

These are explicitly _not_ part of the MVP schema, called out here only so today's design doesn't accidentally make them harder later (see [Roadmap](13-roadmap.md)):

- **Community sharing:** adding `decks.is_public boolean default false` and `decks.forked_from_deck_id uuid references decks(id)` later is additive — no existing column changes meaning.
- **Rich media:** would likely mean `cards.front`/`back` becoming structured (JSON blocks) or adding a separate `card_attachments` table referencing Supabase Storage — deferred until the feature is actually scoped.
- **Native clients:** the schema has no web-specific assumptions, so a future mobile client reads/writes the same tables with no changes needed.

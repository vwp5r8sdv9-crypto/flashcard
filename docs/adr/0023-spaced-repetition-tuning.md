# 0023. Spaced Repetition Tuning: Constants, Transition Table, and Review-State Row Lifecycle

**Status:** Accepted
**Date:** 2026-06-28
**Related:** docs/07-database-design.md §card_review_state, docs/04-architecture.md §Domain layer, ADR-0013, ADR-0007, ADR-0008

## Context

ADR-0013 committed to a simplified, three-button (Again/Good/Easy) SM-2-family algorithm but explicitly deferred "the exact constants and transition rules" to when the study module was actually built. That module is now being built, and two concrete questions need answers before `src/domain/srs` can have a real implementation: what the algorithm actually does on each rating, and how a `card_review_state` row ever comes to exist for a card in the first place (no application code has touched that table since it was created — ADR-0020/the initial migration).

## Problem

1. What are the precise ease/interval transitions for Again/Good/Easy, for a card in each phase (`new`/`learning`/`review`/`relearning`)?
2. Who creates a card's `card_review_state` row, and when?

## Alternatives Considered

- **Minute-granular learning steps** (Anki-style, e.g. 10 minutes → 1 day → graduate) — more faithful to Anki's actual behavior, but reintroduces same-day scheduling, timezone edge cases, and a notion of "minutes until due" the rest of the app (day-granular `interval_days: real`) doesn't otherwise need. Rejected in favor of staying day-granular throughout, which is simpler to reason about and test — consistent with the product's "cleaner and simpler than Anki" goal.
- **Creating `card_review_state` lazily from application code** (e.g. in `cardsApi.create`, or on first fetch of a due-queue) — works, but means every code path that can create a card must remember to also create this row, and a missed call silently leaves a card unstudiable with no error. Rejected for the same reason `profiles` rows are trigger-created, not app-created (ADR-0020): a single, un-skippable DB-level guarantee beats an application-level convention.
- **A Postgres function (RPC) for `submitReview`**, wrapping the `card_review_state` update and `review_logs` insert in one transaction — more correct (atomic), but the codebase's stated bias (ADR-0006) is PostgREST CRUD with Edge Functions/RPCs reserved for genuine exceptions. A rare partial failure here (schedule updated, log insert fails) only affects future Phase-3 stats, never the live session, so two sequential writes from `studyApi` were judged not to meet that bar. Revisit if stats work in Phase 3 turns out to need stronger guarantees.

## Decision

We will implement `scheduleReview(state, rating, now)` in `src/domain/srs/scheduleReview.ts` as a pure function with the following transition table:

| Rating | New state                                                                     | Repetitions  | Ease factor            | Interval (days)                                           |
| ------ | ----------------------------------------------------------------------------- | ------------ | ---------------------- | --------------------------------------------------------- |
| Again  | `learning` (was `new`/`learning`) or `relearning` (was `review`/`relearning`) | reset to `0` | `max(1.3, ease − 0.2)` | `1`                                                       |
| Good   | `review`                                                                      | `+1`         | unchanged              | rep₀=0 → `1`, rep₀=1 → `3`, else `round(interval × ease)` |
| Easy   | `review`                                                                      | `+1`         | `+0.15`                | rep₀<2 → `4`, else `round(interval × ease × 1.3)`         |

(`rep₀` = repetitions _before_ this review.) `lapses` increments only when failing out of `review`/`relearning` (a "new"/"learning" card rated Again is not yet a lapse — it hasn't graduated once).

A `card_review_state` row is created automatically by a Postgres trigger (`handle_new_card`, mirroring the existing `handle_new_user` pattern) on every `cards` insert, with a one-time backfill for any pre-existing cards — see `supabase/migrations/20260628202438_card_review_state_trigger.sql`. Application code never creates this row directly, the same way it never creates `profiles` rows directly.

`studyApi.submitReview` persists a rating as two sequential writes (update `card_review_state`, then insert into `review_logs`), not a single transaction/RPC.

## Consequences

**Positive:**

- The transition table is a closed-form, fully unit-tested pure function (`src/domain/srs/scheduleReview.test.ts`) with no hidden state or I/O.
- The trigger makes "every card has exactly one review-state row" a database-enforced invariant, not a convention every card-creation code path has to remember.
- Day-granular intervals keep the model simple and match the schema's existing `real` (fractional-day-capable, but unused for sub-day precision) `interval_days` column without changes.

**Negative / risks:**

- These constants are a reasonable, standard SM-2 starting point, not validated against real user retention data (none exists yet) — expect to revisit once Phase 3 (`review_logs`-backed stats) gives real signal on whether intervals feel right.
- The two-write, non-transactional `submitReview` has a narrow window where a schedule update could succeed without its log entry. Acceptable today because nothing reads `review_logs` yet; would need revisiting before Phase 3 ships if log completeness turns out to matter for the stats it produces.

# 0026. Study Algorithm: Weighted-Random Selection with Recency Avoidance, Not Spaced Repetition

**Status:** Accepted
**Date:** 2026-06-29
**Related:** docs/07-database-design.md §card_study_state, docs/04-architecture.md §Domain layer, ADR-0004, ADR-0007
**Supersedes:** ADR-0013, ADR-0023

## Context

ADR-0013 committed to a simplified SM-2-family algorithm, and ADR-0023 finalized its constants and the `card_review_state` row lifecycle. Both are implemented and shipped. The product direction has since changed: rather than a due-date-driven spaced-repetition system, the goal for this first version of the Study experience is a calm, continuous, Kindle-like session with no due dates, no progress pressure, and no statistics during study — explicitly **not** an Anki clone, and explicitly not SM-2/FSRS/Leitner yet. That's a different algorithm family, not a tuning change, so it needs its own decision record rather than an edit to either superseded ADR (which, once Accepted, are not rewritten — see docs/adr/README.md).

## Problem

How does the study session decide which card to show next, with no due dates and no "session end," in a way that (a) still favors cards the user struggles with, (b) doesn't feel repetitive, and (c) can be swapped for a real spaced-repetition algorithm later without rebuilding the Study UI?

## Alternatives Considered

- **Keep due-date scheduling (SM-2), just hide the dates from the UI** — would still require a "due" concept gating which cards are even candidates, directly conflicting with "the session never ends automatically" and "study until you leave." Rejected: the UI ask isn't cosmetic, it's a different session model.
- **Pure random selection, no weighting** — simplest possible, but gives no signal that struggling with a card should make it reappear more. Rejected: "difficult cards should appear more often" is an explicit goal.
- **FSRS or another modern data-derived scheduler** — the eventual likely upgrade path, but needs a volume of review history to tune that doesn't exist yet, and is real complexity the "build an enjoyable experience first" framing explicitly defers.

## Decision

We will implement card selection as a pure, framework-agnostic function `getNextCard(cards, recentlyStudiedIds)` in `src/domain/study/getNextCard.ts`:

- Each card carries a `weight` (integer, clamped `1`–`8`, default `5`) instead of a due date.
- Rating a card adjusts its own weight only — `again: +2`, `good: -1`, `easy: -2` — and increments `timesSeen` plus the matching `timesAgain`/`timesGood`/`timesEasy` counter, via a second pure function, `applyRating(state, rating, now)` in `src/domain/study/applyRating.ts`.
- The next card is chosen by weighted-random selection over the candidate pool (probability proportional to weight), after excluding the most recently studied cards to avoid repetitiveness. The exclusion window scales with pool size so small decks don't run out of candidates: `8+ cards` → avoid the last `5`; `5–7` → avoid the last `3`; `2–4` → avoid the last `1` (which also guarantees no immediate repeat); `1 card` → no exclusion, repeats are allowed since there's nothing else to show.
- Persistence: `card_study_state` (one row per card, trigger-created on every `cards` insert exactly like the table it replaces) holds `weight`/`times_seen`/`times_again`/`times_good`/`times_easy`/`last_studied_at`. There is no equivalent of `review_logs` in this version — nothing reads per-event history yet, and the aggregated counters already cover what the Study UI and this algorithm need. A future stats feature can add an event log against the new schema if and when it's actually built, rather than carrying one forward speculatively.
- The Study UI (`StudySession`, `Flashcard`) only ever calls `getNextCard`/`applyRating` and renders whatever card comes back — it has no due-date or session-end logic. Swapping in FSRS/SM-2/Leitner later means replacing these two functions and the `card_study_state` columns they read/write, not rebuilding the UI — the same domain/UI separation ADR-0004 and ADR-0007 already established.

## Consequences

**Positive:**

- Matches the "calm, continuous, no statistics" product direction directly — there's no due/empty-queue state to design around, only "has cards" vs. "doesn't."
- Both algorithm functions are pure, deterministic (given a seeded `Math.random`), and fully unit-tested in isolation, same testability story as the SM-2 function they replace.
- The schema stays in the same shape ADR-0007 established (study progress in its own table, separate from card content), so that separation of concerns survives the algorithm change unchanged.

**Negative / risks:**

- This is not spaced repetition. A card the user finds easy can still resurface sooner than an SRS algorithm would schedule it, and there's no actual "this card is due" signal for a future reminder/notification feature to hook into. Accepted deliberately for this version; revisit if real usage shows users want scheduling guarantees back.
- Dropping `review_logs` means no per-event history exists from day one this time, unlike the table it replaces. If a future stats feature (docs/13-roadmap.md Phase 3) needs event-level granularity rather than the aggregated counters, that's a new table and a new migration, not a column already sitting there waiting to be read.
- The exact weight deltas (`+2`/`-1`/`-2`) and clamp bounds (`1`–`8`) are reasonable starting constants, not validated against real usage — same caveat ADR-0023 carried for its SM-2 constants, now inherited by this decision instead.

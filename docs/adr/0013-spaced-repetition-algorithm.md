# 0013. Spaced Repetition Algorithm: Simplified SM-2 Family, Three-Button Rating

**Status:** Superseded by [ADR-0026](0026-weighted-random-study-algorithm.md)
**Date:** 2026-06-27
**Related:** docs/07-database-design.md §card_review_state, docs/04-architecture.md §Domain layer, ADR-0004, ADR-0007

## Context

The product's core value proposition is trustworthy, low-friction spaced repetition (docs/01-product-vision.md) — specifically with exactly three rating buttons (Again/Good/Easy), not Anki's four (Again/Hard/Good/Easy) or a fully custom scheme.

## Problem

What scheduling algorithm determines when a card comes due again, and how many rating options does the user need?

## Alternatives Considered

- **Leitner system** (box-based: a card moves up a box on success, back to box one on failure) — simple to implement and explain, but coarser-grained than SM-2-style interval calculation and less able to adapt interval length to how easy an individual card actually is for a given user.
- **Full Anki-style SM-2 with four ratings (Again/Hard/Good/Easy)** — proven and battle-tested, but a fourth button reintroduces exactly the configuration/complexity surface the product vision positions against (docs/01-product-vision.md §What makes this different); most users don't reliably distinguish "Hard" from "Good" in the moment.
- **FSRS (Free Spaced Repetition Scheduler) or another modern, data-derived algorithm** — potentially more accurate at scale, but far harder to reason about, test, and explain than a closed-form SM-2-style formula, and needs a volume of review data to tune that an MVP doesn't have yet.

## Decision

We will implement a simplified, three-button (Again/Good/Easy) SM-2-family scheduling algorithm as a pure, framework-agnostic function in `src/domain/srs` (ADR-0004), backed by the `state`/`interval_days`/`ease_factor`/`repetitions`/`lapses` columns already in the schema (ADR-0007). The exact constants and transition rules are an implementation detail finalized when the study module is built (docs/13-roadmap.md Phase 1), not decided in this record.

## Consequences

**Positive:**

- Matches the product's "no configuration, no setup" promise directly.
- A pure function is fully unit-testable in isolation and portable to a future non-web client without rewriting it.
- The database schema already supports it without changes.

**Negative / risks:**

- Three buttons carry less granularity than Anki's four. If user feedback later shows real demand for a distinct "hard but I got it" signal, that should be a deliberate new decision, not a hidden fourth state patched in.
- Tuning the exact ease/interval constants well (so the schedule actually feels right) is real, non-trivial work deferred to Phase 1 — this ADR commits to the algorithm family, not the tuning.

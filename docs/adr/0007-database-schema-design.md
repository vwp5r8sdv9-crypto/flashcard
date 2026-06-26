# 0007. Database Schema Design: Decks, Cards, Review State, Review Logs

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/07-database-design.md, ADR-0002

## Context

The product's core entities are users, decks, cards, and each card's spaced-repetition scheduling progress (docs/01-product-vision.md, docs/03-mvp-scope.md).

## Problem

How should these entities be modeled as tables, and should scheduling state live alongside card content or separately from it?

## Alternatives Considered

- **A single `cards` table with scheduling columns (`due_at`, `ease_factor`, etc.) mixed in with content (`front`, `back`)** — simpler at first glance, but couples two concerns with very different lifecycles: content changes rarely and is what import/export cares about, while scheduling state changes on every review and is irrelevant to "what are the cards." A future "reset my progress on this deck" feature would also mean selectively resetting some columns instead of deleting a row.
- **Storing review history inline** (e.g. a JSON array column on each card) instead of a separate append-only table — cheaper to add initially, but unqueryable at the SQL level and would need to be parsed application-side for any future stats feature (docs/13-roadmap.md Phase 3).

## Decision

We will model the schema as four tables: `profiles`, `decks`, `cards` (content only), `card_review_state` (current scheduling state, one-to-one with `cards`), and `review_logs` (append-only history, one-to-many). `review_logs` is collected from day one even though nothing reads it until the Phase 3 stats feature.

## Consequences

**Positive:**
- Import/export logic never needs to special-case scheduling columns.
- Resetting a card's progress is a delete on one table, not a selective column reset.
- `review_logs` existing from day one means the future stats feature requires no data migration — just a new reader.

**Negative / risks:**
- One additional table and a one-to-one join (`cards` ↔ `card_review_state`) versus a flatter design — judged worth it for the separation above.
- `review_logs` grows unbounded with no delete path; accepted for MVP scale (docs/07-database-design.md §Scalability note). Revisit only if it becomes an actual operational issue — partitioning/archival is additive and doesn't require changing anything upstream.

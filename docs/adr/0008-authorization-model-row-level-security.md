# 0008. Authorization Model: Row-Level Security with Denormalized Ownership

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/07-database-design.md §Row Level Security, docs/04-architecture.md §Security model, ADR-0007

## Context

Every table needs to guarantee a user can only see or modify their own data, and the most frequent query in the app — the due-card queue — needs to run efficiently as both the user base and per-user card counts grow.

## Problem

How is authorization enforced, and how is "who owns this row" kept both correct and fast across `decks → cards → card_review_state → review_logs`?

## Alternatives Considered

- **Application-level authorization only** (check ownership in repository code before every query) — relies on every code path remembering to filter correctly; a single missed check leaks data. Rejected as the sole mechanism.
- **RLS with ownership derived purely via joins** (`cards` checked through `decks`, `card_review_state` checked through `cards → decks`, etc.) — correct, but every read and every RLS check pays for a multi-table join, and the due-card query can't be served by a simple index.
- **RLS with a denormalized `user_id` on every table, checked only against the caller's own id** — fast, but naively implemented this lets a user insert a row claiming their own `user_id` while attaching it to a parent (e.g. a deck) they don't actually own, silently corrupting another user's data. Identified and rejected during the post-foundation architecture review.

## Decision

We will enforce authorization entirely via Postgres Row-Level Security. `cards`, `card_review_state`, and `review_logs` each carry a denormalized `user_id` for fast, join-free reads (`using auth.uid() = user_id`). Every write is additionally validated by a `with check` clause that confirms the denormalized `user_id` matches the row's actual parent (`decks` for `cards`; `cards` for `card_review_state`/`review_logs`), not just the caller's own id.

## Consequences

**Positive:**
- A bug in frontend code cannot leak another user's data — Postgres refuses the query regardless of what the application does or doesn't filter.
- The due-card query — including the cross-deck "study all due" view — runs as a single indexed lookup (`card_review_state(user_id, due_at)`), not a multi-table join.
- Ownership spoofing across parents is rejected at write time by the database, not just assumed correct by convention.

**Negative / risks:**
- Denormalization always raises a drift risk. Mitigated here because no feature ever reassigns ownership of a card or review-state row once created, and the write-time integrity check makes drift structurally impossible rather than merely unlikely.

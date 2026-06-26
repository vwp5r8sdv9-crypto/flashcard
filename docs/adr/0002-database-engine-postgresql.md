# 0002. Database Engine: PostgreSQL over NoSQL Alternatives

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/07-database-design.md, ADR-0001

## Context

The application's data is inherently relational: a user owns decks, a deck contains cards, and each card has exactly one current scheduling state plus many historical review-log entries (docs/07-database-design.md).

## Problem

Which database engine and data model should back the application?

## Alternatives Considered

- **Firestore (document store)** — flexible schema, but the deck/card/review-state relationships and the need for relational integrity (foreign keys, cascading deletes, future joins for community/forking) are exactly what a document model handles worse, pushing relational logic into application code instead.
- **MongoDB (self-hosted or Atlas)** — the same document-model mismatch as Firestore, and choosing it would also mean abandoning Supabase's integrated Auth/RLS/API stack (ADR-0001), re-building authorization in application code.
- **MySQL** — relational and viable in principle, but Supabase is Postgres-native; choosing MySQL would mean a different backend platform entirely, reopening ADR-0001 for no corresponding benefit.

## Decision

We will use PostgreSQL, as provided by Supabase.

## Consequences

**Positive:**
- Real relational integrity (foreign keys, cascading deletes) matches the actual shape of the data.
- Row-Level Security is a first-class Postgres feature and the backbone of the authorization model (ADR-0008).
- Mature, well-documented, and supports the composite indexing the due-card scheduling query needs as data grows.

**Negative / risks:**
- Less schema flexibility than a document store if card content needs ever become highly heterogeneous. Not a concern for the MVP's plain-text cards; revisit only if/when rich media (docs/07-database-design.md §Future Extensibility) is actually built.

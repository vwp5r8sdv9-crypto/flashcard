# 0010. Synchronization Strategy: Online-First, Cloud as Source of Truth

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/11-synchronization.md

## Context

The product needs to be usable across multiple devices (docs/03-mvp-scope.md §Cloud availability), and the MVP should not pay the engineering cost of true offline support before the core loop is validated (docs/02-goals.md).

## Problem

How does data get from one device to another, and what happens when a device has no network connection?

## Alternatives Considered

- **Local-first architecture** (a local IndexedDB/SQLite store as the primary read/write target, syncing to the cloud in the background, usable fully offline) — arguably the better long-term fit for a study app used on commutes or flights, but requires conflict resolution logic, a mutation queue, and meaningfully more code to get right before the core loop is even proven.

## Decision

We will build online-first for the MVP. Every device reads and writes directly to Supabase Postgres; "multi-device sync" is a direct consequence of a centralized database, not a built subsystem. TanStack Query caching (ADR-0005) is a UX-latency optimization on top of this, not an offline mechanism, and the app explicitly surfaces an "offline" state rather than failing silently when there's no connection.

## Consequences

**Positive:**
- Dramatically simpler to build and reason about — no conflict resolution, no mutation queue.
- Multi-device access comes "for free," satisfying the cloud-sync requirement without a distinct sync subsystem.

**Negative / risks:**
- The app does not work offline for the MVP — an explicit, accepted tradeoff, not an oversight.
- Conflict handling for the rare simultaneous-edit case is last-write-wins via `updated_at`; acceptable for a single-user personal tool, revisit only if it becomes an observed problem.
- A documented migration path exists (docs/11-synchronization.md §Migration path) if offline studying is later validated as a real need, contained mostly to the data-access layer (ADR-0004) rather than requiring a rewrite.

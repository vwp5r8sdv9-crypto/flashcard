# 0015. Interim Persistence: localStorage Repository Before Supabase Integration

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/09-api-design.md, docs/13-roadmap.md, ADR-0001, ADR-0004

## Context

Authentication has been deliberately postponed to focus on the application's core functionality first (deck management). The UI needs a working, demoable persistence layer now, without wiring a real Supabase project — which would require auth (for `auth.uid()`-scoped RLS) before anything could even be reviewed.

## Problem

How should deck data be persisted while Supabase integration is deliberately deferred, without that deferral later forcing a UI rewrite once Supabase is wired up?

## Alternatives Considered

- **An in-memory mock with no real persistence** — fast to build, but data vanishing on every refresh makes the feature unreviewable as a real flow, and doesn't exercise the repository contract the way actually persisting data does.
- **Wire Supabase now, ahead of auth** — contradicts the explicit decision to postpone authentication, and would require a real project, RLS policies that need a real `auth.uid()`, and schema migrations before any UI could be reviewed.

## Decision

We will implement `decksApi` (`src/features/decks/api/decksApi.ts`) as a `localStorage`-backed repository satisfying a `DecksRepository` interface (`list`/`getById`/`create`/`update`/`remove`), all returning `Promise`s to match the eventual async Supabase calls. No other code in the app touches `localStorage` directly. When Supabase integration is built, only this file's internals change — see ADR-0004's repository pattern.

## Consequences

**Positive:**

- The decks feature is fully functional and reviewable today, with real (if local) persistence across reloads.
- The swap to Supabase later touches one file, not the UI, hooks, or components.

**Negative / risks:**

- Data is per-browser and lost on cache clear; there is no multi-device sync at this stage (expected — see ADR-0010 for the real sync model once Supabase lands).
- No RLS/authorization enforcement yet, since auth itself is postponed — acceptable for this interim step, not acceptable as a permanent state.

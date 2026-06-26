# 0005. State Management: TanStack Query, No Global Client Store

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/04-architecture.md, docs/05-tech-stack.md

## Context

Nearly all state in this application is data that lives in Postgres (decks, cards, review state) rather than client-only UI state.

## Problem

How should application state — particularly server-derived data — be managed on the frontend?

## Alternatives Considered

- **A global client-state store (Redux / Zustand / Jotai)** — would duplicate caching, de-duplication, and invalidation logic that a dedicated server-state library already provides, adding a second source of truth for no corresponding benefit here.
- **Hand-rolled fetching in `useEffect` with local component state** — no caching, no request de-duplication, no consistent invalidation strategy; would be reinvented per feature, inconsistently.

## Decision

We will use TanStack Query as the sole mechanism for server state (caching, de-duplication, invalidation on mutation, refetch-on-focus), and plain component-local React state for everything else. No global client-state library is introduced for the MVP.

## Consequences

**Positive:**
- One consistent caching/invalidation model across every feature.
- Less code overall than either hand-rolling the same behavior or running two state systems in parallel.

**Negative / risks:**
- If a genuine cross-feature, client-only state need emerges later (e.g. a multi-step wizard spanning routes) that doesn't fit local component state, this decision should be revisited deliberately rather than worked around with prop-drilling (see docs/04-architecture.md §State management).

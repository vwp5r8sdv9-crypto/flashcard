# 0004. Layered Frontend Architecture & Repository Pattern

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/04-architecture.md, docs/06-folder-structure.md, docs/12-coding-standards.md

## Context

The codebase will grow one feature at a time (decks, cards, study, import/export), and the spaced-repetition algorithm in particular needs to stay testable in isolation and portable to a possible future non-web client (docs/02-goals.md, docs/13-roadmap.md).

## Problem

How should responsibilities be divided inside the frontend so business logic, UI, and backend access don't become entangled as the app grows?

## Alternatives Considered

- **No enforced layering** (call Supabase directly from components as needed) — fastest to write initially, but scatters business logic across components in a way that's hard to test and impossible to reuse on a future client.
- **Strict technical layering** (top-level `components/`, `hooks/`, `services/` folders, each holding files for every feature) — common, but makes every feature change touch several distant folders, and doesn't on its own separate pure business logic from data access.

## Decision

We will organize the frontend into four layers with a strict dependency direction — UI → Feature → (Domain and Data-access as siblings) — and route all backend access through repository functions confined to `features/*/api/`. Domain code (e.g. the spaced-repetition algorithm) will have zero React or Supabase imports.

## Consequences

**Positive:**
- The spaced-repetition algorithm is unit-testable in isolation and portable to a future non-web client without rewriting it.
- Backend access has exactly one seam — if Supabase is ever replaced, only the data-access layer changes, not the UI or domain logic.
- Enforceable via ESLint import-boundary rules (docs/12-coding-standards.md), not left to convention or code review alone.

**Negative / risks:**
- Adds a small amount of indirection (a repository wrapper, a pure domain function called from a hook) even for simple operations — judged worth it for testability and future portability.

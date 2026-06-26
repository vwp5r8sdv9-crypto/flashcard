# 0014. Code Organization: Feature-Based Folder Structure

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/06-folder-structure.md, ADR-0004

## Context

The codebase will grow by adding features (decks, cards, study, import/export) one module at a time (docs/13-roadmap.md).

## Problem

Should code be organized primarily by technical role (components/hooks/services) or by business feature?

## Alternatives Considered

- **Technical-role-first** (`components/`, `hooks/`, `services/` at the top level, each containing files for every feature) — common, but means working on one feature touches three or more distant folders, and finding "everything about decks" means searching the whole tree.

## Decision

We will organize `src/features/` by business feature (`auth`, `decks`, `cards`, `study`, `import-export`), each owning its own components, hooks, and API/repository functions, separate from the framework-agnostic `domain/` layer (ADR-0004) and any genuinely shared UI in `src/components`.

## Consequences

**Positive:**
- Understanding or deleting a feature means opening or removing one folder.
- Scales by adding folders as features grow, not by growing a handful of top-level technical folders indefinitely.

**Negative / risks:**
- Genuinely shared UI or logic needs a deliberate promotion step (to `src/components` or `src/domain`) rather than just living wherever was convenient — a minor discipline cost, enforced via code review and the import-boundary lint rules in docs/12-coding-standards.md.

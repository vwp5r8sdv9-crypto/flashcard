# Architecture Decision Records

This folder is the project's decision log. Where `/docs/*.md` describes the system as it currently stands, this folder records **the moment each major decision was made**: what problem it solved, what else was considered, and why the alternatives lost.

## Why keep these separately from `/docs`

The numbered documents in `/docs` (product vision, architecture, database design, etc.) are **living references** — they describe the current design and get updated as the system evolves. An ADR is the opposite on purpose: it's a **dated, historical record** of a decision and the reasoning available at the time. If a decision is later reversed, the old ADR is not rewritten — a new ADR is added that supersedes it, and the old one is marked accordingly. This means:

- You can always answer "why does it work this way?" by reading the ADR, even years later, even if the system has since changed.
- You can see *that* something changed and *when*, instead of a living doc silently reflecting only the current state with no trace of what came before.

If an ADR and a living `/docs` page ever disagree about what's currently true, **the living doc wins** for "what's true now" — but check whether the ADR was actually superseded; if not, that disagreement is a bug to fix (either the doc drifted, or a new ADR is missing).

## Conventions

- **Numbering:** sequential, four digits, never reused (`0001`, `0002`, …). Numbers are permanent — a superseded ADR keeps its number.
- **Filenames:** `NNNN-short-kebab-case-title.md`.
- **Status** is one of:
  - `Proposed` — written, not yet agreed.
  - `Accepted` — the current, in-force decision.
  - `Superseded by ADR-NNNN` — no longer in force; see the linked ADR for what replaced it.
  - `Deprecated` — no longer in force, with no direct replacement (the problem itself went away).
- **Immutability:** once an ADR is `Accepted`, its Context/Problem/Alternatives/Decision/Consequences are not edited to reflect a changed mind — typos and formatting fixes are fine, substance changes are not. A changed decision gets a new ADR.
- Every ADR follows the same five sections, in this order: **Context, Problem, Alternatives Considered, Decision, Consequences**. Use [template.md](template.md) to start a new one.

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-backend-platform-supabase.md) | Backend Platform: Managed BaaS (Supabase) over a Custom Server | Accepted |
| [0002](0002-database-engine-postgresql.md) | Database Engine: PostgreSQL over NoSQL Alternatives | Accepted |
| [0003](0003-frontend-framework-react-typescript-vite.md) | Frontend Framework & Core Libraries: React + TypeScript + Vite | Accepted |
| [0004](0004-layered-frontend-architecture-and-repository-pattern.md) | Layered Frontend Architecture & Repository Pattern | Accepted |
| [0005](0005-state-management-tanstack-query.md) | State Management: TanStack Query, No Global Client Store | Accepted |
| [0006](0006-api-strategy-postgrest-and-edge-functions.md) | API Strategy: PostgREST CRUD + Edge Functions for Exceptions | Accepted |
| [0007](0007-database-schema-design.md) | Database Schema Design: Decks, Cards, Review State, Review Logs | Accepted |
| [0008](0008-authorization-model-row-level-security.md) | Authorization Model: Row-Level Security with Denormalized Ownership | Accepted |
| [0009](0009-authentication-strategy-supabase-auth.md) | Authentication Strategy: Supabase Auth (Email/Password, JWT) | Accepted |
| [0010](0010-synchronization-strategy-online-first.md) | Synchronization Strategy: Online-First, Cloud as Source of Truth | Accepted |
| [0011](0011-hosting-platform-vercel.md) | Hosting Platform: Vercel | Accepted |
| [0012](0012-import-export-strategy.md) | Import/Export Strategy: Client Preview, Server-Authoritative Commit | Accepted |
| [0013](0013-spaced-repetition-algorithm.md) | Spaced Repetition Algorithm: Simplified SM-2 Family, Three-Button Rating | Accepted |
| [0014](0014-feature-based-folder-structure.md) | Code Organization: Feature-Based Folder Structure | Accepted |

All fourteen were accepted together on 2026-06-27, as part of writing the project's foundation before any application code existed (see `/docs/13-roadmap.md` Phase 0). Future decisions — including any reversal of one of these — get their own new ADR, numbered `0015` onward.

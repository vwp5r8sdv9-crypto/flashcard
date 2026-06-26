# 0006. API Strategy: PostgREST CRUD + Edge Functions for Exceptions

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/09-api-design.md, ADR-0001

## Context

Supabase auto-generates a REST API over Postgres via PostgREST (ADR-0001), so the project doesn't start from zero on API surface the way a custom backend would.

## Problem

Should the project build a hand-written API (REST or GraphQL), and how should the few operations that don't fit plain ownership-scoped CRUD be handled?

## Alternatives Considered

- **A hand-written REST API** — would require the custom backend already rejected in ADR-0001.
- **GraphQL** — more flexible query shapes, but this app's access patterns are simple CRUD plus a couple of filtered list queries; GraphQL would add a schema layer to maintain without a corresponding flexibility need.

## Decision

We will use Supabase's auto-generated PostgREST API for all standard CRUD, and add a Supabase Edge Function only when an operation genuinely can't be expressed as ownership-scoped CRUD under Row-Level Security (ADR-0008) — needing server-side validation, multi-row transactionality, or elevated privileges. The only Edge Function planned for the MVP is `import-deck` (ADR-0012).

## Consequences

**Positive:**
- Minimal moving parts — no API code to write for the common case, and every Edge Function added is a deliberate, reviewable choice rather than a default.
- Row-Level Security does the authorization work a hand-written API would otherwise need custom middleware for.

**Negative / risks:**
- Operations that don't map cleanly to single-table CRUD need an Edge Function — a separate deployable unit with its own runtime (Deno) — a real, if small, increase in operational surface versus pure CRUD.

# 0012. Import/Export Strategy: Client Preview, Server-Authoritative Commit

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/08-user-flows.md §7, docs/09-api-design.md §One validation schema not two, ADR-0006

## Context

Users need to get decks into and out of the app without losing data or trapping it in a proprietary format (docs/01-product-vision.md, docs/03-mvp-scope.md).

## Problem

Where should an imported file be parsed and validated, and how is the actual database write performed safely?

## Alternatives Considered

- **Parse and write entirely client-side** (many sequential inserts from the browser) — simplest to write, but a failure partway through leaves a half-imported deck, with no single place enforcing "this whole import succeeds or none of it does."
- **Parse and validate entirely server-side, with no client-side preview** — safe, but forces the user to wait on a round trip just to see what's about to be imported, which is poor UX for an app whose product goal is to feel instant (docs/02-goals.md).
- **Conditionally choose client-side or server-side parsing based on file size** — considered and rejected during the post-foundation architecture review: it left an undefined size threshold and meant the same operation behaved two different ways depending on input.

## Decision

We will always parse client-side for an instant preview, and always commit via the `import-deck` Supabase Edge Function (ADR-0006), which re-validates and performs the insert as a single transaction — regardless of file size. Both sides validate against one shared Zod schema (`src/domain/importExport/`), so "what counts as a valid import file" is defined exactly once.

## Consequences

**Positive:**
- Instant preview feedback without waiting on a network round trip.
- The actual write is always transactional and re-validated server-side — a client-side bug or a malicious direct API call can't partially corrupt a deck.
- One schema, not two hand-maintained parsers that could drift apart.

**Negative / risks:**
- Requires confirming, during initial repo scaffolding, that a Deno Edge Function can import the same TypeScript module the Vite frontend uses — flagged as a Phase 0 spike, not assumed to just work (docs/09-api-design.md).

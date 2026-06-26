# 0009. Authentication Strategy: Supabase Auth (Email/Password, JWT)

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/10-authentication.md, ADR-0008

## Context

Users need accounts so their decks are private and follow them across devices (docs/03-mvp-scope.md).

## Problem

What authentication mechanism should the MVP use, and how does it integrate with the authorization model (ADR-0008)?

## Alternatives Considered

- **A custom auth service** — significant work (password hashing, token issuance/refresh, reset/verification flows) to re-derive what Supabase Auth already provides as part of the chosen backend (ADR-0001).
- **OAuth-only from day one (Google, etc.)** — lower friction for users who already have those accounts, but adds external provider setup before the core loop is even validated, and isn't necessary to prove the product.
- **Magic links / passwordless sign-in** — a reasonable future option, not necessary for MVP validation.

## Decision

We will use Supabase Auth with email/password for the MVP, issuing standard JWTs that Row-Level Security policies validate via `auth.uid()` (ADR-0008). `supabase-js` handles token storage and refresh; the app implements none of its own.

## Consequences

**Positive:**
- No separate auth service to build or operate; integrates directly with RLS.
- Password reset and email verification are Supabase Auth built-ins, not custom code.
- OAuth, MFA, and magic links remain additive (configuration, not architecture) if added later.

**Negative / risks:**
- Each device holds its own session independently — signing out on one device does not sign out another. This is documented as expected JWT behavior, not a gap (docs/10-authentication.md).
- No "active sessions" management UI in the MVP; a reasonable low-priority gap to close later if users ask for it.

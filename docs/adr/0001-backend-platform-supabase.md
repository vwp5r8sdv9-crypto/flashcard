# 0001. Backend Platform: Managed BaaS (Supabase) over a Custom Server

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/04-architecture.md, docs/05-tech-stack.md

## Context

The MVP needs authentication, a database, and an API surface for a single web client, built and operated by a small team (effectively solo) for whom low operational overhead is an explicit goal (docs/02-goals.md).

## Problem

Where should the backend infrastructure — auth, data storage, API, authorization — live: a custom server we build and run ourselves, or a managed platform?

## Alternatives Considered

- **Custom Node.js/NestJS API in front of Postgres** — full control over every endpoint and zero vendor coupling, but requires building and operating auth, CRUD endpoints, migration tooling, and infrastructure hosting from scratch, all to re-derive functionality a managed platform already provides.
- **Firebase (Firestore + Firebase Auth)** — comparable managed convenience, but Firestore's document model is a weaker fit for the deck → card → review-state relational structure (see ADR-0002), and would still need custom Cloud Functions for anything Postgres Row-Level Security gives declaratively.
- **AWS Amplify** — similarly managed, but heavier AWS-ecosystem lock-in and more setup than this project's size justifies.

## Decision

We will use Supabase (managed Postgres + Auth + Storage + Edge Functions + an auto-generated CRUD API) as the entire backend for the MVP. No custom server is built.

## Consequences

**Positive:**
- No auth service, API server, or infrastructure to build or operate ourselves.
- Row-Level Security gives a real, database-enforced authorization boundary "for free" (ADR-0008).
- A free tier sufficient for MVP scale, with a predictable cost profile while the product is validated.

**Negative / risks:**
- Some coupling to Supabase's specific APIs and conventions.
- Mitigated by the repository pattern (ADR-0004): only the data-access layer would need to change if the backend were ever migrated away from Supabase.
- Less granular control than a custom server over exactly what the API surface looks like; addressed case by case with Edge Functions (ADR-0006) when plain CRUD isn't enough.

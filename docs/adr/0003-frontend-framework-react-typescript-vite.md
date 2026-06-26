# 0003. Frontend Framework & Core Libraries: React + TypeScript + Vite

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/05-tech-stack.md

## Context

The MVP targets a single responsive web app, installable as a PWA, built by a team with existing React/TypeScript experience.

## Problem

What frontend framework and core tooling should the application be built on?

## Alternatives Considered

- **Vue / Svelte / Angular** — all viable frameworks, but none match the team's existing skillset, which would cost build speed for no compensating architectural benefit on a project this size.
- **Next.js (or another SSR meta-framework)** — provides server rendering and file-based routing, but this app has no SEO or server-rendering requirement (it sits entirely behind a login), so SSR's added complexity has nothing to earn its keep against.
- **Create React App / a hand-assembled Webpack setup** — superseded tooling; slower dev server and more configuration than Vite for an equivalent result.

## Decision

We will build the frontend as a Vite-bundled React + TypeScript single-page application, with React Router for routing, TanStack Query for server state (ADR-0005), Tailwind CSS and shadcn/ui (Radix primitives) for UI, React Hook Form for forms, Zod for runtime validation, and vite-plugin-pwa for PWA support.

## Consequences

**Positive:**
- Matches existing skillset — fastest path to a working MVP.
- Vite's dev server and TypeScript-first tooling keep iteration fast.
- Each supporting library (Tailwind, shadcn, RHF) is individually replaceable and none are deeply load-bearing in business logic.

**Negative / risks:**
- No server-rendering — if a public, SEO-relevant marketing surface is ever needed, it's likely a separate small project rather than a retrofit of this SPA.
- A fairly opinionated set of libraries is locked in together; acceptable since none of them touch the domain layer (ADR-0004), which remains framework-agnostic regardless.

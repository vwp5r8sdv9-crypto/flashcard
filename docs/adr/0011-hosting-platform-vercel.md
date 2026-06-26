# 0011. Hosting Platform: Vercel

**Status:** Accepted
**Date:** 2026-06-27
**Related:** docs/05-tech-stack.md, ADR-0001, ADR-0003

## Context

The frontend is a static/PWA single-page application (ADR-0003) with no custom backend to host (ADR-0001).

## Problem

Where does the built frontend get deployed and served?

## Alternatives Considered

- **Netlify** — a comparable git-integrated static host with similar free-tier deploys and PR preview environments. Not a wrong choice — not selected simply so the decision is settled rather than left open.
- **Self-hosted (a VM or container)** — adds operational burden (server management, TLS, a deploy pipeline) this app's needs don't justify, directly against the low-operational-overhead goal (docs/02-goals.md).

## Decision

We will host the frontend on Vercel.

## Consequences

**Positive:**
- No server to manage; deploys are a git push.
- Automatic preview deployments per pull request support the review-before-merge workflow (docs/12-coding-standards.md).

**Negative / risks:**
- Minor vendor coupling to Vercel's deployment conventions; low-cost to change later since no application code references the hosting platform directly.

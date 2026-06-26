# Flashcards — Foundation Documentation

This folder is the architectural foundation of the project, written and agreed upon **before any application code is written**. Every document explains not just *what* was decided but *why*, so the reasoning can be revisited as the product grows.

## How to read this

Read in order — each document builds on the assumptions of the previous one:

1. [Product Vision](01-product-vision.md) — why this app exists and for whom
2. [Goals](02-goals.md) — what "success" means, product and technical
3. [MVP Scope](03-mvp-scope.md) — exactly what is and isn't built first
4. [Architecture](04-architecture.md) — how the system is structured and why
5. [Technology Stack](05-tech-stack.md) — every tool/library choice, justified
6. [Folder Structure](06-folder-structure.md) — how code will be organized
7. [Database Design](07-database-design.md) — schema, relationships, security
8. [User Flows](08-user-flows.md) — step-by-step walkthroughs of core journeys
9. [API Design](09-api-design.md) — how the frontend talks to the backend
10. [Authentication Strategy](10-authentication.md)
11. [Synchronization Strategy](11-synchronization.md)
12. [Coding Standards](12-coding-standards.md)
13. [Roadmap](13-roadmap.md)

## Decision log

Every major architectural decision — what was chosen, what else was considered, and why — is recorded as an Architecture Decision Record in [adr/](adr/README.md). The numbered documents above describe the system as it currently stands; the ADR log is the historical trail of *why* it stands that way. Start at [adr/README.md](adr/README.md) for the index and the conventions used.

## Foundational decisions locked in for this version

These were decided up front because they shape every other document. They can be revisited later, but changing them after the foundation is built is expensive — so they're called out explicitly here:

| Decision | Choice | Doc |
|---|---|---|
| Platform (MVP) | Web app, installable as a PWA | [05](05-tech-stack.md), [13](13-roadmap.md) |
| Backend | Supabase (managed Postgres + Auth + Storage + Edge Functions) | [04](04-architecture.md), [05](05-tech-stack.md) |
| Sync model | Online-first; the cloud database is the single source of truth | [11](11-synchronization.md) |
| Frontend stack | React + TypeScript | [05](05-tech-stack.md) |

## Process

We are building this **one module at a time**, foundation first. Nothing in `/docs` is final — review it, push back on anything that doesn't fit your goals, and we'll revise before any code is written. Once a document is approved, it becomes the reference we build against; if reality later forces a deviation, we update the doc, not just the code.

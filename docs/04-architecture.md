# Architecture

## High-level shape

```
┌──────────────────────────────────────────────┐
│                Browser (PWA)                  │
│                                                │
│  React + TypeScript SPA                       │
│   UI layer → Feature layer → Domain layer     │
│                     ↓                         │
│            Data-access layer                  │
│        (repositories, all Supabase calls)     │
└───────────────────┬────────────────────────────┘
                     │  HTTPS (supabase-js)
                     ▼
┌──────────────────────────────────────────────┐
│                   Supabase                    │
│  ┌───────────┐ ┌────────┐ ┌────────────────┐ │
│  │  Postgres │ │  Auth  │ │ Edge Functions │ │
│  │  + RLS    │ │ (JWT)  │ │ (Deno/TS)      │ │
│  └───────────┘ └────────┘ └────────────────┘ │
│  ┌───────────┐                                │
│  │  Storage  │ (future: card media)           │
│  └───────────┘                                │
└──────────────────────────────────────────────┘
```

There is **no custom backend server** for the MVP. The frontend talks to Supabase directly via its auto-generated PostgREST API, wrapped behind a thin repository layer (see below). Custom server-side logic that can't live in the client (bulk import validation, anything needing elevated privileges) is implemented as Supabase Edge Functions rather than a standalone server.

**Decision:** No custom backend (Node/Nest/etc.) for the MVP.
**Why:** Supabase's combination of managed Postgres, Row Level Security, auto-generated CRUD APIs, and Edge Functions covers everything the MVP needs without us building and operating auth, an API server, and infrastructure ourselves. That's a direct match for the "low operational overhead" and "maintainable by a small team" goals in [Goals](02-goals.md).
**Alternatives considered:** A custom Node.js/NestJS API in front of Postgres would give full control over every endpoint and zero vendor coupling, at the cost of building auth, CRUD endpoints, migrations tooling, and hosting/ops by hand — all to re-derive what Supabase already provides.
**Tradeoffs accepted:** Some coupling to Supabase's APIs and conventions. This is mitigated by the data-access layer below — if we ever need to leave Supabase, the _rest_ of the app doesn't need to change, only the repository implementations.

## Layering inside the frontend

The frontend is organized into four layers with a strict dependency direction (each layer may only depend on the ones below it):

```
UI layer              (pages/routes, components)
        ↓ uses
Feature layer         (feature-specific hooks, composition)
        ↓ uses                      ↓ uses
Domain layer                Data-access layer
(pure business logic —      (repositories — the only
 no React, no Supabase)      code that imports supabase-js)
```

Domain and data-access are **siblings**, not a chain — neither depends on the other. A feature hook (e.g. `useSubmitReview`) calls _both_: the domain layer to compute the new schedule, and the data-access layer to persist it. Domain code never imports Supabase, and the data-access layer never imports domain logic — keeping the pure scheduling math fully decoupled from how (or whether) it's ever persisted.

### UI layer

Pages, routes, and components. Renders state, captures user input, calls feature hooks. Contains no business rules and no direct data-fetching calls.

### Feature layer

One module per business feature (`decks`, `cards`, `study`, `auth`, `import-export`). Each feature exposes hooks (e.g. `useDecks()`, `useCreateDeck()`) built on TanStack Query, composing the domain and data-access layers for that feature. This is where "what does the Decks screen need" lives.

### Domain layer

Pure, framework-agnostic TypeScript: the study card-selection algorithm, deck/card validation rules, anything that's a business rule rather than a UI or storage concern.

**Decision:** The study algorithm is isolated in `src/domain/study`, with zero imports from React or Supabase.
**Why:** This is the single most important piece of business logic in the product (see [Product Vision](01-product-vision.md)) — it deserves to be unit-tested in isolation, and it needs to be portable to a future native mobile client without rewriting it. Burying selection logic inside a React component or a database trigger would make it hard to test and impossible to reuse. It's also what keeps the algorithm itself swappable (weighted-random today, possibly FSRS/SM-2/Leitner later — see ADR-0026) without rebuilding the UI around it.
**Tradeoff:** A small amount of indirection (a pure function being called from a hook) compared to inlining the logic — worth it for testability alone.

### Data-access layer

Repository functions (`decksApi.list()`, `cardsApi.create()`, …) are the _only_ place `supabase-js` is imported, outside of the client initialization itself. UI and feature code never call Supabase directly.

**Decision:** All Supabase access goes through repository functions, never called directly from components.
**Why:** Centralizes error handling and response shaping in one place; makes data access mockable in tests without a real Supabase connection; and gives a single seam to change if the backend ever changes (see [API Design](09-api-design.md)).
**Tradeoff:** A small amount of boilerplate (a wrapper function per operation) in exchange for that seam — acceptable given how cheap it is to write.

## State management

- **Server state** (decks, cards, review state — anything that lives in Postgres) is owned by TanStack Query: caching, request de-duplication, invalidation on mutation, refetch-on-focus.
- **Local UI state** (form inputs, modal open/closed, "which card is currently shown") is plain React state, kept close to the component that needs it.

**Decision:** No global client-state library (Redux, Zustand, etc.) for the MVP.
**Why:** Nearly all state in this app _is_ server state. A global store would duplicate what TanStack Query already does well, adding complexity with no real benefit — directly against the "no unnecessary complexity" principle in the product brief.
**Revisit if:** A real cross-feature client-only state need emerges (e.g. a multi-step import wizard spanning routes) that doesn't fit local component state.

## Security model

Authorization is enforced at the database via Row Level Security (RLS), not in application code. Every table is scoped so a user can only see/modify rows they own. See [Database Design](07-database-design.md) for the policies and [Authentication Strategy](10-authentication.md) for how identity flows into them.

**Why this matters architecturally:** it means a bug in frontend code (e.g. a missing filter) cannot leak another user's data — the database itself refuses the query. This is defense in depth, not a substitute for sane application code, but it's the layer we actually trust.

## Error handling

- Repository functions surface typed errors rather than throwing raw Supabase errors, so feature/UI code handles a consistent shape.
- TanStack Query's error state drives UI feedback (inline errors, retry affordances).
- Given the online-first model, network failures are an expected, designed-for state (see [Synchronization Strategy](11-synchronization.md)) rather than an edge case.

## Extensibility hooks already accounted for

These aren't built in the MVP, but the architecture is shaped so they don't require structural rework later:

- **Community sharing** ([Roadmap](13-roadmap.md) Phase 5): decks already have a clear owner; adding a `is_public` flag and a "forked from" lineage column is additive, not a redesign. See [Database Design](07-database-design.md) §Future Extensibility.
- **Native mobile clients**: the domain and data-access layer pattern is UI-framework-agnostic. A React Native (or other) client would reuse the same domain logic and a parallel data-access layer.
- **Local-first/offline sync**: explicitly _not_ designed in now (see [Synchronization Strategy](11-synchronization.md)), but the layering — especially keeping data access behind repositories — is exactly what would let us swap in a local cache + sync queue later without touching the UI or domain layers.

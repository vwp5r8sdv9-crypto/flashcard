# Technology Stack

Every entry below is a decision, not a default — the "Why" line ties it back to the goals in [Goals](02-goals.md) (scalability, maintainability, low operational overhead, type safety).

## Frontend

| Tool | Role | Why |
|---|---|---|
| **React 18 + TypeScript** | UI framework | Matches existing team skillset (see decision context); huge ecosystem; TypeScript gives compile-time safety across the whole frontend, catching schema drift and refactor mistakes early. |
| **Vite** | Build tool / dev server | Fast cold start and HMR compared to older bundlers; minimal config; first-class TypeScript and PWA plugin support. |
| **React Router** | Client-side routing | The standard, well-documented routing solution for React SPAs; no need for a meta-framework's server-rendering features since this is a client-only SPA talking to Supabase. |
| **TanStack Query** | Server-state management | Handles caching, request de-duplication, invalidation, and refetching against Supabase — exactly the "sync UX" layer the app needs (see [Architecture](04-architecture.md) §State management). Avoids hand-rolled fetch/cache logic. |
| **Tailwind CSS** | Styling | Fast, consistent styling without hand-rolled CSS files sprawling across the codebase; pairs well with component libraries built on it. |
| **shadcn/ui (Radix primitives)** | Base UI components | Accessible, unstyled primitives (dialogs, dropdowns, etc.) that we own the code for (copied into the repo, not an opaque dependency) — avoids both "build every component from scratch" and "fight an opinionated component library's theming." |
| **React Hook Form** | Form state/validation | Performant, minimal-re-render form handling for deck/card editing forms. |
| **Zod** | Runtime schema validation | Validates form input and imported file contents (JSON/CSV) at runtime, where TypeScript's compile-time types can't help — e.g. validating an uploaded import file actually matches the expected shape. |
| **vite-plugin-pwa** | PWA/service worker | Generates the manifest and app-shell service worker needed for "installable, fast-loading web app" from [MVP Scope](03-mvp-scope.md), without hand-writing service worker code. |

## Backend — Supabase

| Component | Role | Why |
|---|---|---|
| **Postgres** | Primary database | Relational integrity is a good fit for decks → cards → review-state → review-logs (see [Database Design](07-database-design.md)); mature, well-understood, and what Supabase is built on. |
| **Supabase Auth** | Authentication | Email/password (and easy future OAuth) with JWT issuance and session refresh handled for us — see [Authentication Strategy](10-authentication.md). |
| **PostgREST (auto-generated API)** | CRUD API | Every table gets a REST API automatically, callable via `supabase-js` — no hand-written CRUD endpoints. See [API Design](09-api-design.md). |
| **Row Level Security (RLS)** | Authorization | Per-user data isolation enforced inside Postgres itself, not just in application code — see [Architecture](04-architecture.md) §Security model. |
| **Edge Functions (Deno/TS)** | Custom server logic | The few things that don't fit "direct CRUD with RLS" — e.g. parsing/validating an imported deck file server-side. See [API Design](09-api-design.md). |
| **Supabase Storage** | File storage | Not used in the MVP; reserved for future card media (images/audio) per [Roadmap](13-roadmap.md). Listed now so the database design isn't surprised by it later. |

**Decision:** Supabase over a self-hosted stack (e.g. Postgres + a custom auth service).
**Why:** It collapses auth, database, API, and (later) file storage into one managed system with a generous free tier, which is the right tradeoff for a small team's MVP (see [Goals](02-goals.md) §low operational overhead). The main cost is some vendor coupling, which the [Architecture](04-architecture.md)'s repository pattern is specifically designed to contain.

## Hosting

| Tool | Role | Why |
|---|---|---|
| **Vercel** | Frontend hosting | Git-integrated deploys, automatic preview deployments per pull request, generous free tier for a static/PWA frontend, zero-config for a Vite SPA. No server to manage since there's no custom backend. Netlify would serve equally well and isn't a wrong choice — Vercel is picked here simply so it's a settled decision rather than an open question when CI/CD is wired up in Phase 0 ([Roadmap](13-roadmap.md)); switching later, if ever needed, is a low-cost change since hosting isn't referenced by any application code. |
| **Supabase Cloud** | Backend hosting | The managed Postgres/Auth/Storage/Functions instance — see above. |

## Quality tooling

| Tool | Role | Why |
|---|---|---|
| **ESLint + Prettier** | Linting/formatting | Consistent style and early bug-catching enforced automatically rather than by convention — feeds [Coding Standards](12-coding-standards.md). |
| **TypeScript (`strict: true`)** | Type checking | Non-negotiable given the "type safety end-to-end" goal; types are generated from the live database schema (`supabase gen types typescript`) so the frontend can never silently drift from the schema. |
| **Vitest + React Testing Library** | Unit/component tests | Vitest shares config with Vite (fast, no separate toolchain); RTL tests components the way users interact with them, not implementation details. |
| **Playwright** | End-to-end tests | Covers the critical path end to end (sign up → create deck → add card → study → log out) against a real browser. |
| **Husky + lint-staged** | Pre-commit hooks | Catches lint/format/type issues before they're committed, not after CI fails. |
| **GitHub Actions** | CI | Lint, typecheck, unit tests, and build run on every pull request — see [Coding Standards](12-coding-standards.md) §Git workflow. |

## What we deliberately did *not* pick (and why)

- **Next.js / a server-rendering meta-framework** — there's no SEO or server-rendering requirement (this is a logged-in app, not a marketing site), and a client-only SPA is simpler to reason about and host given Supabase already serves as "the backend." Revisit only if a public-facing marketing/landing experience needs SSR later.
- **A custom Node/NestJS backend** — see [Architecture](04-architecture.md) for the full reasoning; in short, Supabase already covers what it would do for the MVP's needs.
- **Redux/Zustand/Jotai** — see [Architecture](04-architecture.md) §State management; almost all state here is server state, which TanStack Query already owns.
- **GraphQL** — PostgREST's REST API (via `supabase-js`) is sufficient for the access patterns this app needs (simple CRUD plus a couple of filtered list queries); GraphQL's flexibility isn't needed and would add a schema layer to maintain.

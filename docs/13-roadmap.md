# Development Roadmap

Built one module at a time, per the agreed process: each phase is reviewed before moving to the next. Phases are sequenced by what the core loop in [Product Vision](01-product-vision.md) needs first.

**Sequencing note (historical):** real authentication and Supabase wiring were initially deferred after Login/Home UI in favor of core deck and card management, to get the product's central interaction reviewable sooner — decks/cards ran against localStorage repositories (ADR-0015) and sign-in was simulated. Both are now done (ADR-0020, ADR-0021): Supabase is the real repository backend and `RequireAuth`/`RedirectIfAuthenticated` are applied to the real routes. Internationalization (ADR-0016) and the sidebar/drawer navigation shell were also brought forward ahead of the original phase breakdown below, since they touch nearly every screen and are cheaper to build once than retrofitted later.

## Phase 0 — Foundation

**Goal:** Agree on the architecture before writing application code.

- This documentation set (`/docs`).
- Repo scaffolding: Vite + React + TypeScript project, ESLint/Prettier, Vitest, Playwright, CI pipeline (see [Tech Stack](05-tech-stack.md)).
- Vercel deployment readiness — **done**: `vercel.json` SPA rewrite, route-based code splitting (ADR-0019), production env var setup documented in the root README.
- Supabase project setup: initial migration for `profiles`/`decks`/`cards`/`card_study_state` with RLS policies (see [Database Design](07-database-design.md)) — **done** (ADR-0020); the migration exists and is reviewed, but applying it to a real cloud project and configuring env vars there is an operational step for whoever owns that project, not something done from this repo alone.
- Base auth wiring (sign up/in/out) — **done** (ADR-0021): real Supabase Auth, `RequireAuth` applied to every authenticated route.

**Exit criteria:** met. A user signs up, signs in, and manages decks/cards against the real Supabase backend, RLS-isolated per user.

## Phase 1 — Core loop: decks, cards, studying

**Goal:** Prove the product's central promise.

- Decks: create/edit/delete/list — **done**, against the real Supabase backend, RLS-isolated per user (ADR-0020) ([User Flows](08-user-flows.md) §2, §5).
- Cards: create/edit/delete/search/sort within a deck — **done**, same Supabase-backed approach via a dedicated `CardsRepository` ([User Flows](08-user-flows.md) §3).
- `domain/study`: card selection (`getNextCard`) and rating (`applyRating`) are **done** — weighted-random selection with recency avoidance, not spaced repetition, finalized in ADR-0026 (supersedes the SM-2 approach in ADR-0013/ADR-0023), with `card_study_state` rows created automatically via a database trigger.
- Study session: a continuous session with no due dates and no end (per-deck and the global cross-deck view, both via `studyApi`), tap-or-button reveal, Again/Good/Easy grading with the next card chosen immediately, and a calm "no cards yet" empty state with an inline add-card action — **done** ([User Flows](08-user-flows.md) §4).

**Exit criteria:** met. [MVP Scope](03-mvp-scope.md)'s "definition of done" items 1–4 are satisfied.

## Phase 2 — Import/export, PWA polish

**Goal:** Make data portable and the app installable.

- Export to JSON and CSV; import from JSON and CSV with preview/confirm ([User Flows](08-user-flows.md) §6–7).
- PWA manifest + service worker (installable, fast-loading app shell — see [Synchronization Strategy](11-synchronization.md) for what offline does and doesn't mean here).
- Empty/loading/error states polished across all flows ([User Flows](08-user-flows.md) §Key states).

**Exit criteria:** [MVP Scope](03-mvp-scope.md)'s "definition of done" items 5–6 are met. **This is the MVP.**

## Phase 3 — Insights (post-MVP, time-permitting)

- Basic study stats: cards studied over time, retention rate, streaks.
- `card_study_state`'s aggregated counters (`times_seen`/`times_again`/`times_good`/`times_easy`) cover simple per-card stats already; anything needing per-event history (e.g. "show my activity over time") needs a new event-log table at that point — ADR-0026 deliberately doesn't carry one forward speculatively.

## Phase 4 — Mobile reach (post-MVP)

- Evaluate wrapping the existing PWA with Capacitor for app-store distribution before considering a separate React Native codebase — the [Architecture](04-architecture.md)'s domain/data-access layering means either path reuses the scheduling logic and repository pattern.
- Only build a fully native/React Native client if the Capacitor wrapper proves insufficient (e.g. for native-only APIs).

## Phase 5 — Community (post-MVP)

- Publish a deck publicly; browse/search public decks; import someone else's deck (forking).
- Schema groundwork already anticipated in [Database Design](07-database-design.md) §Future Extensibility (`is_public`, `forked_from_deck_id`).
- Moderation/reporting is an open design question to revisit when this phase starts, not before.

## Phase 6 — Deferred capabilities, revisited based on real usage

These are explicitly not scheduled yet — they're listed so they're not forgotten, and so a future "should we build X" conversation starts from "yes, anticipated" rather than from scratch:

- **Local-first/offline studying** — see [Synchronization Strategy](11-synchronization.md) §Migration path. Build only if real usage shows offline access is a frequent need, not speculatively.
- **Rich media cards** (images/audio).
- **Anki `.apkg` import.**
- **MFA / magic-link sign-in** — see [Authentication Strategy](10-authentication.md) §Deliberately deferred.

## Process reminder

After each phase (and arguably after each feature within Phase 1–2), pause for review before continuing — the goal is deliberate, reviewable progress, not velocity for its own sake.

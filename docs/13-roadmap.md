# Development Roadmap

Built one module at a time, per the agreed process: each phase is reviewed before moving to the next. Phases are sequenced by what the core loop in [Product Vision](01-product-vision.md) needs first.

## Phase 0 — Foundation (current phase)

**Goal:** Agree on the architecture before writing application code.

- This documentation set (`/docs`).
- Repo scaffolding: Vite + React + TypeScript project, ESLint/Prettier, Vitest, Playwright, CI pipeline (see [Tech Stack](05-tech-stack.md)).
- Supabase project setup: initial migration for `profiles`/`decks`/`cards`/`card_review_state`/`review_logs` with RLS policies (see [Database Design](07-database-design.md)).
- Base auth wiring (sign up/in/out) — enough to confirm the auth + RLS model works end to end, before building deck/card features on top of it.

**Exit criteria:** A signed-up user lands on an empty, authenticated "your decks" screen, backed by real RLS-protected tables.

## Phase 1 — Core loop: decks, cards, studying

**Goal:** Prove the product's central promise.

- Decks: create/edit/delete/list ([User Flows](08-user-flows.md) §2, §5).
- Cards: create/edit/delete within a deck ([User Flows](08-user-flows.md) §3).
- `domain/srs`: the spaced-repetition algorithm, built and unit-tested as a pure module ([Architecture](04-architecture.md)).
- Study session: due-card queue (per-deck and the global cross-deck view — both share one query, see [Database Design](07-database-design.md) §Row Level Security), Again/Good/Easy, session summary ([User Flows](08-user-flows.md) §4).

**Exit criteria:** [MVP Scope](03-mvp-scope.md)'s "definition of done" items 1–4 are met.

## Phase 2 — Import/export, PWA polish

**Goal:** Make data portable and the app installable.

- Export to JSON and CSV; import from JSON and CSV with preview/confirm ([User Flows](08-user-flows.md) §6–7).
- PWA manifest + service worker (installable, fast-loading app shell — see [Synchronization Strategy](11-synchronization.md) for what offline does and doesn't mean here).
- Empty/loading/error states polished across all flows ([User Flows](08-user-flows.md) §Key states).

**Exit criteria:** [MVP Scope](03-mvp-scope.md)'s "definition of done" items 5–6 are met. **This is the MVP.**

## Phase 3 — Insights (post-MVP, time-permitting)

- Basic study stats: cards studied over time, retention/lapse rate, streaks.
- Backed entirely by `review_logs`, which is why it's collected from day one ([Database Design](07-database-design.md)) even though nothing reads it until this phase.

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
- **OAuth/MFA** — see [Authentication Strategy](10-authentication.md) §Deliberately deferred.

## Process reminder

After each phase (and arguably after each feature within Phase 1–2), pause for review before continuing — the goal is deliberate, reviewable progress, not velocity for its own sake.

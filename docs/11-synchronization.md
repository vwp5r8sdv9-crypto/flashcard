# Synchronization Strategy

## The decision

**Decision:** Online-first. The Supabase Postgres database is the single source of truth. Clients read and write directly to it; there is no local-first data store and no custom sync engine.

**Why:** This was chosen explicitly over a local-first/offline-capable model as the right tradeoff for the MVP:

- It's dramatically simpler to build and reason about — no conflict resolution, no mutation queue, no merge logic.
- "Multi-device sync," as requested in the product brief, is satisfied _for free_ by this model: signing in on a second device reads the same rows from the same database. There's no separate "sync" subsystem to design, because there's nothing to reconcile.
- The cost — the app doesn't work without connectivity — is an explicit, acceptable tradeoff for an MVP whose goal is to validate the core create/study loop, not to solve offline data sync.

**Alternative considered:** Local-first (a local IndexedDB/SQLite store that's the primary read/write target, syncing to the cloud in the background, usable fully offline). This is a legitimate, arguably better long-term fit for a study app (people study on commutes, flights, etc.) — but it requires conflict resolution logic (what happens if the same card is rated on two offline devices before either syncs?), a mutation queue, and meaningfully more code to get right. Deferred — see "Migration path" below for how to get there later without a rewrite.

## What "sync" means in this model

There is no sync _engine_. Every screen simply fetches current data from Supabase when it needs it. TanStack Query (see [Tech Stack](05-tech-stack.md)) adds a caching layer on top of that for perceived speed:

- Reads are cached client-side and reused across navigations.
- Mutations (create/edit/delete) invalidate the relevant cached queries, triggering a refetch.
- Queries refetch on window focus, so switching back to a tab (or back to the app after using it on another device) picks up any changes made elsewhere.

**This caching is a UX-latency optimization, not an offline mechanism.** It's important to be explicit about that distinction so it's never mistaken for offline support later.

## What happens without connectivity

The app is a PWA (see [Tech Stack](05-tech-stack.md)), which means the app _shell_ (HTML/JS/CSS) is cached by a service worker and loads instantly even with a flaky connection. **Data does not work offline in the MVP** — if a data request fails because the device is offline, the app shows an explicit "you're offline" state rather than a confusing spinner or a silent failure.

**Decision:** Make the offline limitation visible and intentional, not a vague failure mode.
**Why:** Given the product is partly about being available "wherever the user studies" (see [Product Vision](01-product-vision.md)), it's important this gap is a documented, conscious tradeoff — something to revisit if user feedback shows it's a real problem — rather than a bug users discover on their own.

## Conflict handling

Because there is one source of truth and (in the overwhelming majority of cases) a single human acting on their own data, real conflicts are rare. The realistic edge case: a user has the app open on two devices and edits the same card on both within seconds of each other. The MVP resolves this with **last-write-wins**, via each row's `updated_at` timestamp — whichever write reaches Postgres last is what persists. No merge UI, no "your changes conflict" dialog.

**Why this is acceptable:** the cost of building real conflict resolution (operational transforms, CRDTs, or even a manual merge UI) is not justified by how rarely this scenario actually occurs for a single-user personal study tool. This is explicitly revisited if/when multi-device _simultaneous_ editing becomes a real, observed problem rather than a theoretical one.

## Migration path to local-first (if/when needed)

If offline studying becomes a validated, real user need (not hypothetical), here's what would change — called out now so today's architecture doesn't accidentally block it:

1. Introduce a local store (IndexedDB, or SQLite via a WASM build) as a cache/queue in front of Supabase.
2. Reads serve from local data first, with background refresh from the server.
3. Writes go to the local store immediately (optimistic) and queue for upload; the queue retries on reconnect.
4. Conflict resolution needs real design at that point — likely per-field last-write-wins for deck/card _content_, but something more careful for `card_study_state` (two devices both studying the same card offline is the one scenario where naive last-write-wins could silently lose a rating).
5. Because the [Architecture](04-architecture.md)'s data-access layer is already the _only_ place Supabase is called from, this change is largely contained to that layer plus a new local-storage layer underneath it — the UI, feature hooks, and domain study logic would not need to change.

This isn't built now. It's documented so that "online-first today" reads as a deliberate, revisitable choice rather than a wall.

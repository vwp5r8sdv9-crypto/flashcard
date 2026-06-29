# MVP Scope

The MVP exists to prove the core loop from [Goals](02-goals.md): create a deck, add cards, study them with spaced repetition, and have it all available wherever the user logs in. Everything not in service of that loop is deferred.

## In scope

### Authentication

- Sign up, sign in, sign out, password reset (email/password via Supabase Auth).
- A signed-in user only ever sees their own data.

### Decks

- Create, rename/edit (name, language, color for visual identification), delete a deck — with a confirmation step before delete.
- **Every deck represents one study language**, chosen from the same five the UI supports (see §Internationalization) — a deliberate narrowing of [Product Vision](01-product-vision.md)'s "any language, any subject" framing for now, not a reversal of it; see ADR-0017 for the reasoning and what would need to change to support non-language (e.g. "any subject") decks again.
- List all of a user's decks as responsive cards showing color, language, and card count; tapping one opens straight into studying that deck (see §Studying).

### Flashcards

- Create, edit, delete a card within a deck; list, search (front/back substring match), and view alphabetically sorted (locale-aware, by the deck's language).
- A card has a **front** (original word/sentence) and **back** (translation), plus optional **pronunciation**, **notes**, and **example sentence** — see [Database Design](07-database-design.md).
- Deleting a deck deletes its cards (cascade).

### Internationalization

- UI available in English, Portuguese, Russian, German, and Japanese; every string is translated, no hardcoded UI text.
- A language selector (Settings page) switches the UI instantly; the choice persists in `localStorage` across sessions. See ADR-0016.

### Studying

- A calm, continuous session — no due dates, no progress bar, no statistics during study, and the session never ends on its own; the user studies until they leave (see ADR-0026). Two entry points, both in scope: study a **single deck**, and study **every card across every deck** in one combined session (see [User Flows](08-user-flows.md)). These share the same query shape with or without a `deck_id` filter (see [Database Design](07-database-design.md) §Row Level Security), so the marginal cost of offering both is low.
- Each card: show front → reveal back (tap the card, or "Show answer") → rate **Again / Good / Easy**, then the next card appears immediately.
- Ratings drive a weighted-random card picker, not a spaced-repetition schedule — see [Database Design](07-database-design.md) §`card_study_state` and ADR-0026 for the algorithm and why this isn't SM-2/FSRS/Leitner yet.

### Import / export

- **Export** a deck to JSON (full fidelity: cards + study state) and CSV (front/back only, for portability to other tools).
- **Import** a deck from JSON or CSV, with a preview/confirmation step before committing.

### Cloud availability

- All data lives in the cloud database (Supabase Postgres). Signing in on a second device shows the same decks immediately. This is a property of the online-first architecture, not a separate "sync" feature — see [Synchronization Strategy](11-synchronization.md) for what that does and doesn't mean.

### Platform

- Responsive web app, installable as a PWA (add-to-home-screen, app-like window). See [Tech Stack](05-tech-stack.md).

## Explicitly out of scope for MVP

Each of these is a deliberate deferral, not an oversight — reasons and rough sequencing are in [Roadmap](13-roadmap.md):

- **Community features** — publishing decks, browsing/importing others' decks. The schema leaves room for this (see [Database Design](07-database-design.md) §Future Extensibility) but it is not built.
- **Native mobile apps.** The web app is responsive and installable, but no App Store/Play Store app ships in the MVP.
- **Offline studying / local-first sync.** Per the online-first decision, the app requires connectivity to read or write data. See [Synchronization Strategy](11-synchronization.md) for the explicit tradeoff and the migration path if this changes later.
- **Rich media on cards** (images, audio, formatted text). Cards are plain text for MVP; this is a natural fast-follow.
- **Anki `.apkg` import.** It's a binary SQLite-based format with its own scheduling model — meaningfully more work than JSON/CSV import. Fast-follow once core import/export is proven.
- **Statistics/analytics dashboards** — no per-card or per-deck stats are shown anywhere; see ADR-0026 on why study is deliberately statistics-free for now.
- **Team/classroom management.**
- **OAuth/social login, multi-factor auth.** Email/password covers the MVP; the auth design doesn't preclude adding these later (see [Authentication Strategy](10-authentication.md)).

## Definition of done for the MVP

A user can, unaided:

1. Sign up and land on an empty "your decks" screen.
2. Create a deck and add at least one card to it.
3. Study that deck continuously — rate cards Again/Good/Easy and see the next card appear immediately, with no session end.
4. Come back later (or refresh, or close and reopen the PWA) and see that ratings from the previous session were remembered.
5. Export that deck, delete it, and re-import it without losing any cards or study progress.
6. Sign in from a different browser/device and see the same deck.

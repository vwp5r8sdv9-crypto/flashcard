# Flashcards

A flashcard app for language learning (or any subject): fully custom decks, studied with spaced repetition, synced to the cloud.

The full product and architecture documentation — including the reasoning behind every major decision — lives in [`/docs`](docs/README.md), with the decision log itself in [`/docs/adr`](docs/adr/README.md). Start there before touching code.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's URL and publishable key
npm run dev
```

### Setting up Supabase

This app has no backend of its own — Supabase is the entire database/auth layer (ADR-0001), and the schema lives in `supabase/migrations/` as version-controlled SQL, not clicked together in a dashboard (docs/06-folder-structure.md).

1. Create a project at [supabase.com](https://supabase.com) (or use an existing one).
2. Link this repo to it and apply the migration:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
3. Copy the project's URL and **Publishable key** (Project Settings → API) into `.env.local` as shown in `.env.example`.

That single migration creates every table (`profiles`, `decks`, `cards`, `card_review_state`, `review_logs`), Row Level Security policies, and triggers described in [`docs/07-database-design.md`](docs/07-database-design.md) — see [ADR-0020](docs/adr/0020-supabase-repository-backend.md) for what changed when the app moved from local-only storage to this.

## Scripts

| Command                           | Does                               |
| --------------------------------- | ---------------------------------- |
| `npm run dev`                     | Start the dev server               |
| `npm run build`                   | Typecheck and build for production |
| `npm run preview`                 | Serve the production build locally |
| `npm run lint` / `lint:fix`       | ESLint                             |
| `npm run format` / `format:check` | Prettier                           |
| `npm run typecheck`               | TypeScript only, no bundling       |
| `npm run test` / `test:watch`     | Vitest                             |

## Deploying to Vercel

This is a static Vite SPA — Vercel's Vite framework preset detects `npm run build` / `dist` automatically, and [`vercel.json`](vercel.json) adds the rewrite a client-routed SPA needs (without it, refreshing a nested route like `/decks/abc123` 404s on a static host, since there's no `/decks/abc123` file to serve — the rewrite sends every unmatched path to `index.html` and lets React Router take over).

Required environment variables — set these in the Vercel project's **Settings → Environment Variables** before the first deploy (Vite inlines `VITE_*` vars at _build_ time, so they must exist when Vercel runs the build, not just at runtime):

| Variable                        | Value                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Your Supabase project URL                                                                                        |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The **Publishable key** from Project Settings → API — never the Secret key, which must never reach frontend code |

See [`.env.example`](.env.example) for local development and ADR-0001 / ADR-0011 for why Supabase and Vercel were chosen.

## Status

Early build — see [`docs/13-roadmap.md`](docs/13-roadmap.md) for what's built vs. planned. Real Supabase Auth (sign up, sign in, sign out, session persistence, Google OAuth, password reset) and RLS-isolated deck/card management run against a real Supabase backend (no more local-only storage), with a sidebar/drawer navigation shell and a fully internationalized UI (English, Portuguese, Russian, German, Japanese). Studying is implemented end to end: a spaced-repetition scheduler (ADR-0023), per-deck and global due-card sessions with Again/Good/Easy grading, and browser-native text-to-speech pronunciation (ADR-0025). The UI supports Light/Dark/System theming (ADR-0024).

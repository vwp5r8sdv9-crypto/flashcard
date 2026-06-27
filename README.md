# Flashcards

A flashcard app for language learning (or any subject): fully custom decks, studied with spaced repetition, synced to the cloud.

The full product and architecture documentation — including the reasoning behind every major decision — lives in [`/docs`](docs/README.md), with the decision log itself in [`/docs/adr`](docs/adr/README.md). Start there before touching code.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's URL and anon key
npm run dev
```

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

## Status

Foundation/scaffolding stage — see [`docs/13-roadmap.md`](docs/13-roadmap.md) for what's built vs. planned. No business features (decks, cards, study, auth UI) are implemented yet.

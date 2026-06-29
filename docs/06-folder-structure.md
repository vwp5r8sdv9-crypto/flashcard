# Folder Structure

## Guiding principle

The codebase is organized **by feature/domain first, by technical role second** (a "bulletproof-react"-style layout) rather than the classic `components/`, `containers/`, `reducers/` split. As the app grows, you add a new feature folder, not a new file in five different top-level technical folders scattered far apart from each other. This directly serves the "scalability/maintainability" goals in [Goals](02-goals.md): understanding "everything about decks" means opening one folder, not searching the whole tree.

The layering rules from [Architecture](04-architecture.md) (UI → feature → domain → data-access) map directly onto this structure.

## Proposed layout

```
flashcards/
├── docs/                          # this documentation set
├── public/                        # static assets, PWA icons/manifest source
├── src/
│   ├── app/                       # app shell
│   │   ├── routes/                # route definitions / page composition
│   │   ├── providers/             # QueryClientProvider, AuthProvider, etc.
│   │   └── layout/                # AppLayout, Sidebar, MobileNav/MobileDrawer, nav config
│   │
│   ├── features/                  # one folder per business feature
│   │   ├── auth/
│   │   │   ├── components/        # SignInForm, SignUpForm, ...
│   │   │   ├── hooks/             # useSignIn, useSession, ...
│   │   │   ├── api/               # authApi.ts (repository functions)
│   │   │   └── types.ts
│   │   ├── decks/
│   │   │   ├── components/        # DeckList, DeckCard, DeckForm, ...
│   │   │   ├── hooks/             # useDecks, useCreateDeck, useDeleteDeck
│   │   │   ├── api/                # decksApi.ts
│   │   │   └── types.ts
│   │   ├── cards/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/                # cardsApi.ts
│   │   │   └── types.ts
│   │   ├── study/
│   │   │   ├── components/        # StudySession, Flashcard, ...
│   │   │   ├── hooks/             # useStudyCards, useSubmitRating
│   │   │   ├── api/                # studyApi.ts (reads/writes card_study_state)
│   │   │   └── types.ts
│   │   └── import-export/
│   │       ├── components/        # ImportWizard, ExportButton, ...
│   │       ├── hooks/
│   │       ├── api/
│   │       └── types.ts
│   │
│   ├── domain/                    # pure business logic — no React, no Supabase imports
│   │   ├── study/                 # getNextCard (weighted-random selection) + applyRating — see ADR-0026
│   │   └── importExport/          # Zod schema for valid import files — shared with the import-deck Edge Function, see docs/09-api-design.md
│   │
│   ├── components/                 # shared, generic, feature-agnostic UI (Button, Dialog, Select, ConfirmDialog...)
│   ├── lib/                        # infrastructure: supabaseClient.ts, env.ts, languages.ts, i18n/ (i18next setup + locale JSON)
│   ├── hooks/                      # shared generic hooks (useDebounce, useMediaQuery...)
│   ├── types/                      # shared/generated types, incl. generated Supabase DB types
│   ├── styles/                     # Tailwind entry, global CSS
│   └── main.tsx                    # app entry point
│
├── supabase/
│   ├── migrations/                 # versioned SQL migrations — the schema, as code
│   └── functions/                  # Edge Functions (e.g. import-deck)
│
├── tests/
│   └── e2e/                        # Playwright specs
│
├── .github/
│   └── workflows/                  # CI pipelines (lint, typecheck, test, build)
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── .eslintrc / eslint.config.*
└── package.json
```

## Why this shape, specifically

**Decision:** Feature folders (`features/decks`, `features/study`, …) own their components/hooks/api together, instead of splitting by technical type at the top level.
**Why:** Working on "studying" touches a study UI component, a study hook, and a study API call — colocating them means one folder to open, and deleting a feature is deleting one folder, not hunting across `components/`, `hooks/`, and `api/` trees for orphaned files.
**Alternative considered:** Strict technical layering (`components/`, `hooks/`, `services/` at the top level) — common, but tends to make every feature change touch three distant folders, and scales worse as feature count grows.

**Decision:** `src/domain/` is separate from `src/features/` and contains no framework imports.
**Why:** Already justified in [Architecture](04-architecture.md) — this is the spaced-repetition logic, and it needs to be unit-testable and portable to a future non-web client. Keeping it physically separate makes the "no React/Supabase imports here" rule easy to enforce (and lint for — see [Coding Standards](12-coding-standards.md)).

**Decision:** Database schema lives in `supabase/migrations` as version-controlled SQL, not only as clicks in the Supabase dashboard.
**Why:** Schema-as-code means the database structure is reviewable in pull requests, reproducible for a fresh environment, and never silently drifts from what's documented in [Database Design](07-database-design.md).

**Decision:** `features/*/api/` is the only place outside `src/lib/supabaseClient.ts` that imports `supabase-js`.
**Why:** Enforces the repository pattern from [Architecture](04-architecture.md) at the folder level — easy to lint, easy to spot in review if violated.

## What's intentionally _not_ here yet

- No `mobile/` or `apps/*` monorepo split — there's a single web app target for the MVP (see [MVP Scope](03-mvp-scope.md)). If/when a native or React Native client is built, the `domain/` layer and the general repository pattern are designed to be lifted into a shared package at that point, but we don't pay that monorepo-tooling cost today for a client that doesn't exist yet.
- No `server/` folder — there is no custom backend (see [Architecture](04-architecture.md)).

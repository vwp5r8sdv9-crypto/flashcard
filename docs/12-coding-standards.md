# Coding Standards

These exist to keep the codebase navigable by a small team (or a solo developer returning to it after months away) — see [Goals](02-goals.md) §maintainability. They're enforced by tooling wherever possible, not left to memory.

## TypeScript

- `strict: true` in `tsconfig.json`, no exceptions.
- No `any` without an inline comment explaining why it's unavoidable (e.g. a genuinely untyped third-party shape). `unknown` + narrowing is preferred when a type truly isn't known yet.
- Prefer explicit types at module boundaries (function params/returns, exported values) and let TypeScript infer internally — explicit types at boundaries are documentation; internal inference reduces noise.
- Database types are generated, never hand-written (see [API Design](09-api-design.md)) — if a type and the schema disagree, the type is wrong and needs regenerating, not editing.

## Naming and file conventions

- Components: `PascalCase` file and export name (`DeckCard.tsx` exports `DeckCard`).
- Hooks: `camelCase`, prefixed `use` (`useDecks.ts`).
- Everything else (utils, api modules, types): `camelCase` filenames.
- One component per file as the default; small tightly-coupled subcomponents that are never reused elsewhere may live in the same file.

## Architectural rules (enforced, not just convention)

These map directly to [Architecture](04-architecture.md) and [Folder Structure](06-folder-structure.md), and should be backed by ESLint import-boundary rules (e.g. `eslint-plugin-boundaries` or `import/no-restricted-paths`) so violations fail CI rather than relying on review catching them:

1. **`src/domain/**`imports nothing from React or`supabase-js`.\*\* Domain code is pure TypeScript, testable without rendering anything or hitting a network.
2. **`supabase-js` is only imported in `src/lib/supabaseClient.ts` and `features/\*/api/**`.\*\* No component or hook calls Supabase directly.
3. **Components don't reach into another feature's internals.** Cross-feature reuse goes through a feature's public exports (or gets promoted to `src/components`/`src/domain` if it's genuinely shared), not deep imports like `features/decks/components/internal/Thing`.

## State management rules

- Server state (anything persisted in Postgres) is read/written exclusively through TanStack Query hooks built on top of the repository layer — never fetched ad hoc in a `useEffect`.
- Local UI state stays in the component that owns it (`useState`/`useReducer`); it's lifted only when a sibling genuinely needs it, not preemptively.
- No global client-state library is introduced without first writing down, in a PR description or doc update, why local state + TanStack Query can't express the need (see [Architecture](04-architecture.md) §State management).

## Testing expectations

- **`src/domain/study`** requires thorough unit tests — it's the core value proposition of the product (see [Product Vision](01-product-vision.md)) and the easiest layer to test exhaustively since it's pure functions.
- **Feature components** get tests for their critical interactions (submitting a form, rating a card), not exhaustive coverage of every prop combination.
- **End-to-end (Playwright)** covers the golden path end to end: sign up → create deck → add card → study session → sign out. New critical flows get an e2e test; minor UI tweaks don't need one.
- A bug fix that wasn't caught by an existing test gets a regression test alongside the fix.

## Git workflow

- Trunk-based development with short-lived feature branches off `main`.
- Conventional commit prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- CI (lint, typecheck, test, build — see [Tech Stack](05-tech-stack.md)) must pass before merge.
- Pull requests even when working solo — reviewing your own diff before merge catches things that are easy to miss while writing.

## General code-quality heuristics

- Prefer small, single-responsibility modules. Split a file when it visibly mixes more than one responsibility (e.g. data fetching _and_ business rules) — this is a judgment call, not a line-count rule.
- No speculative abstraction: don't build a generic "repository factory" or "plugin system" for a need that doesn't exist yet. Three similar lines of code beat a premature abstraction (see project-wide engineering principles already in effect).
- No dead code paths "just in case" — if something is unused, delete it; git history is the place unused code lives, not the working tree.

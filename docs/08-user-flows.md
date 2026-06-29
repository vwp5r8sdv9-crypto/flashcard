# User Flows

These walk through the core journeys end to end, grounded in the [MVP Scope](03-mvp-scope.md). They're the reference for building UI/feature modules later — each one should map fairly directly to a feature folder from [Folder Structure](06-folder-structure.md).

## 1. Sign up / sign in

1. New visitor lands on a sign-in screen with "sign in" / "create account" options.
2. Sign up: email + password → Supabase Auth creates the user → `profiles` row created via trigger → redirected to "your decks" (empty state).
3. Sign in: email + password → redirected to "your decks."
4. Forgot password: email entered → reset link sent → user sets new password → redirected to sign in.

**Empty state (first-ever login):** "your decks" shows no decks, with a single prominent "create your first deck" action — no onboarding wizard, in keeping with the "get out of the way" vision.

## 2. Create a deck

1. From "your decks," user taps "new deck."
2. Form: name (required), description (optional), language/subject tag (optional, free text).
3. Submit → deck created → user is taken into the (now-empty) deck, prompted to add the first card.

## 3. Add / edit / delete cards

**Add:**

1. Inside a deck, "add card" → form with front, back, notes (optional).
2. Submit → card appears in the deck's card list, with a default `card_study_state` row (weight `5`) ready to be picked up by a study session immediately.
3. Form stays open (or reopens empty) so a user can rapid-fire add many cards — this is the highest-frequency action in the app and should have the least friction.

**Edit:** tap a card in the list → same form, pre-filled → save updates it in place. Editing content does not reset study progress (`card_study_state` is untouched).

**Delete:** delete action on a card, with a confirmation step (irreversible) → removes the card and cascades to its `card_study_state`.

## 4. Study session

A calm, continuous session — no due dates, no progress bar, no statistics while studying, and it never ends on its own; the user studies until they leave. See ADR-0026.

1. From "your decks," tapping a deck opens straight into studying it; a global "study all decks" entry point sits alongside the deck list for a single combined session across every deck (both are in MVP scope, see [MVP Scope](03-mvp-scope.md) §Studying).
2. The app loads every card in scope — that deck, or every deck the signed-in user owns for the global entry point — plus each card's `card_study_state`. Both are the same repository call with an optional `deckId` parameter; see [Database Design](07-database-design.md) §`card_study_state`.
3. **Empty state:** a calm "add some cards first" message with an "add first card" action that opens the card form right there, if the deck has zero cards. (There's no "nothing due" state in this version — every card is always a candidate; see ADR-0026.)
4. For each card:
   - Front is shown, large and centered.
   - User reveals the back by tapping the card, pressing "Show answer," or a keyboard shortcut.
   - Pronunciation/example/notes are shown on the back if the card has them.
   - User rates **Again / Good / Easy**.
   - The rating is sent to the `study` feature, which calls `domain/study`'s `applyRating` to compute the card's new weight/counters and writes the updated `card_study_state` (see [Database Design](07-database-design.md)).
   - The next card is chosen immediately by `getNextCard` (weighted-random, recency-avoiding) and shown with no waiting on a round trip (optimistic update via TanStack Query) — the rated card stays in the pool, just with an adjusted weight, rather than being removed.

## 5. Edit / delete a deck

1. From "your decks" or inside a deck, "edit deck" → same form as creation, pre-filled.
2. "delete deck" → confirmation step explicitly stating it removes all cards in it (irreversible) → cascades per [Database Design](07-database-design.md).

## 6. Export a deck

1. Inside a deck, "export" → choose format (JSON for full fidelity, CSV for simple front/back).
2. File downloads directly in-browser (no server round trip needed beyond the data already fetched — see [API Design](09-api-design.md)).

## 7. Import a deck

1. From "your decks," "import" → choose a file (JSON or CSV).
2. The app parses the file **client-side** and shows a **preview** (deck name, card count, a sample of cards) immediately — no network round trip needed just to preview. This uses the same validation schema as the authoritative check in step 3 (see [API Design](09-api-design.md) §The repository pattern is the API), so a file that passes preview is never surprised by a different rule later.
3. User confirms → the file is sent to the `import-deck` Edge Function, which re-validates and performs the insert as a single transaction (new cards start in `new` state; a full-fidelity JSON import that includes prior scheduling state restores it instead). This step is **always** server-side, regardless of file size — see [API Design](09-api-design.md) for why client-side parsing alone is never trusted for the actual write.
4. Errors (malformed file, unsupported format) are shown before anything is committed — nothing is partially imported.

## 8. Multi-device continuity

1. User signs in on a second device with the same account.
2. "Your decks" shows the same decks immediately — this is a direct read from the same cloud database, not a distinct "sync" step. See [Synchronization Strategy](11-synchronization.md) for exactly what is and isn't guaranteed here (notably: this requires connectivity, since the MVP is online-first).

## Key states to design for in every flow

- **Loading** (initial fetch) — skeleton/spinner, not a blank screen.
- **Empty** (no decks / no cards) — each has a distinct, actionable message rather than a generic "no data."
- **Error** (network failure, validation failure) — visible, specific, and recoverable (retry where it makes sense).
- **Offline** (no connection) — per [Synchronization Strategy](11-synchronization.md), the MVP surfaces a clear "you're offline" state rather than silently failing.

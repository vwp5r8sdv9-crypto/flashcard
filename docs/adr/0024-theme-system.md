# 0024. Theme System: Light/Dark/System with Class-Based Switching

**Status:** Accepted
**Date:** 2026-06-28
**Related:** docs/04-architecture.md §Providers, ADR-0003

## Context

Dark mode so far has only ever followed `prefers-color-scheme` via a CSS media query — there's no in-app control, and no way for a user to force light or dark regardless of OS setting. The broader Phase 4 polish pass asks for a real Light/Dark/System theme toggle, persisted across sessions, alongside a planned color palette overhaul (a separate, later decision).

## Problem

How should the app let a user choose Light, Dark, or System, persist that choice, and apply it without a flash of the wrong theme on load — while fitting the existing provider and styling conventions?

## Alternatives Considered

- **Keep `@media (prefers-color-scheme: dark)` only, no in-app toggle** — simplest, but doesn't satisfy the explicit ask for user-controlled Light/Dark/System.
- **Tailwind's `dark:` utility variants throughout components** — idiomatic Tailwind, but no component in this codebase uses them today; the app already centralizes color via CSS variables consumed through `@theme` in `globals.css`. Switching to utility-variant classes everywhere would touch every component for no behavioral gain over flipping the existing variables off a class selector.
- **Storing theme preference server-side (a column on `profiles`)** — would sync across devices, but adds a write path and a migration for a preference that's reasonably per-device today (matching how `localStorage` already holds the i18n language choice). Revisit if cross-device preference sync becomes a real ask.

## Decision

We will add a `ThemeProvider` (`src/app/providers/ThemeProvider.tsx` + `theme-context.ts` + `useTheme.ts`), mirroring the existing `AuthProvider` split, exposing `{ theme: 'light' | 'dark' | 'system', resolvedTheme: 'light' | 'dark', setTheme }`. It is the outermost provider in `AppProviders.tsx`, so theme applies even before auth resolves.

The preference is persisted in `localStorage['flashcards:theme']`. `src/styles/globals.css`'s dark-token block switches from `@media (prefers-color-scheme: dark)` to `:root.dark`, with `ThemeProvider` toggling a `dark` class on `document.documentElement`. When `theme === 'system'`, a `matchMedia('(prefers-color-scheme: dark)')` subscription keeps `resolvedTheme` live without a page reload.

To avoid a flash of the wrong theme before React mounts, a plain inline `<script>` in `index.html`'s `<head>` (not a module — it must run synchronously before first paint) reads the same `localStorage` key and sets the `dark` class immediately. Its storage key is a duplicated string literal, cross-referenced with a comment in both files, since it runs outside the module graph and can't import the constant.

A `ThemeToggle` segmented control (`src/components/ThemeToggle.tsx`) is added to `SettingsPage.tsx` next to the language picker.

## Consequences

**Positive:**

- Users get explicit control without losing "follow my OS" as the default.
- No new dependency, no new styling mechanism — the existing CSS-variable approach in `globals.css` just gains a second trigger (class, not only media query).
- The provider split is structurally identical to `AuthProvider`, so it's immediately familiar to read.

**Negative / risks:**

- The inline no-flash script duplicates the `flashcards:theme` storage key as a string literal outside TypeScript's reach; a rename of the key in `ThemeProvider.tsx` without updating `index.html` would silently reintroduce the flash-of-wrong-theme bug. Mitigated with cross-referencing comments, not a structural guarantee.
- Theme preference is per-device (`localStorage`), not per-account — a user switching devices has to re-set it.

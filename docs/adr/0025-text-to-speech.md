# 0025. Pronunciation via the Browser's Native SpeechSynthesis API

**Status:** Accepted
**Date:** 2026-06-28
**Related:** docs/04-architecture.md §lib, ADR-0013

## Context

Cards have no audio. Phase 4 asks for text-to-speech so a learner can hear a card's front/back spoken aloud, in the deck's study language, from the card list, the card edit form, and (in a later milestone of this same plan) the study session itself.

## Problem

How should the app speak card text aloud in the correct language, without adding a paid API dependency or a backend audio pipeline?

## Alternatives Considered

- **A third-party TTS API (e.g. ElevenLabs, Google Cloud TTS, Amazon Polly)** — much higher and more consistent voice quality across languages, but requires an API key, a network round-trip per utterance, and (for a free-tier hobby project) a billing relationship. Rejected for now as disproportionate to the ask; revisit if voice quality becomes a real complaint.
- **Pre-recorded audio files per card** — no runtime dependency at all, but requires content production (or another TTS call) per card per language, and storage/serving. Doesn't fit a model where users freely type arbitrary front/back text.
- **Browser-native `window.speechSynthesis`** — zero dependencies, zero cost, works offline once voices are installed, and the five supported languages (`en`/`pt`/`ru`/`de`/`ja`) all have decent default voice coverage on major desktop/mobile browsers. Chosen, with the explicit tradeoff (below) disclosed rather than glossed over.

## Decision

We will use the browser's native `SpeechSynthesis` API exclusively, via a new `src/lib/speech.ts`:

- `useVoices()` — a hook returning the live `SpeechSynthesisVoice[]` list, seeded synchronously from `speechSynthesis.getVoices()` and updated only from the browser's `voiceschanged` event (the same pattern as `ThemeProvider`'s `systemTheme`: state changes only happen inside the subscription callback, never synchronously in the effect body, to satisfy `react-hooks/set-state-in-effect`).
- `pickBestVoice(lang, voices)` — a pure function matching `voice.lang` by BCP-47 prefix (the app's language codes are themselves valid prefixes, e.g. `en` matches `en-US`), preferring the browser's marked-default voice among matches. Pure and unit-tested in isolation (`speech.test.ts`) without touching the real `speechSynthesis` API.
- `speak(text, lang, voices)` — cancels any in-flight utterance (so rapid clicks between front/back don't overlap), then speaks `text` with the best-matched voice.

`src/components/SpeakButton.tsx` wraps this in a speaker-icon `IconButton`. It feature-detects `'speechSynthesis' in window` and renders nothing (not a disabled button) when the API is entirely absent — there's nothing a retry would fix. It's used in `CardListItem` (next to the front text) and `CardFormDialog` (next to both the front and back fields, reading the live form value via `watch`), and will be used by the Study feature's `Flashcard` component in a later milestone. The language is always the deck's own `language` field — never a separate manual picker.

## Consequences

**Positive:**

- No new dependency, no API key, no network call, no backend work.
- `pickBestVoice` is a small, pure, fully unit-testable function — the part of this feature most worth testing is decoupled from the DOM API.
- Disappears cleanly (renders nothing) on browsers/environments without speech support, rather than presenting a button that silently fails.

**Negative / risks:**

- Voice availability and quality vary by OS/browser — e.g. some Linux browsers ship no Japanese voice at all, and even where a language matches, the specific voice quality is whatever the OS provides, not something this app controls. When no voice matches, `speak()` still calls the browser with just `utterance.lang` set, which most browsers fall back on gracefully, but on some platforms this can degrade to no audible output. This is disclosed here rather than worked around, per the project's standing "disclose gaps honestly" rule — there is no good client-only fix for missing OS voice data.
- Headless/automated testing can confirm the button renders and that `speak()` doesn't throw, but cannot verify actual audio output — verified manually instead.

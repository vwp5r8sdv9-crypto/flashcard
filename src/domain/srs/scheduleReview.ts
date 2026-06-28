import type { CardReviewPhase, CardReviewRating, CardReviewState } from './types'

// Simplified SM-2 family, three-button rating — see ADR-0013 (commits to the
// algorithm family) and ADR-0023 (finalizes these constants).
const MIN_EASE_FACTOR = 1.3
const EASE_PENALTY = 0.2
const EASE_BONUS = 0.15
const EASY_INTERVAL_MULTIPLIER = 1.3
const DAY_MS = 24 * 60 * 60 * 1000

function daysFromNow(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString()
}

/**
 * Pure scheduling step: given a card's current review state and a rating,
 * returns the next state. No I/O, no Date.now() — the caller supplies `now`
 * so this stays fully deterministic and unit-testable.
 */
export function scheduleReview(
  state: CardReviewState,
  rating: CardReviewRating,
  now: Date,
): CardReviewState {
  const repetitionsBefore = state.repetitions
  const lastReviewedAt = now.toISOString()

  if (rating === 'again') {
    const wasReviewing = state.state === 'review' || state.state === 'relearning'
    const nextPhase: CardReviewPhase = state.state === 'new' ? 'learning' : state.state
    return {
      ...state,
      state: wasReviewing ? 'relearning' : nextPhase,
      repetitions: 0,
      lapses: wasReviewing ? state.lapses + 1 : state.lapses,
      easeFactor: Math.max(MIN_EASE_FACTOR, state.easeFactor - EASE_PENALTY),
      intervalDays: 1,
      dueAt: daysFromNow(now, 1),
      lastReviewedAt,
    }
  }

  if (rating === 'good') {
    const intervalDays =
      repetitionsBefore === 0
        ? 1
        : repetitionsBefore === 1
          ? 3
          : Math.round(state.intervalDays * state.easeFactor)
    return {
      ...state,
      state: 'review',
      repetitions: repetitionsBefore + 1,
      intervalDays,
      dueAt: daysFromNow(now, intervalDays),
      lastReviewedAt,
    }
  }

  // easy
  const intervalDays =
    repetitionsBefore < 2
      ? 4
      : Math.round(state.intervalDays * state.easeFactor * EASY_INTERVAL_MULTIPLIER)
  return {
    ...state,
    state: 'review',
    repetitions: repetitionsBefore + 1,
    easeFactor: state.easeFactor + EASE_BONUS,
    intervalDays,
    dueAt: daysFromNow(now, intervalDays),
    lastReviewedAt,
  }
}

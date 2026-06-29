import type { CardStudyState, StudyRating } from './types'

// See ADR-0026 for why these are the chosen deltas/bounds.
const MIN_WEIGHT = 1
const MAX_WEIGHT = 8
const WEIGHT_DELTA: Record<StudyRating, number> = { again: 2, good: -1, easy: -2 }

function clampWeight(weight: number): number {
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, weight))
}

/**
 * Pure step: given a card's current study state and a rating, returns its
 * next state. No I/O, no Date.now() — the caller supplies `now` so this
 * stays fully deterministic and unit-testable.
 */
export function applyRating(state: CardStudyState, rating: StudyRating, now: Date): CardStudyState {
  return {
    ...state,
    weight: clampWeight(state.weight + WEIGHT_DELTA[rating]),
    timesSeen: state.timesSeen + 1,
    timesAgain: state.timesAgain + (rating === 'again' ? 1 : 0),
    timesGood: state.timesGood + (rating === 'good' ? 1 : 0),
    timesEasy: state.timesEasy + (rating === 'easy' ? 1 : 0),
    lastStudiedAt: now.toISOString(),
  }
}

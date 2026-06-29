/**
 * Deliberately not a spaced-repetition schedule — no due date, no review
 * phase. Every card is always a candidate to study; `weight` just makes
 * some more likely to come up than others. See ADR-0026.
 */

export type StudyRating = 'again' | 'good' | 'easy'

export interface CardStudyState {
  cardId: string
  weight: number
  timesSeen: number
  timesAgain: number
  timesGood: number
  timesEasy: number
  lastStudiedAt: string | null
}

/**
 * The minimal shape `getNextCard` needs. Kept separate from the richer
 * feature-layer card type (`features/study/types.ts`'s `StudyCard`, which
 * adds front/back/etc.) so this domain module imports nothing outside
 * itself — any object with an `id` and `studyState` structurally satisfies
 * this, no explicit conversion required.
 */
export interface WeightedCard {
  id: string
  studyState: CardStudyState
}

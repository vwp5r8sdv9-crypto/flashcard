import type { WeightedCard } from './types'

/**
 * How many of the most-recently-studied cards to exclude from the candidate
 * pool, scaled to deck size so a small deck doesn't run out of candidates.
 * Always >= 1 once there are 2+ cards, which is what guarantees the same
 * card never repeats back-to-back when avoidable — see ADR-0026.
 */
function recencyAvoidCount(deckSize: number): number {
  if (deckSize >= 8) return 5
  if (deckSize >= 5) return 3
  if (deckSize >= 2) return 1
  return 0
}

/** Caller guarantees `cards` is non-empty — see the two call sites below. */
function weightedPick<T extends WeightedCard>(cards: T[]): T {
  const totalWeight = cards.reduce((sum, card) => sum + card.studyState.weight, 0)
  let roll = Math.random() * totalWeight
  for (const card of cards) {
    roll -= card.studyState.weight
    if (roll <= 0) return card
  }
  // Floating-point rounding fallback — never actually reachable in theory.
  return cards[cards.length - 1]!
}

/**
 * Picks the next card to study: weighted-random by `weight` (higher weight,
 * more likely), with recency avoidance so a relaxed study session doesn't
 * feel repetitive. Pure and synchronous — no I/O, fully unit-testable. The
 * UI never needs to know it's weighted-random rather than e.g. FSRS/SM-2/
 * Leitner; only this function and `applyRating` would change to swap it.
 *
 * Generic over `T` (rather than fixed to `WeightedCard`) so callers get
 * back whatever richer card type they passed in (e.g. `StudyCard`, with
 * front/back/etc.), not just the minimal shape this function needs.
 */
export function getNextCard<T extends WeightedCard>(
  cards: T[],
  recentlyStudiedIds: string[],
): T | null {
  if (cards.length === 0) return null
  if (cards.length === 1) return cards[0]!

  const avoidCount = recencyAvoidCount(cards.length)
  const avoid = new Set(recentlyStudiedIds.slice(-avoidCount))
  const candidates = cards.filter((card) => !avoid.has(card.id))

  // Relax the rule entirely if it would otherwise leave no candidates —
  // shouldn't happen given avoidCount is always < deckSize, but cheap to
  // guard rather than assume.
  return weightedPick(candidates.length > 0 ? candidates : cards)
}

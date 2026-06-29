import { describe, expect, it, vi } from 'vitest'
import { getNextCard } from './getNextCard'
import type { WeightedCard } from './types'

function card(id: string, weight: number): WeightedCard {
  return {
    id,
    studyState: {
      cardId: id,
      weight,
      timesSeen: 0,
      timesAgain: 0,
      timesGood: 0,
      timesEasy: 0,
      lastStudiedAt: null,
    },
  }
}

describe('getNextCard', () => {
  it('returns null for an empty pool', () => {
    expect(getNextCard([], [])).toBeNull()
  })

  it('returns the only card in a 1-card deck, even if it was just studied', () => {
    const only = card('a', 5)

    expect(getNextCard([only], ['a', 'a', 'a'])).toBe(only)
  })

  it('never repeats the immediately-previous card when 2+ cards exist', () => {
    const cards = [card('a', 5), card('b', 5)]

    for (let i = 0; i < 50; i++) {
      const next = getNextCard(cards, ['a'])
      expect(next?.id).toBe('b')
    }
  })

  it('avoids the last 5 studied cards once the deck has 8+ cards', () => {
    const cards = Array.from({ length: 8 }, (_, i) => card(`c${i}`, 5))
    const history = ['c0', 'c1', 'c2', 'c3', 'c4']

    for (let i = 0; i < 50; i++) {
      const next = getNextCard(cards, history)
      expect(['c5', 'c6', 'c7']).toContain(next?.id)
    }
  })

  it('avoids only the last 1 card once the deck has 2-4 cards (not the whole history)', () => {
    const cards = [card('a', 5), card('b', 5), card('c', 5)]
    const history = ['a', 'b'] // "b" was most recent

    for (let i = 0; i < 50; i++) {
      const next = getNextCard(cards, history)
      expect(next?.id).not.toBe('b')
      // "a" (studied 2 turns ago) is allowed back into the pool on a small deck.
    }
  })

  it('relaxes back to the full pool if avoidance would otherwise leave no candidates', () => {
    const cards = [card('a', 5), card('b', 5)]
    // Pathological history covering every id in the pool.
    const history = ['a', 'b']

    const next = getNextCard(cards, history)
    expect(['a', 'b']).toContain(next?.id)
  })

  it('picks a higher-weight card more often than a lower-weight one over many trials', () => {
    const cards = [card('heavy', 8), card('light', 1)]
    const counts = { heavy: 0, light: 0 }

    for (let i = 0; i < 2000; i++) {
      const next = getNextCard(cards, [])
      if (next) counts[next.id as 'heavy' | 'light']++
    }

    // Expected ratio is 8:1 (~1778 vs ~222) - assert directionally with a
    // generous tolerance rather than an exact count, to avoid flakiness.
    expect(counts.heavy).toBeGreaterThan(counts.light * 3)
  })

  it('uses Math.random to weight selection proportionally', () => {
    const cards = [card('a', 2), card('b', 8)]
    const randomSpy = vi.spyOn(Math, 'random')

    // Roll lands within "a"'s slice (total weight 10, "a" covers [0, 2)).
    randomSpy.mockReturnValueOnce(0.1) // 0.1 * 10 = 1, within a's [0,2)
    expect(getNextCard(cards, [])?.id).toBe('a')

    // Roll lands within "b"'s slice ([2, 10)).
    randomSpy.mockReturnValueOnce(0.5) // 0.5 * 10 = 5, within b's [2,10)
    expect(getNextCard(cards, [])?.id).toBe('b')

    randomSpy.mockRestore()
  })
})

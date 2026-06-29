import { describe, expect, it } from 'vitest'
import { applyRating } from './applyRating'
import type { CardStudyState } from './types'

const now = new Date('2026-06-28T12:00:00.000Z')

function state(overrides: Partial<CardStudyState> = {}): CardStudyState {
  return {
    cardId: 'card-1',
    weight: 5,
    timesSeen: 0,
    timesAgain: 0,
    timesGood: 0,
    timesEasy: 0,
    lastStudiedAt: null,
    ...overrides,
  }
}

describe('applyRating', () => {
  it('again: increments timesSeen/timesAgain and adds 2 to weight', () => {
    const next = applyRating(state(), 'again', now)

    expect(next.weight).toBe(7)
    expect(next.timesSeen).toBe(1)
    expect(next.timesAgain).toBe(1)
    expect(next.timesGood).toBe(0)
    expect(next.timesEasy).toBe(0)
    expect(next.lastStudiedAt).toBe(now.toISOString())
  })

  it('good: increments timesSeen/timesGood and subtracts 1 from weight', () => {
    const next = applyRating(state(), 'good', now)

    expect(next.weight).toBe(4)
    expect(next.timesSeen).toBe(1)
    expect(next.timesGood).toBe(1)
  })

  it('easy: increments timesSeen/timesEasy and subtracts 2 from weight', () => {
    const next = applyRating(state(), 'easy', now)

    expect(next.weight).toBe(3)
    expect(next.timesSeen).toBe(1)
    expect(next.timesEasy).toBe(1)
  })

  it('never lets weight drop below 1', () => {
    const next = applyRating(state({ weight: 2 }), 'easy', now)

    expect(next.weight).toBe(1)
  })

  it('never lets weight rise above 8', () => {
    const next = applyRating(state({ weight: 7 }), 'again', now)

    expect(next.weight).toBe(8)
  })

  it('accumulates counts across repeated ratings', () => {
    const afterAgain = applyRating(state(), 'again', now)
    const afterGood = applyRating(afterAgain, 'good', now)

    expect(afterGood.timesSeen).toBe(2)
    expect(afterGood.timesAgain).toBe(1)
    expect(afterGood.timesGood).toBe(1)
    expect(afterGood.weight).toBe(6) // 5 + 2 - 1
  })

  it('is pure: does not mutate the input state', () => {
    const input = state({ weight: 5 })
    const snapshot = { ...input }

    applyRating(input, 'good', now)

    expect(input).toEqual(snapshot)
  })
})

import { describe, expect, it } from 'vitest'
import { scheduleReview } from './scheduleReview'
import type { CardReviewState } from './types'

const now = new Date('2026-06-28T12:00:00.000Z')

function state(overrides: Partial<CardReviewState> = {}): CardReviewState {
  return {
    cardId: 'card-1',
    state: 'new',
    dueAt: '2026-01-01T00:00:00.000Z',
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    lastReviewedAt: null,
    ...overrides,
  }
}

describe('scheduleReview', () => {
  it('graduates a new card to review on Good, due in 1 day', () => {
    const next = scheduleReview(state(), 'good', now)

    expect(next.state).toBe('review')
    expect(next.repetitions).toBe(1)
    expect(next.intervalDays).toBe(1)
    expect(next.dueAt).toBe(new Date(now.getTime() + 1 * 86400000).toISOString())
    expect(next.lastReviewedAt).toBe(now.toISOString())
  })

  it('graduates a new card to review on Easy, due in 4 days, with an ease bonus', () => {
    const next = scheduleReview(state(), 'easy', now)

    expect(next.state).toBe('review')
    expect(next.repetitions).toBe(1)
    expect(next.intervalDays).toBe(4)
    expect(next.easeFactor).toBeCloseTo(2.65)
  })

  it('moves a new card to learning on Again, without counting it as a lapse', () => {
    const next = scheduleReview(state(), 'again', now)

    expect(next.state).toBe('learning')
    expect(next.repetitions).toBe(0)
    expect(next.lapses).toBe(0)
    expect(next.intervalDays).toBe(1)
    expect(next.easeFactor).toBeCloseTo(2.3)
  })

  it('uses a 3-day interval for the second consecutive Good', () => {
    const next = scheduleReview(
      state({ state: 'review', repetitions: 1, intervalDays: 1 }),
      'good',
      now,
    )

    expect(next.intervalDays).toBe(3)
    expect(next.repetitions).toBe(2)
  })

  it('multiplies interval by ease factor from the third consecutive Good onward', () => {
    const next = scheduleReview(
      state({ state: 'review', repetitions: 2, intervalDays: 3, easeFactor: 2.5 }),
      'good',
      now,
    )

    expect(next.intervalDays).toBe(8) // round(3 * 2.5)
    expect(next.easeFactor).toBe(2.5) // unchanged on Good
  })

  it('multiplies interval by ease * 1.3 and adds an ease bonus on a mature Easy', () => {
    const next = scheduleReview(
      state({ state: 'review', repetitions: 2, intervalDays: 3, easeFactor: 2.5 }),
      'easy',
      now,
    )

    expect(next.intervalDays).toBe(10) // round(3 * 2.5 * 1.3)
    expect(next.easeFactor).toBeCloseTo(2.65)
  })

  it('lapses a mature card on Again: relearning, lapses += 1, ease penalty, reset interval', () => {
    const next = scheduleReview(
      state({ state: 'review', repetitions: 5, intervalDays: 30, easeFactor: 2.5, lapses: 1 }),
      'again',
      now,
    )

    expect(next.state).toBe('relearning')
    expect(next.repetitions).toBe(0)
    expect(next.lapses).toBe(2)
    expect(next.easeFactor).toBeCloseTo(2.3)
    expect(next.intervalDays).toBe(1)
  })

  it('floors the ease factor at 1.3 and never goes lower', () => {
    const next = scheduleReview(state({ state: 'review', easeFactor: 1.4 }), 'again', now)

    expect(next.easeFactor).toBe(1.3)
  })

  it('keeps relearning a card that fails again while already relearning', () => {
    const next = scheduleReview(state({ state: 'relearning', lapses: 1 }), 'again', now)

    expect(next.state).toBe('relearning')
    expect(next.lapses).toBe(2)
  })

  it('is pure: does not mutate the input state', () => {
    const input = state({ state: 'review', repetitions: 2, intervalDays: 3 })
    const snapshot = { ...input }

    scheduleReview(input, 'good', now)

    expect(input).toEqual(snapshot)
  })
})

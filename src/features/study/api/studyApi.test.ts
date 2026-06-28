import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '@/test/createSupabaseMock'
import { supabase } from '@/lib/supabaseClient'
import type { CardReviewState } from '@/domain/srs/types'
import { studyApi } from './studyApi'

vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: vi.fn() } }))

let mock: ReturnType<typeof createSupabaseMock>

beforeEach(() => {
  mock = createSupabaseMock()
  // eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/no-unnecessary-type-assertion -- tsc requires both casts here even though the linter's type info disagrees
  vi.mocked(supabase.from).mockImplementation(mock.client.from as unknown as typeof supabase.from)
})

const PAST = '2020-01-01T00:00:00.000Z'
const FUTURE = '2099-01-01T00:00:00.000Z'

function reviewState(overrides: Partial<CardReviewState> = {}): CardReviewState {
  return {
    cardId: 'card-1',
    state: 'new',
    dueAt: PAST,
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    lastReviewedAt: null,
    ...overrides,
  }
}

function seed() {
  mock.reset({
    decks: [
      { id: 'deck-1', language: 'en' },
      { id: 'deck-2', language: 'pt' },
    ],
    cards: [
      { id: 'card-1', deck_id: 'deck-1', front: 'a', back: 'A' },
      { id: 'card-2', deck_id: 'deck-1', front: 'b', back: 'B' },
      { id: 'card-3', deck_id: 'deck-2', front: 'c', back: 'C' },
    ],
    card_review_state: [
      {
        card_id: 'card-1',
        due_at: PAST,
        state: 'new',
        interval_days: 0,
        ease_factor: 2.5,
        repetitions: 0,
        lapses: 0,
        last_reviewed_at: null,
      },
      {
        card_id: 'card-2',
        due_at: FUTURE,
        state: 'review',
        interval_days: 10,
        ease_factor: 2.5,
        repetitions: 3,
        lapses: 0,
        last_reviewed_at: null,
      },
      {
        card_id: 'card-3',
        due_at: PAST,
        state: 'new',
        interval_days: 0,
        ease_factor: 2.5,
        repetitions: 0,
        lapses: 0,
        last_reviewed_at: null,
      },
    ],
  })
}

describe('studyApi.listDue', () => {
  it('returns only cards whose due_at has passed, across all decks', async () => {
    seed()
    const due = await studyApi.listDue()

    expect(due.map((card) => card.id).sort()).toEqual(['card-1', 'card-3'])
    expect(due.find((card) => card.id === 'card-1')?.review.state).toBe('new')
    expect(due.find((card) => card.id === 'card-1')?.language).toBe('en')
    expect(due.find((card) => card.id === 'card-3')?.language).toBe('pt')
  })

  it('scopes to a single deck when deckId is given', async () => {
    seed()
    const due = await studyApi.listDue('deck-1')

    expect(due.map((card) => card.id)).toEqual(['card-1'])
  })

  it('returns an empty array for a deck with no cards', async () => {
    seed()
    const due = await studyApi.listDue('deck-missing')

    expect(due).toEqual([])
  })

  it('returns an empty array when nothing is due', async () => {
    mock.reset({
      cards: [{ id: 'card-1', deck_id: 'deck-1', front: 'a', back: 'A' }],
      card_review_state: [{ card_id: 'card-1', due_at: FUTURE, state: 'review' }],
    })

    expect(await studyApi.listDue()).toEqual([])
  })
})

describe('studyApi.countDue', () => {
  it('counts due cards globally and per deck', async () => {
    seed()

    expect(await studyApi.countDue()).toBe(2)
    expect(await studyApi.countDue('deck-1')).toBe(1)
    expect(await studyApi.countDue('deck-2')).toBe(1)
  })
})

describe('studyApi.nextDueAt', () => {
  it('returns the earliest due_at in scope', async () => {
    mock.reset({
      cards: [
        { id: 'card-1', deck_id: 'deck-1', front: 'a', back: 'A' },
        { id: 'card-2', deck_id: 'deck-1', front: 'b', back: 'B' },
      ],
      card_review_state: [
        { card_id: 'card-1', due_at: '2030-06-01T00:00:00.000Z', state: 'review' },
        { card_id: 'card-2', due_at: '2030-01-01T00:00:00.000Z', state: 'review' },
      ],
    })

    expect(await studyApi.nextDueAt()).toBe('2030-01-01T00:00:00.000Z')
  })

  it('returns null when the deck has no cards', async () => {
    seed()
    expect(await studyApi.nextDueAt('deck-missing')).toBeNull()
  })
})

describe('studyApi.submitReview', () => {
  it('updates the review state and appends a review log entry', async () => {
    seed()
    const previous = reviewState({ cardId: 'card-1', intervalDays: 0 })
    const next = reviewState({
      cardId: 'card-1',
      state: 'review',
      intervalDays: 1,
      repetitions: 1,
      dueAt: FUTURE,
      lastReviewedAt: '2026-06-28T12:00:00.000Z',
    })

    await studyApi.submitReview('good', previous, next)

    const [reviewRow] = mock.getTable('card_review_state').filter((row) => row.card_id === 'card-1')
    expect(reviewRow?.state).toBe('review')
    expect(reviewRow?.due_at).toBe(FUTURE)
    expect(reviewRow?.repetitions).toBe(1)

    const [logRow] = mock.getTable('review_logs')
    expect(logRow).toMatchObject({
      card_id: 'card-1',
      rating: 'good',
      interval_before: 0,
      interval_after: 1,
    })
  })
})

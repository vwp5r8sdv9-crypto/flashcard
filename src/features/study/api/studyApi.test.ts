import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '@/test/createSupabaseMock'
import { supabase } from '@/lib/supabaseClient'
import type { CardStudyState } from '@/domain/study/types'
import { studyApi } from './studyApi'

vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: vi.fn() } }))

let mock: ReturnType<typeof createSupabaseMock>

beforeEach(() => {
  mock = createSupabaseMock()
  // eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/no-unnecessary-type-assertion -- tsc requires both casts here even though the linter's type info disagrees
  vi.mocked(supabase.from).mockImplementation(mock.client.from as unknown as typeof supabase.from)
})

function studyState(overrides: Partial<CardStudyState> = {}): CardStudyState {
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
    card_study_state: [
      {
        card_id: 'card-1',
        weight: 5,
        times_seen: 0,
        times_again: 0,
        times_good: 0,
        times_easy: 0,
        last_studied_at: null,
      },
      {
        card_id: 'card-2',
        weight: 8,
        times_seen: 3,
        times_again: 2,
        times_good: 1,
        times_easy: 0,
        last_studied_at: null,
      },
      {
        card_id: 'card-3',
        weight: 1,
        times_seen: 5,
        times_again: 0,
        times_good: 1,
        times_easy: 4,
        last_studied_at: null,
      },
    ],
  })
}

describe('studyApi.listCards', () => {
  it('returns every card across all decks, each carrying its study state and deck language', async () => {
    seed()
    const cards = await studyApi.listCards()

    expect(cards.map((card) => card.id).sort()).toEqual(['card-1', 'card-2', 'card-3'])
    expect(cards.find((card) => card.id === 'card-1')?.studyState.weight).toBe(5)
    expect(cards.find((card) => card.id === 'card-2')?.studyState.weight).toBe(8)
    expect(cards.find((card) => card.id === 'card-1')?.language).toBe('en')
    expect(cards.find((card) => card.id === 'card-3')?.language).toBe('pt')
  })

  it('scopes to a single deck when deckId is given', async () => {
    seed()
    const cards = await studyApi.listCards('deck-1')

    expect(cards.map((card) => card.id).sort()).toEqual(['card-1', 'card-2'])
  })

  it('returns an empty array for a deck with no cards', async () => {
    seed()
    const cards = await studyApi.listCards('deck-missing')

    expect(cards).toEqual([])
  })

  it('returns an empty array when the user has no cards at all', async () => {
    mock.reset({})
    expect(await studyApi.listCards()).toEqual([])
  })
})

describe('studyApi.submitRating', () => {
  it('persists the updated weight and counters for that card', async () => {
    seed()
    const next = studyState({
      cardId: 'card-1',
      weight: 7,
      timesSeen: 1,
      timesAgain: 1,
      lastStudiedAt: '2026-06-28T12:00:00.000Z',
    })

    await studyApi.submitRating(next)

    const [row] = mock.getTable('card_study_state').filter((row) => row.card_id === 'card-1')
    expect(row?.weight).toBe(7)
    expect(row?.times_seen).toBe(1)
    expect(row?.times_again).toBe(1)
    expect(row?.last_studied_at).toBe('2026-06-28T12:00:00.000Z')
  })
})

import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database'
import type { CardReviewPhase, CardReviewRating, CardReviewState } from '@/domain/srs/types'
import type { LanguageCode } from '@/lib/languages'
import { mapCardRow } from '@/features/cards/api/cardsApi'
import type { DueCard } from '../types'

type ReviewStateRow = Database['public']['Tables']['card_review_state']['Row']

/**
 * Deliberately a few plain queries rather than a single PostgREST
 * embedded-resource join (`card_review_state.select('*, cards!inner(*)')`):
 * simpler to read, and keeps every query mockable with the same minimal
 * fake used by decksApi/cardsApi (see src/test/createSupabaseMock.ts).
 */
export interface StudyRepository {
  listDue(deckId?: string): Promise<DueCard[]>
  countDue(deckId?: string): Promise<number>
  /** Earliest upcoming `due_at` in scope — used for the "nothing due right now" empty state. */
  nextDueAt(deckId?: string): Promise<string | null>
  submitReview(
    rating: CardReviewRating,
    previous: CardReviewState,
    next: CardReviewState,
  ): Promise<void>
}

function mapReviewStateRow(row: ReviewStateRow): CardReviewState {
  return {
    cardId: row.card_id,
    state: row.state as CardReviewPhase,
    dueAt: row.due_at,
    intervalDays: row.interval_days,
    easeFactor: row.ease_factor,
    repetitions: row.repetitions,
    lapses: row.lapses,
    lastReviewedAt: row.last_reviewed_at,
  }
}

/** Resolves the card ids to scope to when `deckId` is given; `undefined` means "every card the user owns." */
async function cardIdsForDeck(deckId: string | undefined): Promise<string[] | undefined> {
  if (!deckId) return undefined
  const { data, error } = await supabase.from('cards').select('id').eq('deck_id', deckId)
  if (error) throw error
  return data.map((row) => row.id)
}

export const studyApi: StudyRepository = {
  async listDue(deckId) {
    const cardIds = await cardIdsForDeck(deckId)
    if (cardIds?.length === 0) return []

    let reviewQuery = supabase
      .from('card_review_state')
      .select('*')
      .lte('due_at', new Date().toISOString())
    if (cardIds) reviewQuery = reviewQuery.in('card_id', cardIds)
    const { data: reviewRows, error: reviewError } = await reviewQuery
    if (reviewError) throw reviewError
    if (reviewRows.length === 0) return []

    const dueCardIds = reviewRows.map((row) => row.card_id)
    const { data: cardRows, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .in('id', dueCardIds)
    if (cardsError) throw cardsError

    // The due queue can span decks of different languages (the global "all
    // due" view), so each card carries its own deck's language rather than
    // the caller having to look it up separately — see DueCard.
    const deckIds = [...new Set(cardRows.map((row) => row.deck_id))]
    const { data: deckRows, error: decksError } = await supabase
      .from('decks')
      .select('id, language')
      .in('id', deckIds)
    if (decksError) throw decksError
    const languageByDeckId = new Map(deckRows.map((row) => [row.id, row.language as LanguageCode]))

    const cardsById = new Map(cardRows.map((row) => [row.id, mapCardRow(row)]))
    return reviewRows.flatMap((row) => {
      const card = cardsById.get(row.card_id)
      if (!card) return []
      const language = languageByDeckId.get(card.deckId)
      if (!language) return []
      return [{ ...card, language, review: mapReviewStateRow(row) }]
    })
  },

  async countDue(deckId) {
    const cardIds = await cardIdsForDeck(deckId)
    if (cardIds?.length === 0) return 0

    let query = supabase
      .from('card_review_state')
      .select('*', { count: 'exact', head: true })
      .lte('due_at', new Date().toISOString())
    if (cardIds) query = query.in('card_id', cardIds)
    const { count, error } = await query
    if (error) throw error
    return count ?? 0
  },

  async nextDueAt(deckId) {
    const cardIds = await cardIdsForDeck(deckId)
    if (cardIds?.length === 0) return null

    let query = supabase
      .from('card_review_state')
      .select('due_at')
      .order('due_at', { ascending: true })
      .limit(1)
    if (cardIds) query = query.in('card_id', cardIds)
    const { data, error } = await query
    if (error) throw error
    return data[0]?.due_at ?? null
  },

  async submitReview(rating, previous, next) {
    const { error: updateError } = await supabase
      .from('card_review_state')
      .update({
        state: next.state,
        due_at: next.dueAt,
        interval_days: next.intervalDays,
        ease_factor: next.easeFactor,
        repetitions: next.repetitions,
        lapses: next.lapses,
        last_reviewed_at: next.lastReviewedAt,
      })
      .eq('card_id', next.cardId)
    if (updateError) throw updateError

    const { error: logError } = await supabase.from('review_logs').insert({
      card_id: next.cardId,
      rating,
      interval_before: previous.intervalDays,
      interval_after: next.intervalDays,
    })
    if (logError) throw logError
  },
}

import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database'
import type { CardStudyState } from '@/domain/study/types'
import type { LanguageCode } from '@/lib/languages'
import { mapCardRow } from '@/features/cards/api/cardsApi'
import type { StudyCard } from '../types'

type StudyStateRow = Database['public']['Tables']['card_study_state']['Row']

/**
 * Deliberately a few plain queries rather than a single PostgREST
 * embedded-resource join: simpler to read, and keeps every query mockable
 * with the same minimal fake used by decksApi/cardsApi (see
 * src/test/createSupabaseMock.ts). There's no due-date filter anywhere
 * here — every card in scope is always a candidate; see ADR-0026.
 */
export interface StudyRepository {
  /** Every card in scope (a deck, or every deck the user owns when omitted) plus its study state. */
  listCards(deckId?: string): Promise<StudyCard[]>
  submitRating(next: CardStudyState): Promise<void>
}

function mapStudyStateRow(row: StudyStateRow): CardStudyState {
  return {
    cardId: row.card_id,
    weight: row.weight,
    timesSeen: row.times_seen,
    timesAgain: row.times_again,
    timesGood: row.times_good,
    timesEasy: row.times_easy,
    lastStudiedAt: row.last_studied_at,
  }
}

export const studyApi: StudyRepository = {
  async listCards(deckId) {
    let cardQuery = supabase.from('cards').select('*')
    if (deckId) cardQuery = cardQuery.eq('deck_id', deckId)
    const { data: cardRows, error: cardsError } = await cardQuery
    if (cardsError) throw cardsError
    if (cardRows.length === 0) return []

    const cardIds = cardRows.map((row) => row.id)
    const { data: stateRows, error: stateError } = await supabase
      .from('card_study_state')
      .select('*')
      .in('card_id', cardIds)
    if (stateError) throw stateError
    const stateByCardId = new Map(stateRows.map((row) => [row.card_id, mapStudyStateRow(row)]))

    // The pool can span decks of different languages (the global "all
    // decks" session), so each card carries its own deck's language rather
    // than the caller having to look it up separately — see StudyCard.
    const deckIds = [...new Set(cardRows.map((row) => row.deck_id))]
    const { data: deckRows, error: decksError } = await supabase
      .from('decks')
      .select('id, language')
      .in('id', deckIds)
    if (decksError) throw decksError
    const languageByDeckId = new Map(deckRows.map((row) => [row.id, row.language as LanguageCode]))

    return cardRows.flatMap((row) => {
      const studyState = stateByCardId.get(row.id)
      const language = languageByDeckId.get(row.deck_id)
      if (!studyState || !language) return []
      return [{ ...mapCardRow(row), language, studyState }]
    })
  },

  async submitRating(next) {
    const { error } = await supabase
      .from('card_study_state')
      .update({
        weight: next.weight,
        times_seen: next.timesSeen,
        times_again: next.timesAgain,
        times_good: next.timesGood,
        times_easy: next.timesEasy,
        last_studied_at: next.lastStudiedAt,
      })
      .eq('card_id', next.cardId)
    if (error) throw error
  },
}

import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database'
import type { Card, CreateCardInput, UpdateCardInput } from '../types'

type CardRow = Database['public']['Tables']['cards']['Row']

/**
 * Same contract as before the Supabase migration (ADR-0020) — `removeByDeck`
 * is kept even though `cards.deck_id` now has `on delete cascade` in
 * Postgres (so deleting a deck already removes its cards without this
 * being called — see useDeleteDeck), because "clear every card in a deck
 * without deleting the deck itself" is still a meaningful, separate
 * operation for a repository to expose.
 */
export interface CardsRepository {
  listByDeck(deckId: string): Promise<Card[]>
  countByDeck(deckId: string): Promise<number>
  countAll(): Promise<number>
  getById(id: string): Promise<Card | null>
  create(input: CreateCardInput): Promise<Card>
  update(id: string, input: UpdateCardInput): Promise<Card>
  remove(id: string): Promise<void>
  removeByDeck(deckId: string): Promise<void>
}

/** Exported for reuse by other repositories that read `cards` rows directly (e.g. studyApi). */
export function mapCardRow(row: CardRow): Card {
  return {
    id: row.id,
    deckId: row.deck_id,
    front: row.front,
    back: row.back,
    pronunciation: row.pronunciation,
    notes: row.notes,
    exampleSentence: row.example_sentence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const cardsApi: CardsRepository = {
  async listByDeck(deckId) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data.map(mapCardRow)
  },

  async countByDeck(deckId) {
    const { count, error } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('deck_id', deckId)
    if (error) throw error
    return count ?? 0
  },

  async countAll() {
    const { count, error } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    return count ?? 0
  },

  async getById(id) {
    const { data, error } = await supabase.from('cards').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapCardRow(data) : null
  },

  async create(input) {
    const { data, error } = await supabase
      .from('cards')
      .insert({
        deck_id: input.deckId,
        front: input.front,
        back: input.back,
        pronunciation: input.pronunciation,
        notes: input.notes,
        example_sentence: input.exampleSentence,
      })
      .select()
      .single()
    if (error) throw error
    return mapCardRow(data)
  },

  async update(id, input) {
    const patch: Database['public']['Tables']['cards']['Update'] = {}
    if (input.front !== undefined) patch.front = input.front
    if (input.back !== undefined) patch.back = input.back
    if (input.pronunciation !== undefined) patch.pronunciation = input.pronunciation
    if (input.notes !== undefined) patch.notes = input.notes
    if (input.exampleSentence !== undefined) patch.example_sentence = input.exampleSentence

    const { data, error } = await supabase
      .from('cards')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapCardRow(data)
  },

  async remove(id) {
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) throw error
  },

  async removeByDeck(deckId) {
    const { error } = await supabase.from('cards').delete().eq('deck_id', deckId)
    if (error) throw error
  },
}

import type { CreateDeckInput, Deck, UpdateDeckInput } from '../types'

const STORAGE_KEY = 'flashcards:decks'

/**
 * The contract any deck storage backend must satisfy. `decksApi` below is
 * the only implementation today (localStorage); a future Supabase-backed
 * implementation satisfies the same interface, so nothing outside this file
 * needs to change — see docs/adr/0015-interim-localstorage-persistence.md.
 */
export interface DecksRepository {
  list(): Promise<Deck[]>
  getById(id: string): Promise<Deck | null>
  create(input: CreateDeckInput): Promise<Deck>
  update(id: string, input: UpdateDeckInput): Promise<Deck>
  remove(id: string): Promise<void>
}

function readDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Deck[]) : []
  } catch {
    return []
  }
}

function writeDecks(decks: Deck[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
}

// localStorage access is synchronous; methods still return Promises (via
// Promise.resolve rather than `async`, which would trip require-await) so
// the public interface already matches the eventual async Supabase calls.
export const decksApi: DecksRepository = {
  list() {
    return Promise.resolve(readDecks())
  },

  getById(id) {
    return Promise.resolve(readDecks().find((deck) => deck.id === id) ?? null)
  },

  create(input) {
    const now = new Date().toISOString()
    const deck: Deck = {
      id: crypto.randomUUID(),
      name: input.name,
      language: input.language,
      color: input.color,
      createdAt: now,
      updatedAt: now,
    }
    const decks = readDecks()
    decks.push(deck)
    writeDecks(decks)
    return Promise.resolve(deck)
  },

  update(id, input) {
    const decks = readDecks()
    const index = decks.findIndex((deck) => deck.id === id)
    const existing = decks[index]
    if (index === -1 || !existing) {
      return Promise.reject(new Error(`Deck ${id} not found`))
    }
    const updated: Deck = { ...existing, ...input, updatedAt: new Date().toISOString() }
    decks[index] = updated
    writeDecks(decks)
    return Promise.resolve(updated)
  },

  remove(id) {
    writeDecks(readDecks().filter((deck) => deck.id !== id))
    return Promise.resolve()
  },
}

const STORAGE_KEY = 'flashcards:lastOpenedDeckId'

/** Remembers which deck's study screen was last opened, so `/` can jump straight back into it. */
export function getLastOpenedDeckId(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setLastOpenedDeckId(deckId: string): void {
  localStorage.setItem(STORAGE_KEY, deckId)
}

export function clearLastOpenedDeckId(deckId: string): void {
  if (localStorage.getItem(STORAGE_KEY) === deckId) {
    localStorage.removeItem(STORAGE_KEY)
  }
}

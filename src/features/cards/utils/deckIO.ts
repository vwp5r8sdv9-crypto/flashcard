import type { Card } from '../types'

export interface DeckExportCard {
  front: string
  back: string
  pronunciation: string | null
  exampleSentence: string | null
  notes: string | null
}

interface DeckExportFile {
  version: 1
  exportedAt: string
  cards: DeckExportCard[]
}

export function exportDeckToJson(cards: Card[]): string {
  const data: DeckExportFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    cards: cards.map(({ front, back, pronunciation, exampleSentence, notes }) => ({
      front,
      back,
      pronunciation,
      exampleSentence,
      notes,
    })),
  }
  return JSON.stringify(data, null, 2)
}

export function downloadJson(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function parseDeckImport(json: string): DeckExportCard[] | null {
  try {
    const raw: unknown = JSON.parse(json)
    let items: unknown[]

    if (Array.isArray(raw)) {
      items = raw
    } else if (typeof raw === 'object' && raw !== null) {
      const obj = raw as Record<string, unknown>
      const cards = obj.cards
      if (Array.isArray(cards)) {
        items = cards
      } else {
        return null
      }
    } else {
      return null
    }

    return items
      .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
      .map((c) => ({
        front: typeof c.front === 'string' ? c.front.trim() : '',
        back: typeof c.back === 'string' ? c.back.trim() : '',
        pronunciation: typeof c.pronunciation === 'string' ? c.pronunciation.trim() || null : null,
        exampleSentence:
          typeof c.exampleSentence === 'string' ? c.exampleSentence.trim() || null : null,
        notes: typeof c.notes === 'string' ? c.notes.trim() || null : null,
      }))
      .filter((c) => c.front.length > 0 && c.back.length > 0)
  } catch {
    return null
  }
}

export function deduplicateImport(toImport: DeckExportCard[], existing: Card[]): DeckExportCard[] {
  const existingFronts = new Set(existing.map((c) => c.front.trim().toLowerCase()))
  return toImport.filter((c) => !existingFronts.has(c.front.toLowerCase()))
}

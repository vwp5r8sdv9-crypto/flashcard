export type DeckColorKey =
  | 'slate'
  | 'blueGray'
  | 'sage'
  | 'olive'
  | 'indigo'
  | 'amber'
  | 'rose'
  | 'teal'

export interface DeckColorOption {
  /** Stable identifier used as an i18n key suffix (decks.colorNames.<key>) — not displayed directly. */
  key: DeckColorKey
  value: string
}

// A muted, modern palette (no neon/high-saturation tones) — each color reads
// clearly as a small swatch dot in both light and dark mode.
export const DECK_COLOR_OPTIONS: DeckColorOption[] = [
  { key: 'slate', value: '#64748b' },
  { key: 'blueGray', value: '#4f7396' },
  { key: 'sage', value: '#7c9473' },
  { key: 'olive', value: '#8c8049' },
  { key: 'indigo', value: '#6c70b8' },
  { key: 'amber', value: '#bc8a46' },
  { key: 'rose', value: '#be8488' },
  { key: 'teal', value: '#3f8480' },
]

export const DECK_COLORS = DECK_COLOR_OPTIONS.map((option) => option.value)

export const DEFAULT_DECK_COLOR = DECK_COLORS[0] ?? '#64748b'

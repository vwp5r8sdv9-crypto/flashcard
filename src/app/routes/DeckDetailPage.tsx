import { Link, useParams } from 'react-router-dom'
import { Card } from '@/components/Card'
import { useDeck } from '@/features/decks/hooks/useDeck'

/**
 * Deck detail screen. Cards aren't built yet (see docs/13-roadmap.md
 * Phase 1) — this proves navigation from a deck card works and gives the
 * cards feature a real place to land later.
 */
export function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const { data: deck, isLoading } = useDeck(deckId)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground">Deck not found.</p>
        <Link to="/" className="text-primary underline">
          Back to your decks
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link to="/" className="text-sm text-muted-foreground hover:underline">
        ← Your decks
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <span
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: deck.color }}
          aria-hidden
        />
        <h1 className="text-2xl font-semibold">{deck.name}</h1>
      </div>
      {deck.language && <p className="mt-1 text-muted-foreground">{deck.language}</p>}
      <Card className="mt-6 flex min-h-48 items-center justify-center border-dashed text-muted-foreground">
        Cards will appear here.
      </Card>
    </div>
  )
}

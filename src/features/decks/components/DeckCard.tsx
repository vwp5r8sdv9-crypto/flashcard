import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/Card'
import type { Deck } from '../types'

interface DeckCardProps {
  deck: Deck
  onEdit: () => void
  onDelete: () => void
}

export function DeckCard({ deck, onEdit, onDelete }: DeckCardProps) {
  const navigate = useNavigate()

  function goToDetail() {
    void navigate(`/decks/${deck.id}`)
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter') goToDetail()
      }}
      className="cursor-pointer transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: deck.color }}
          aria-hidden
        />
        <div className="flex gap-3 text-sm text-muted-foreground">
          <button
            type="button"
            aria-label={`Edit ${deck.name}`}
            onClick={(event) => {
              event.stopPropagation()
              onEdit()
            }}
            className="hover:text-foreground"
          >
            Edit
          </button>
          <button
            type="button"
            aria-label={`Delete ${deck.name}`}
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            className="hover:text-destructive"
          >
            Delete
          </button>
        </div>
      </div>
      <h3 className="mt-3 font-medium">{deck.name}</h3>
      {deck.language && <p className="text-sm text-muted-foreground">{deck.language}</p>}
    </Card>
  )
}

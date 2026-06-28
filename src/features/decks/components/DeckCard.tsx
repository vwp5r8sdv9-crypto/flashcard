import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { IconButton } from '@/components/IconButton'
import { getLanguageMeta } from '@/lib/languages'
import { useCardCount } from '@/features/cards/hooks/useCardCount'
import { useDueCount } from '@/features/study/hooks/useDueCount'
import type { Deck } from '../types'

interface DeckCardProps {
  deck: Deck
  onEdit: () => void
  onDelete: () => void
}

export function DeckCard({ deck, onEdit, onDelete }: DeckCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: cardCount } = useCardCount(deck.id)
  const { data: dueCount } = useDueCount(deck.id)
  const language = getLanguageMeta(deck.language)

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
        <div className="flex gap-1 text-muted-foreground">
          <IconButton
            icon={Pencil}
            label={`${t('common.edit')}: ${deck.name}`}
            onClick={(event) => {
              event.stopPropagation()
              onEdit()
            }}
          />
          <IconButton
            icon={Trash2}
            label={`${t('common.delete')}: ${deck.name}`}
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            variant="destructive"
          />
        </div>
      </div>
      <h3 className="mt-3 font-medium break-words [overflow-wrap:anywhere]">{deck.name}</h3>
      <p className="text-sm text-muted-foreground">
        {language.flag} {t(`languages.${deck.language}`)}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {t('decks.cardCount', { count: cardCount ?? 0 })} ·{' '}
        {t('study.dueCount', { count: dueCount ?? 0 })}
      </p>
    </Card>
  )
}

import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { IconButton } from '@/components/IconButton'
import { getLanguageMeta } from '@/lib/languages'
import { useCardCount } from '@/features/cards/hooks/useCardCount'
import type { Deck } from '../types'

interface DeckCardProps {
  deck: Deck
  onEdit: () => void
  onDelete: () => void
}

/**
 * The deck's chosen color is used as a muted accent, not a saturated block —
 * only the small dot below uses the actual color. The card surface mixes a
 * small percentage of it into the existing card/border/shadow tokens via
 * `--deck-color` + color-mix(), set as a CSS variable (not inline
 * background/border/shadow directly) so the existing hover:shadow utility
 * still works — inline style would override it unconditionally and silently
 * kill the hover transition.
 */
export function DeckCard({ deck, onEdit, onDelete }: DeckCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: cardCount } = useCardCount(deck.id)
  const language = getLanguageMeta(deck.language)

  function openStudy() {
    void navigate(`/decks/${deck.id}`)
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={openStudy}
      onKeyDown={(event) => {
        if (event.key === 'Enter') openStudy()
      }}
      style={{ '--deck-color': deck.color } as CSSProperties}
      className="cursor-pointer border-[color-mix(in_srgb,var(--deck-color)_22%,var(--border))] bg-[color-mix(in_srgb,var(--deck-color)_8%,var(--card))] shadow-[0_10px_26px_color-mix(in_srgb,var(--deck-color)_12%,var(--shadow))] transition-shadow hover:shadow-[0_10px_30px_color-mix(in_srgb,var(--deck-color)_18%,var(--shadow))]"
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
      <h3 className="mt-4 text-lg font-semibold break-words [overflow-wrap:anywhere]">
        {deck.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {language.flag} {t(`languages.${deck.language}`)}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        {t('decks.cardCount', { count: cardCount ?? 0 })}
      </p>
    </Card>
  )
}

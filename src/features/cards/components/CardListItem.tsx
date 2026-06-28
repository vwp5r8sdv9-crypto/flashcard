import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/IconButton'
import { SpeakButton } from '@/components/SpeakButton'
import type { LanguageCode } from '@/lib/languages'
import type { Card } from '../types'

interface CardListItemProps {
  card: Card
  language: LanguageCode
  onEdit: () => void
  onDelete: () => void
}

export function CardListItem({ card, language, onEdit, onDelete }: CardListItemProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5 transition-colors hover:bg-card-soft">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{card.front}</p>
        <p className="truncate text-sm text-muted-foreground">{card.back}</p>
      </div>
      <div className="flex shrink-0 gap-1 text-muted-foreground">
        <SpeakButton text={card.front} lang={language} />
        <IconButton icon={Pencil} label={`${t('common.edit')}: ${card.front}`} onClick={onEdit} />
        <IconButton
          icon={Trash2}
          label={`${t('common.delete')}: ${card.front}`}
          onClick={onDelete}
          variant="destructive"
        />
      </div>
    </div>
  )
}

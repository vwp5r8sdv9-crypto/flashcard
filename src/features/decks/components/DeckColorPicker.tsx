import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { DECK_COLOR_OPTIONS } from './deckColors'

interface DeckColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function DeckColorPicker({ value, onChange }: DeckColorPickerProps) {
  const { t } = useTranslation()

  return (
    <div>
      <span className="text-sm font-medium">{t('decks.color')}</span>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {DECK_COLOR_OPTIONS.map(({ key, value: color }) => (
          <button
            key={color}
            type="button"
            aria-label={t('decks.selectColor', { color: t(`decks.colorNames.${key}`) })}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
            className={cn(
              'h-8 w-8 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              value === color && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )
}

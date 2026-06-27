import { cn } from '@/lib/utils'
import { DECK_COLORS } from './deckColors'

interface DeckColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function DeckColorPicker({ value, onChange }: DeckColorPickerProps) {
  return (
    <div>
      <span className="text-sm font-medium">Color</span>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {DECK_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Select color ${color}`}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
            className={cn(
              'h-8 w-8 rounded-full transition-transform hover:scale-105',
              value === color && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )
}

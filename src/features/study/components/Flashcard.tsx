import { SpeakButton } from '@/components/SpeakButton'
import { cn } from '@/lib/utils'
import type { StudyCard } from '../types'

interface FlashcardProps {
  card: StudyCard
  revealed: boolean
  onReveal: () => void
}

/**
 * 3D flip card — fills its parent container. The card surface stays neutral
 * (warm white); the deck color appears only as a thin 3px bar at the top of
 * each face, like an index tab on a physical notebook. The "Show Answer" and
 * rating buttons live in StudySession, not here.
 */
export function Flashcard({ card, revealed, onReveal }: FlashcardProps) {
  return (
    <div className="h-full [perspective:1200px]">
      <div
        role="button"
        tabIndex={0}
        onClick={onReveal}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onReveal()
          }
        }}
        className={cn(
          'relative h-full w-full cursor-pointer transition-transform duration-300 [transform-style:preserve-3d]',
          revealed && '[transform:rotateY(180deg)]',
        )}
      >
        {/* Front face */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-[28px] border border-border bg-card p-8 text-center shadow-sm [backface-visibility:hidden]">
          {/* Thin deck-color accent bar — the only color from the deck on the card */}
          <div
            className="absolute inset-x-0 top-0 h-[3px] rounded-t-[28px]"
            style={{ backgroundColor: 'var(--deck-color, transparent)' }}
            aria-hidden
          />
          <p className="text-display-2 max-w-full break-words [overflow-wrap:anywhere]">
            {card.front}
          </p>
          <div
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <SpeakButton text={card.front} lang={card.language} />
          </div>
        </div>

        {/* Back face */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-[28px] border border-border bg-card p-8 text-center shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div
            className="absolute inset-x-0 top-0 h-[3px] rounded-t-[28px]"
            style={{ backgroundColor: 'var(--deck-color, transparent)' }}
            aria-hidden
          />
          <p className="text-display-2 max-w-full break-words [overflow-wrap:anywhere]">
            {card.back}
          </p>
          {card.pronunciation && (
            <p className="max-w-full break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
              {card.pronunciation}
            </p>
          )}
          {card.exampleSentence && (
            <p className="max-w-full break-words text-base italic text-muted-foreground [overflow-wrap:anywhere]">
              {card.exampleSentence}
            </p>
          )}
          {card.notes && (
            <p className="max-w-full break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
              {card.notes}
            </p>
          )}
          <div
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <SpeakButton text={card.back} lang={card.language} />
          </div>
        </div>
      </div>
    </div>
  )
}

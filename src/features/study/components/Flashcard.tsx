import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { SpeakButton } from '@/components/SpeakButton'
import { cn } from '@/lib/utils'
import type { DueCard } from '../types'

interface FlashcardProps {
  card: DueCard
  revealed: boolean
  onReveal: () => void
}

/** 3D flip card: front/back are two stacked faces rotated via CSS, not separately mounted/unmounted. */
export function Flashcard({ card, revealed, onReveal }: FlashcardProps) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="[perspective:1200px]">
        <div
          className={cn(
            'relative h-72 w-full transition-transform duration-300 [transform-style:preserve-3d]',
            revealed && '[transform:rotateY(180deg)]',
          )}
        >
          <Card className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center [backface-visibility:hidden]">
            <p className="text-display-2 max-w-full break-words [overflow-wrap:anywhere]">
              {card.front}
            </p>
            <SpeakButton text={card.front} lang={card.language} />
          </Card>
          <Card className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-display-2 max-w-full break-words [overflow-wrap:anywhere]">
              {card.back}
            </p>
            <SpeakButton text={card.back} lang={card.language} />
          </Card>
        </div>
      </div>

      {!revealed && (
        <Button onClick={onReveal} className="mt-6 w-full">
          {t('study.showAnswer')}
        </Button>
      )}
    </div>
  )
}

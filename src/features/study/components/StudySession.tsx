import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { applyRating } from '@/domain/study/applyRating'
import { getNextCard } from '@/domain/study/getNextCard'
import type { StudyRating } from '@/domain/study/types'
import { useStudyCards } from '../hooks/useStudyCards'
import { useSubmitRating } from '../hooks/useSubmitRating'
import type { StudyCard } from '../types'
import { Flashcard } from './Flashcard'

interface StudySessionProps {
  /** Omitted for the global "study everything" session. */
  deckId?: string
  /** Called when the user taps "Add first card" — lets the parent switch tabs instead of opening a dialog. */
  onAddCard?: () => void
}

/**
 * Continuous study session — fills its parent container. The parent is
 * responsible for giving this component a meaningful height (flex-1, h-full, etc.).
 * See ADR-0026 for the weighted-random algorithm.
 */
export function StudySession({ deckId, onAddCard }: StudySessionProps) {
  const { t } = useTranslation()
  const { data: cards, isLoading } = useStudyCards(deckId)
  const submitRating = useSubmitRating()

  const [revealed, setRevealed] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [currentCard, setCurrentCard] = useState<StudyCard | null>(null)
  const [cardsSnapshot, setCardsSnapshot] = useState(cards)

  // Picks an initial card once the pool loads — React's documented "adjust
  // state during render" pattern avoids firing this in an effect.
  if (cards !== cardsSnapshot) {
    setCardsSnapshot(cards)
    if (cards && cards.length > 0 && !currentCard) {
      setCurrentCard(getNextCard(cards, history))
    }
  }

  function reveal() {
    setRevealed(true)
  }

  function rate(rating: StudyRating) {
    if (!currentCard || !cards) return
    const next = applyRating(currentCard.studyState, rating, new Date())
    submitRating.mutate({ next, deckId })

    const updatedCards = cards.map((card) =>
      card.id === currentCard.id ? { ...card, studyState: next } : card,
    )
    const newHistory = [...history, currentCard.id]
    setHistory(newHistory)
    setRevealed(false)
    setCurrentCard(getNextCard(updatedCards, newHistory))
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!currentCard) return
      if (!revealed) {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          reveal()
        }
        return
      }
      if (event.key === '1') rate('again')
      else if (event.key === '2') rate('good')
      else if (event.key === '3') rate('easy')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rate/reveal are stable within a render cycle; adding them would require wrapping in useCallback
  }, [currentCard, revealed])

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-5">
        <Skeleton className="flex-1 rounded-[28px]" />
        <Skeleton className="h-11 w-full rounded-2xl" />
      </div>
    )
  }

  if (currentCard) {
    return (
      <div className="flex h-full flex-col gap-4 p-5">
        {/* Card fills the available space */}
        <div className="min-h-0 flex-1 max-w-lg w-full mx-auto">
          <Flashcard card={currentCard} revealed={revealed} onReveal={reveal} />
        </div>

        {/* Buttons pinned at the bottom */}
        <div className="shrink-0 w-full max-w-lg mx-auto">
          {revealed ? (
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="destructive"
                onClick={() => {
                  rate('again')
                }}
              >
                {t('study.again')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  rate('good')
                }}
              >
                {t('study.good')}
              </Button>
              <Button
                variant="success"
                onClick={() => {
                  rate('easy')
                }}
              >
                {t('study.easy')}
              </Button>
            </div>
          ) : (
            <Button onClick={reveal} className="w-full">
              {t('study.showAnswer')}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Empty state — deck-scoped (language is only used downstream; not needed for this guard)
  if (deckId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 px-5 text-center">
        <p className="text-muted-foreground">{t('study.noCardsYet')}</p>
        {onAddCard && <Button onClick={onAddCard}>{t('study.addFirstCard')}</Button>}
      </div>
    )
  }

  // Empty state — global session
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-muted-foreground">{t('study.noCardsYet')}</p>
      <Link to="/decks" className="underline text-foreground">
        {t('study.backToDecks')}
      </Link>
    </div>
  )
}

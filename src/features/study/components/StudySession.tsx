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
  const { data: cards, isLoading, isError, refetch } = useStudyCards(deckId)
  const submitRating = useSubmitRating()

  const [revealed, setRevealed] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [currentCard, setCurrentCard] = useState<StudyCard | null>(null)
  // Initialized to undefined (NOT to `cards`) — the original bug was
  // `useState(cards)` which on remount starts cardsSnapshot at the same cached
  // reference, making `cards !== cardsSnapshot` permanently false so
  // setCurrentCard never fires.
  const [cardsSnapshot, setCardsSnapshot] = useState<StudyCard[] | undefined>(undefined)

  // React "adjust state during render" — fires synchronously, no effect needed.
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
      <div className="flex h-full flex-col justify-between p-5">
        <div className="w-full max-w-lg mx-auto" style={{ height: 'clamp(220px, 45dvh, 320px)' }}>
          <Skeleton className="h-full rounded-[28px]" />
        </div>
        <Skeleton className="h-11 w-full max-w-lg mx-auto rounded-2xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-muted-foreground">{t('study.loadError')}</p>
        <Button
          variant="secondary"
          onClick={() => {
            void refetch()
          }}
        >
          {t('study.tryAgain')}
        </Button>
      </div>
    )
  }

  if (currentCard) {
    return (
      <div className="flex h-full flex-col justify-between p-5">
        {/* Card — capped height so it stays readable on any phone */}
        <div className="w-full max-w-lg mx-auto" style={{ height: 'clamp(220px, 45dvh, 320px)' }}>
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

  // Empty state — deck-scoped
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

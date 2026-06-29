import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { CardFormDialog } from '@/features/cards/components/CardFormDialog'
import { applyRating } from '@/domain/study/applyRating'
import { getNextCard } from '@/domain/study/getNextCard'
import type { StudyRating } from '@/domain/study/types'
import type { LanguageCode } from '@/lib/languages'
import { useStudyCards } from '../hooks/useStudyCards'
import { useSubmitRating } from '../hooks/useSubmitRating'
import type { StudyCard } from '../types'
import { Flashcard } from './Flashcard'

interface StudySessionProps {
  /** Omitted for the global "study everything" session. */
  deckId?: string
  /** The deck's study language — only needed alongside deckId, to power the empty state's inline "add first card" dialog. */
  language?: LanguageCode
}

/**
 * A continuous session: cards never run out, there's no "due" concept, and
 * rating a card never removes it from the pool — it just updates that
 * card's weight for next time. See ADR-0026. Card selection itself lives in
 * domain/study/getNextCard — this component only orchestrates state.
 */
export function StudySession({ deckId, language }: StudySessionProps) {
  const { t } = useTranslation()
  const { data: cards, isLoading } = useStudyCards(deckId)
  const submitRating = useSubmitRating()

  const [revealed, setRevealed] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [currentCard, setCurrentCard] = useState<StudyCard | null>(null)
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [cardsSnapshot, setCardsSnapshot] = useState(cards)

  // Picks an initial card once the pool loads, following React's documented
  // pattern for adjusting state in response to changed data during render
  // rather than in an effect (https://react.dev/learn/you-might-not-need-an-effect).
  // Guarded by `!currentCard` so a later background refetch never yanks the
  // card the user is currently looking at out from under them.
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

    // Computed locally (not read back from the query cache) so the next
    // card is chosen instantly, without waiting on a render/refetch cycle.
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
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentCard, revealed, rate, reveal])

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-72 w-full" />
        <Skeleton className="mt-6 h-11 w-full" />
      </div>
    )
  }

  if (currentCard) {
    return (
      <div>
        <Flashcard card={currentCard} revealed={revealed} onReveal={reveal} />
        {revealed && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Button variant="destructive" onClick={() => rate('again')}>
              {t('study.again')}
            </Button>
            <Button variant="primary" onClick={() => rate('good')}>
              {t('study.good')}
            </Button>
            <Button variant="success" onClick={() => rate('easy')}>
              {t('study.easy')}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // No cards anywhere in scope.
  if (deckId && language) {
    return (
      <div className="text-center text-muted-foreground">
        <p className="text-base">{t('study.noCardsYet')}</p>
        <Button onClick={() => setIsAddCardOpen(true)} className="mt-5">
          {t('study.addFirstCard')}
        </Button>
        <CardFormDialog
          open={isAddCardOpen}
          onOpenChange={setIsAddCardOpen}
          deckId={deckId}
          language={language}
        />
      </div>
    )
  }
  return (
    <div className="text-center text-muted-foreground">
      <p className="text-base">{t('study.noCardsYet')}</p>
      <Link to="/decks" className="mt-4 inline-block underline">
        {t('study.backToDecks')}
      </Link>
    </div>
  )
}

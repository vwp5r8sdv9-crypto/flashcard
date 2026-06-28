import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { CardFormDialog } from '@/features/cards/components/CardFormDialog'
import { useCardCount } from '@/features/cards/hooks/useCardCount'
import { useTotalCardCount } from '@/features/cards/hooks/useTotalCardCount'
import type { CardReviewRating } from '@/domain/srs/types'
import type { LanguageCode } from '@/lib/languages'
import { useDueCards } from '../hooks/useDueCards'
import { useNextDueAt } from '../hooks/useNextDueAt'
import { useSubmitReview } from '../hooks/useSubmitReview'
import { Flashcard } from './Flashcard'
import { StudySummary } from './StudySummary'

interface StudySessionProps {
  /** Omitted for the global "study all due" session. */
  deckId?: string
  /** The deck's study language — only needed alongside deckId, to power the empty state's inline "add first card" dialog. */
  language?: LanguageCode
}

const EMPTY_TALLY: Record<CardReviewRating, number> = { again: 0, good: 0, easy: 0 }

export function StudySession({ deckId, language }: StudySessionProps) {
  const { t, i18n } = useTranslation()
  const { data: dueCards, isLoading } = useDueCards(deckId)
  const { data: deckCardCount } = useCardCount(deckId)
  const { data: totalCardCount } = useTotalCardCount()
  const submitReview = useSubmitReview()

  const [revealed, setRevealed] = useState(false)
  const [tally, setTally] = useState(EMPTY_TALLY)
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)

  const currentCard = dueCards?.[0]
  const queueIsEmpty = !isLoading && (dueCards?.length ?? 0) === 0
  const studiedCount = tally.again + tally.good + tally.easy
  const scopeTotal = deckId ? deckCardCount : totalCardCount
  const hasNoCardsAtAll = queueIsEmpty && studiedCount === 0 && (scopeTotal ?? 0) === 0

  const { data: nextDueAt } = useNextDueAt(
    deckId,
    queueIsEmpty && studiedCount === 0 && !hasNoCardsAtAll,
  )

  function reveal() {
    setRevealed(true)
  }

  function rate(rating: CardReviewRating) {
    if (!currentCard) return
    setTally((prev) => ({ ...prev, [rating]: prev[rating] + 1 }))
    setRevealed(false)
    submitReview.mutate({ card: currentCard, rating, deckId })
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

  if (studiedCount > 0) {
    return <StudySummary tally={tally} deckId={deckId} />
  }

  if (hasNoCardsAtAll) {
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

  return (
    <div className="text-center text-muted-foreground">
      <p className="text-base">{t('study.nothingDue')}</p>
      {nextDueAt && (
        <p className="mt-1 text-sm">
          {t('study.nextDueAt', {
            date: new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(nextDueAt)),
          })}
        </p>
      )}
      <Link to={deckId ? `/decks/${deckId}` : '/decks'} className="mt-4 inline-block underline">
        {t('study.backToDecks')}
      </Link>
    </div>
  )
}

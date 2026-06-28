import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import type { CardReviewRating } from '@/domain/srs/types'

interface StudySummaryProps {
  tally: Record<CardReviewRating, number>
  deckId?: string
}

export function StudySummary({ tally, deckId }: StudySummaryProps) {
  const { t } = useTranslation()
  const total = tally.again + tally.good + tally.easy
  const backTo = deckId ? `/decks/${deckId}` : '/decks'

  return (
    <Card className="text-center">
      <h2 className="text-xl font-semibold">{t('study.sessionComplete')}</h2>
      <p className="mt-2 text-muted-foreground">{t('study.cardsStudied', { count: total })}</p>

      <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">{t('study.again')}</dt>
          <dd className="mt-1 text-lg font-medium">{tally.again}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('study.good')}</dt>
          <dd className="mt-1 text-lg font-medium">{tally.good}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('study.easy')}</dt>
          <dd className="mt-1 text-lg font-medium">{tally.easy}</dd>
        </div>
      </dl>

      <Link
        to={backTo}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        {t('study.backToDecks')}
      </Link>
    </Card>
  )
}

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { useDecks } from '@/features/decks/hooks/useDecks'
import { useTotalCardCount } from '@/features/cards/hooks/useTotalCardCount'

/** Light dashboard — aggregate stats only, computed from already-available data. */
export function HomePage() {
  const { t } = useTranslation()
  const { data: decks, isLoading: isDecksLoading } = useDecks()
  const { data: totalCards, isLoading: isTotalCardsLoading } = useTotalCardCount()

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">{t('home.welcomeBack')}</h1>
      <p className="mt-1 text-muted-foreground">{t('home.overview')}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-muted-foreground">{t('nav.decks')}</p>
          {isDecksLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold">
              {t('home.totalDecks', { count: decks?.length ?? 0 })}
            </p>
          )}
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">{t('cards.title')}</p>
          {isTotalCardsLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold">
              {t('home.totalCards', { count: totalCards ?? 0 })}
            </p>
          )}
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/study">
          <Button>{t('study.studyNow')}</Button>
        </Link>
        <Link to="/decks">
          <Button variant="secondary">{t('home.goToDecks')}</Button>
        </Link>
      </div>
    </div>
  )
}

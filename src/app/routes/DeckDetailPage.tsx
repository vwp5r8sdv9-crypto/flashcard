import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDeck } from '@/features/decks/hooks/useDeck'
import { CardList } from '@/features/cards/components/CardList'
import { getLanguageMeta } from '@/lib/languages'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'

/** Deck detail screen: deck header, a Study entry point, and the full Cards CRUD list. */
export function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const { data: deck, isLoading } = useDeck(deckId)
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Skeleton className="h-4 w-24" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="mt-3 h-4 w-32" />
        <Skeleton className="mt-2 h-4 w-24" />
        <div className="mt-8 space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground">{t('notFound.title')}</p>
        <Link to="/decks" className="text-primary underline">
          {t('decks.backToDecks')}
        </Link>
      </div>
    )
  }

  const language = getLanguageMeta(deck.language)

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link to="/decks" className="text-sm text-muted-foreground hover:underline">
        ← {t('decks.backToDecks')}
      </Link>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="h-4 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: deck.color }}
            aria-hidden
          />
          <h1 className="text-display-1 min-w-0 break-words [overflow-wrap:anywhere]">
            {deck.name}
          </h1>
        </div>
        <Link to={`/decks/${deck.id}/study`} className="shrink-0">
          <Button>{t('study.studyNow')}</Button>
        </Link>
      </div>
      <p className="mt-1 text-muted-foreground">
        {language.flag} {t(`languages.${deck.language}`)}
      </p>

      <div className="mt-8">
        <CardList deckId={deck.id} language={deck.language} />
      </div>
    </div>
  )
}

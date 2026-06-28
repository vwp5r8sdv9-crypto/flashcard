import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDeck } from '@/features/decks/hooks/useDeck'
import { Skeleton } from '@/components/Skeleton'
import { StudySession } from '@/features/study/components/StudySession'

export function DeckStudyPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const { data: deck, isLoading } = useDeck(deckId)
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-7 w-24" />
        <Skeleton className="mt-6 h-56 w-full" />
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

  return (
    <div className="mx-auto max-w-xl p-6">
      <Link
        to={`/decks/${deck.id}`}
        className="text-sm text-muted-foreground break-words hover:underline [overflow-wrap:anywhere]"
      >
        ← {deck.name}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{t('study.title')}</h1>
      <div className="mt-6">
        <StudySession deckId={deck.id} />
      </div>
    </div>
  )
}

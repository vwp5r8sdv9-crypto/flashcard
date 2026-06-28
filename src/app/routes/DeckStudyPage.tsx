import { useEffect } from 'react'
import { List } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDeck } from '@/features/decks/hooks/useDeck'
import { setLastOpenedDeckId } from '@/features/decks/lastOpenedDeck'
import { IconButton } from '@/components/IconButton'
import { Skeleton } from '@/components/Skeleton'
import { StudySession } from '@/features/study/components/StudySession'

export function DeckStudyPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const { data: deck, isLoading } = useDeck(deckId)
  const { t } = useTranslation()

  useEffect(() => {
    if (deck) setLastOpenedDeckId(deck.id)
  }, [deck])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-9 w-48" />
        <Skeleton className="mt-8 h-72 w-full" />
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
      <Link to="/decks" className="text-sm text-muted-foreground hover:underline">
        ← {t('decks.backToDecks')}
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="text-display-1 min-w-0 break-words [overflow-wrap:anywhere]">{deck.name}</h1>
        <Link to={`/decks/${deck.id}`} className="shrink-0">
          <IconButton icon={List} label={t('decks.manageCards')} />
        </Link>
      </div>
      <div className="mt-8">
        <StudySession deckId={deck.id} language={deck.language} />
      </div>
    </div>
  )
}

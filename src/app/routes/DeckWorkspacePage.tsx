import { type CSSProperties, useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDeck } from '@/features/decks/hooks/useDeck'
import { setLastOpenedDeckId } from '@/features/decks/lastOpenedDeck'
import { getLanguageMeta } from '@/lib/languages'
import { Skeleton } from '@/components/Skeleton'
import { StudySession } from '@/features/study/components/StudySession'
import { CardList } from '@/features/cards/components/CardList'
import { CardAddForm } from '@/features/cards/components/CardAddForm'
import { cn } from '@/lib/utils'

type Tab = 'study' | 'cards' | 'add'

export function DeckWorkspacePage() {
  const { deckId } = useParams<{ deckId: string }>()
  const { data: deck, isLoading: isDeckLoading } = useDeck(deckId)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('study')

  useEffect(() => {
    if (deck) setLastOpenedDeckId(deck.id)
  }, [deck])

  // Redirect cleanly when a deck is not found (stale lastOpenedDeckId, deleted deck, etc.)
  useEffect(() => {
    if (!isDeckLoading && !deck) void navigate('/decks', { replace: true })
  }, [isDeckLoading, deck, navigate])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'study', label: t('decks.tabs.study') },
    { id: 'cards', label: t('decks.tabs.cards') },
    { id: 'add', label: t('decks.tabs.add') },
  ]

  // Render the full workspace shell immediately — even before the deck query
  // resolves — so both `useDeck` and `useStudyCards` fire in parallel and the
  // study card can appear without waiting for deck metadata to load first.
  return (
    <div
      className="flex h-[calc(100dvh-57px)] flex-col lg:h-dvh"
      // --deck-color is inherited by the Flashcard's colored accent bar.
      // No background tint — deck color is an accent, not a theme wash.
      style={deck ? ({ '--deck-color': deck.color } as CSSProperties) : undefined}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2.5 px-4 pb-3 pt-4">
        <Link
          to="/decks"
          aria-label={t('decks.backToDecks')}
          className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-soft hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        {isDeckLoading ? (
          <>
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </>
        ) : deck ? (
          <>
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: deck.color }}
              aria-hidden
            />
            <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{deck.name}</h1>
            <span
              className="shrink-0 text-base"
              aria-label={t(`languages.${deck.language}`)}
              title={t(`languages.${deck.language}`)}
            >
              {getLanguageMeta(deck.language).flag}
            </span>
          </>
        ) : null}
      </div>

      {/* ── Segmented tabs ──────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-3">
        <div className="flex gap-0.5 rounded-full bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
              }}
              className={cn(
                'flex-1 rounded-full py-1.5 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-card shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              // Active tab text uses the deck color — Apple-style accent on
              // the selection indicator only, not on the background.
              style={activeTab === tab.id && deck ? { color: deck.color } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}

      {activeTab === 'study' && (
        <div className="min-h-0 flex-1 overflow-hidden">
          {/* StudySession starts its own query immediately with deckId from
              the URL, without waiting for the deck metadata query to finish. */}
          <StudySession
            deckId={deckId}
            onAddCard={
              deck
                ? () => {
                    setActiveTab('add')
                  }
                : undefined
            }
          />
        </div>
      )}

      {activeTab === 'cards' && (
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {deck && <CardList deckId={deck.id} language={deck.language} />}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {deck && (
            <CardAddForm
              deckId={deck.id}
              language={deck.language}
              onAdded={() => {
                setActiveTab('cards')
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

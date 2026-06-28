import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Skeleton } from '@/components/Skeleton'
import type { LanguageCode } from '@/lib/languages'
import { useCards } from '../hooks/useCards'
import { useDeleteCard } from '../hooks/useDeleteCard'
import { CardFormDialog } from './CardFormDialog'
import { CardListItem } from './CardListItem'
import type { Card } from '../types'

interface CardListProps {
  deckId: string
  /** The deck's study language — used so alphabetical sort follows its collation rules. */
  language: LanguageCode
}

export function CardList({ deckId, language }: CardListProps) {
  const { t } = useTranslation()
  const { data: cards, isLoading } = useCards(deckId)
  const deleteCard = useDeleteCard()

  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)

  const visibleCards = useMemo(() => {
    if (!cards) return []
    const query = search.trim().toLowerCase()
    const filtered = query
      ? cards.filter(
          (card) =>
            card.front.toLowerCase().includes(query) || card.back.toLowerCase().includes(query),
        )
      : cards
    return [...filtered].sort((a, b) => a.front.localeCompare(b.front, language))
  }, [cards, search, language])

  function openCreateForm() {
    setEditingCard(null)
    setIsFormOpen(true)
  }

  function openEditForm(card: Card) {
    setEditingCard(card)
    setIsFormOpen(true)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('cards.title')}</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('cards.searchPlaceholder')}
              aria-label={t('cards.searchPlaceholder')}
              className="h-9 w-48 rounded-md border border-border bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary sm:w-64"
            />
          </div>
          <Button onClick={openCreateForm}>{t('cards.newCard')}</Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {[0, 1, 2].map((key) => (
            <div key={key} className="flex items-center gap-4 px-3 py-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && cards?.length === 0 && (
        <p className="text-muted-foreground">{t('cards.empty')}</p>
      )}

      {!isLoading && cards && cards.length > 0 && visibleCards.length === 0 && (
        <p className="text-muted-foreground">{t('cards.noResults')}</p>
      )}

      {visibleCards.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {visibleCards.map((card) => (
            <CardListItem
              key={card.id}
              card={card}
              language={language}
              onEdit={() => openEditForm(card)}
              onDelete={() => setDeletingCard(card)}
            />
          ))}
        </div>
      )}

      <CardFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        deckId={deckId}
        language={language}
        card={editingCard}
      />

      <ConfirmDialog
        open={deletingCard !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingCard(null)
        }}
        title={t('cards.deleteConfirmTitle')}
        description={t('cards.deleteConfirmDescription')}
        confirmLabel={t('common.delete')}
        isDestructive
        onConfirm={() => {
          if (deletingCard) deleteCard.mutate({ id: deletingCard.id, deckId: deletingCard.deckId })
        }}
      />
    </div>
  )
}

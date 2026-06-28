import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useDueCount } from '@/features/study/hooks/useDueCount'
import { useDecks } from '../hooks/useDecks'
import { useDeleteDeck } from '../hooks/useDeleteDeck'
import { DeckCard } from './DeckCard'
import { DeckFormDialog } from './DeckFormDialog'
import type { Deck } from '../types'

export function DeckList() {
  const { t } = useTranslation()
  const { data: decks, isLoading } = useDecks()
  const { data: dueCount } = useDueCount()
  const deleteDeck = useDeleteDeck()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null)

  function openCreateForm() {
    setEditingDeck(null)
    setIsFormOpen(true)
  }

  function openEditForm(deck: Deck) {
    setEditingDeck(deck)
    setIsFormOpen(true)
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="text-display-1">{t('decks.title')}</h1>
        <div className="flex items-center gap-3">
          {Boolean(dueCount) && (
            <Link to="/study" className="text-sm text-primary underline">
              {t('study.studyAllDue', { count: dueCount })}
            </Link>
          )}
          <Button onClick={openCreateForm}>{t('decks.newDeck')}</Button>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}

      {!isLoading && decks?.length === 0 && (
        <p className="text-muted-foreground">{t('decks.empty')}</p>
      )}

      {!isLoading && decks && decks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={() => openEditForm(deck)}
              onDelete={() => setDeletingDeck(deck)}
            />
          ))}
        </div>
      )}

      <DeckFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} deck={editingDeck} />

      <ConfirmDialog
        open={deletingDeck !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingDeck(null)
        }}
        title={t('decks.deleteConfirmTitle', { name: deletingDeck?.name ?? '' })}
        description={t('decks.deleteConfirmDescription')}
        confirmLabel={t('common.delete')}
        isDestructive
        onConfirm={() => {
          if (deletingDeck) deleteDeck.mutate(deletingDeck.id)
        }}
      />
    </div>
  )
}

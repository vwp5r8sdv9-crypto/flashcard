import { useState } from 'react'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useDecks } from '../hooks/useDecks'
import { useDeleteDeck } from '../hooks/useDeleteDeck'
import { DeckCard } from './DeckCard'
import { DeckFormDialog } from './DeckFormDialog'
import type { Deck } from '../types'

export function DeckList() {
  const { data: decks, isLoading } = useDecks()
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your decks</h1>
        <Button onClick={openCreateForm}>New deck</Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && decks?.length === 0 && (
        <p className="text-muted-foreground">
          No decks yet — create your first one to start studying.
        </p>
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
        title={`Delete "${deletingDeck?.name ?? ''}"?`}
        description="This can't be undone."
        confirmLabel="Delete"
        isDestructive
        onConfirm={() => {
          if (deletingDeck) deleteDeck.mutate(deletingDeck.id)
        }}
      />
    </div>
  )
}

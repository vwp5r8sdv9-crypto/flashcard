import { useRef, useMemo, useState } from 'react'
import { Download, Search, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { IconButton } from '@/components/IconButton'
import { Skeleton } from '@/components/Skeleton'
import { cn } from '@/lib/utils'
import type { LanguageCode } from '@/lib/languages'
import { useCards } from '../hooks/useCards'
import { useCreateCard } from '../hooks/useCreateCard'
import { useDeleteCard } from '../hooks/useDeleteCard'
import { downloadJson, exportDeckToJson, deduplicateImport, parseDeckImport } from '../utils/deckIO'
import { CardFormDialog } from './CardFormDialog'
import { CardListItem } from './CardListItem'
import type { Card } from '../types'

type SortOrder = 'alpha' | 'newest' | 'oldest'

interface CardListProps {
  deckId: string
  language: LanguageCode
  deckName?: string
}

export function CardList({ deckId, language, deckName }: CardListProps) {
  const { t } = useTranslation()
  const { data: cards, isLoading } = useCards(deckId)
  const deleteCard = useDeleteCard()
  const createCard = useCreateCard()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  const visibleCards = useMemo(() => {
    if (!cards) return []
    const query = search.trim().toLowerCase()
    const filtered = query
      ? cards.filter(
          (card) =>
            card.front.toLowerCase().includes(query) || card.back.toLowerCase().includes(query),
        )
      : cards

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortOrder === 'oldest')
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return a.front.localeCompare(b.front, language)
    })
  }, [cards, search, language, sortOrder])

  function openCreateForm() {
    setEditingCard(null)
    setIsFormOpen(true)
  }

  function openEditForm(card: Card) {
    setEditingCard(card)
    setIsFormOpen(true)
  }

  function handleExport() {
    if (!cards || cards.length === 0) return
    const json = exportDeckToJson(cards)
    const slug = (deckName ?? deckId.slice(0, 8)).replace(/\s+/g, '-').toLowerCase()
    downloadJson(json, `flashcards-${slug}.json`)
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text !== 'string') return

      const parsed = parseDeckImport(text)
      if (!parsed || parsed.length === 0) {
        setImportMessage(t('cards.importInvalidFile'))
        setTimeout(() => {
          setImportMessage(null)
        }, 3_000)
        return
      }

      const toImport = deduplicateImport(parsed, cards ?? [])
      if (toImport.length === 0) {
        setImportMessage(t('cards.importAllDuplicates'))
        setTimeout(() => {
          setImportMessage(null)
        }, 3_000)
        return
      }

      const total = toImport.length
      let successCount = 0
      let doneCount = 0

      function onDone() {
        doneCount++
        if (doneCount === total) {
          setImportMessage(t('cards.importSuccess', { count: successCount }))
          setTimeout(() => {
            setImportMessage(null)
          }, 3_000)
        }
      }

      toImport.forEach((card) => {
        createCard.mutate(
          { deckId, ...card },
          {
            onSuccess: () => {
              successCount++
              onDone()
            },
            onError: onDone,
          },
        )
      })
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const sortOptions: { id: SortOrder; label: string }[] = [
    { id: 'newest', label: t('cards.sortNewest') },
    { id: 'oldest', label: t('cards.sortOldest') },
    { id: 'alpha', label: t('cards.sortAlpha') },
  ]

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
            }}
            placeholder={t('cards.searchPlaceholder')}
            aria-label={t('cards.searchPlaceholder')}
            className="h-10 w-full rounded-2xl border border-border bg-card-soft pl-9 pr-3 text-base outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Sort + IO + Add */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex rounded-full bg-muted p-0.5">
            {sortOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSortOrder(opt.id)
                }}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-all',
                  sortOrder === opt.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <IconButton
            icon={Download}
            label={t('cards.exportCards')}
            onClick={handleExport}
            className="text-muted-foreground"
            disabled={!cards || cards.length === 0}
          />
          <IconButton
            icon={Upload}
            label={t('cards.importCards')}
            onClick={() => {
              fileInputRef.current?.click()
            }}
            className="text-muted-foreground"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />

          <Button onClick={openCreateForm}>{t('cards.newCard')}</Button>
        </div>
      </div>

      {/* Import feedback */}
      {importMessage && (
        <p className="mb-3 rounded-2xl bg-muted px-4 py-2.5 text-sm font-medium text-foreground">
          {importMessage}
        </p>
      )}

      {isLoading && (
        <div className="flex flex-col divide-y divide-border rounded-[28px] border border-border">
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
        <div className="flex flex-col divide-y divide-border rounded-[28px] border border-border">
          {visibleCards.map((card) => (
            <CardListItem
              key={card.id}
              card={card}
              language={language}
              onEdit={() => {
                openEditForm(card)
              }}
              onDelete={() => {
                setDeletingCard(card)
              }}
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

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { optimisticListRemove, rollbackList } from '@/lib/optimisticList'
import { decksApi } from '../api/decksApi'
import { clearLastOpenedDeckId } from '../lastOpenedDeck'
import type { Deck } from '../types'

/**
 * No longer orchestrates deleting the deck's cards first (compare ADR-0018,
 * written for localStorage, which had no real foreign keys). Now that
 * `cards.deck_id` has `on delete cascade` in Postgres, the database removes
 * the cards itself — duplicating that here would just be redundant client-
 * side logic doing the database's job. See ADR-0020.
 */
export function useDeleteDeck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => decksApi.remove(id),
    onMutate: (id) => {
      clearLastOpenedDeckId(id)
      return optimisticListRemove<Deck>(queryClient, ['decks'], id)
    },
    onError: (_error, _id, context) => rollbackList(queryClient, context),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['decks'] })
      // Cards are gone server-side via cascade; refresh any cached card
      // queries (lists, counts) so the UI doesn't show stale data for them.
      void queryClient.invalidateQueries({ queryKey: ['cards'] })
      void queryClient.invalidateQueries({ queryKey: ['study'] })
    },
  })
}

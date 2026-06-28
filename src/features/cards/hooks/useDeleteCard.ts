import { useMutation, useQueryClient } from '@tanstack/react-query'
import { optimisticListRemove, rollbackList } from '@/lib/optimisticList'
import { cardsApi } from '../api/cardsApi'
import type { Card } from '../types'

interface DeleteCardVariables {
  id: string
  /** Not sent to the repository — just so this hook knows which deck's cached list to update. */
  deckId: string
}

export function useDeleteCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: DeleteCardVariables) => cardsApi.remove(id),
    onMutate: ({ id, deckId }) =>
      optimisticListRemove<Card>(queryClient, ['cards', 'deck', deckId], id),
    onError: (_error, _variables, context) => rollbackList(queryClient, context),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['cards'] })
      // Deleting a card cascades to its card_review_state row server-side.
      void queryClient.invalidateQueries({ queryKey: ['study'] })
    },
  })
}

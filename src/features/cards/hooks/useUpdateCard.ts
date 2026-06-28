import { useMutation, useQueryClient } from '@tanstack/react-query'
import { optimisticListPatch, rollbackList } from '@/lib/optimisticList'
import { cardsApi } from '../api/cardsApi'
import type { Card, UpdateCardInput } from '../types'

interface UpdateCardVariables {
  id: string
  /** Not sent to the repository — just so this hook knows which deck's cached list to patch. */
  deckId: string
  input: UpdateCardInput
}

export function useUpdateCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: UpdateCardVariables) => cardsApi.update(id, input),
    onMutate: ({ id, deckId, input }) =>
      optimisticListPatch<Card>(queryClient, ['cards', 'deck', deckId], id, input),
    onError: (_error, _variables, context) => rollbackList(queryClient, context),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['cards'] })
      // Study queues embed each card's front/back directly (see DueCard).
      void queryClient.invalidateQueries({ queryKey: ['study'] })
    },
  })
}

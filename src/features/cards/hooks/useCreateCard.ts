import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cardsApi } from '../api/cardsApi'
import type { CreateCardInput } from '../types'

export function useCreateCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCardInput) => cardsApi.create(input),
    onSuccess: () => {
      // Broad rather than scoped to this deck, so the Home dashboard's
      // countAll query is covered too — harmless at this app's scale.
      void queryClient.invalidateQueries({ queryKey: ['cards'] })
      // A new card is due immediately (see the card_review_state trigger),
      // so the study queues/badges need refreshing too.
      void queryClient.invalidateQueries({ queryKey: ['study'] })
    },
  })
}

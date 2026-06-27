import { useMutation, useQueryClient } from '@tanstack/react-query'
import { decksApi } from '../api/decksApi'
import type { UpdateDeckInput } from '../types'

export function useUpdateDeck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDeckInput }) =>
      decksApi.update(id, input),
    onSuccess: () => {
      // Invalidating the list key also matches the ['decks', id] detail
      // query (TanStack Query treats it as a prefix), so one call covers both.
      void queryClient.invalidateQueries({ queryKey: ['decks'] })
    },
  })
}

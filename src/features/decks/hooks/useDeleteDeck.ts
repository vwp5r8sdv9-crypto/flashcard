import { useMutation, useQueryClient } from '@tanstack/react-query'
import { decksApi } from '../api/decksApi'

export function useDeleteDeck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => decksApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['decks'] })
    },
  })
}

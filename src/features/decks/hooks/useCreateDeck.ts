import { useMutation, useQueryClient } from '@tanstack/react-query'
import { decksApi } from '../api/decksApi'
import type { CreateDeckInput } from '../types'

export function useCreateDeck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateDeckInput) => decksApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['decks'] })
    },
  })
}

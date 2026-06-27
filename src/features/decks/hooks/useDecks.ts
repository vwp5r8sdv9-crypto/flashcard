import { useQuery } from '@tanstack/react-query'
import { decksApi } from '../api/decksApi'

export function useDecks() {
  return useQuery({
    queryKey: ['decks'],
    queryFn: () => decksApi.list(),
  })
}

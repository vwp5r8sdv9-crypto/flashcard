import { useQuery } from '@tanstack/react-query'
import { decksApi } from '../api/decksApi'

export function useDeck(id: string | undefined) {
  return useQuery({
    queryKey: ['decks', id],
    queryFn: () => decksApi.getById(id ?? ''),
    enabled: Boolean(id),
  })
}

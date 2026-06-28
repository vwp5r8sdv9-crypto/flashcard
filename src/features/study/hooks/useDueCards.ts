import { useQuery } from '@tanstack/react-query'
import { studyApi } from '../api/studyApi'

export function useDueCards(deckId?: string) {
  return useQuery({
    queryKey: ['study', 'due', deckId ?? 'all'],
    queryFn: () => studyApi.listDue(deckId),
  })
}

import { useQuery } from '@tanstack/react-query'
import { studyApi } from '../api/studyApi'

export function useDueCount(deckId?: string) {
  return useQuery({
    queryKey: ['study', 'due', deckId ?? 'all', 'count'],
    queryFn: () => studyApi.countDue(deckId),
  })
}

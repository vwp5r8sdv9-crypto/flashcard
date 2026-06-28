import { useQuery } from '@tanstack/react-query'
import { studyApi } from '../api/studyApi'

/** Only meaningful once we know the due queue is empty — pass `enabled` accordingly. */
export function useNextDueAt(deckId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['study', 'next-due', deckId ?? 'all'],
    queryFn: () => studyApi.nextDueAt(deckId),
    enabled,
  })
}

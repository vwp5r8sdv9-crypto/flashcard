import { useQuery } from '@tanstack/react-query'
import { studyApi } from '../api/studyApi'

/** Every card in scope (a deck, or every deck when omitted) plus its study state — the full candidate pool `getNextCard` picks from. */
export function useStudyCards(deckId?: string) {
  return useQuery({
    queryKey: ['study', 'cards', deckId ?? 'all'],
    queryFn: () => studyApi.listCards(deckId),
  })
}

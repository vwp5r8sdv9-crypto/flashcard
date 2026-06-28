import { useQuery } from '@tanstack/react-query'
import { cardsApi } from '../api/cardsApi'

/** Lightweight count for deck-grid display — avoids fetching full card lists. */
export function useCardCount(deckId: string | undefined) {
  return useQuery({
    queryKey: ['cards', 'deck', deckId, 'count'],
    queryFn: () => cardsApi.countByDeck(deckId ?? ''),
    enabled: Boolean(deckId),
  })
}

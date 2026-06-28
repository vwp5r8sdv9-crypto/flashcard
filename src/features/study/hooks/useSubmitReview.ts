import { useMutation, useQueryClient } from '@tanstack/react-query'
import { optimisticListRemove, rollbackList } from '@/lib/optimisticList'
import { scheduleReview } from '@/domain/srs/scheduleReview'
import type { CardReviewRating } from '@/domain/srs/types'
import { studyApi } from '../api/studyApi'
import type { DueCard } from '../types'

interface SubmitReviewVariables {
  card: DueCard
  rating: CardReviewRating
  /** Not sent to the repository — just so this hook knows which due-queue cache to update. */
  deckId?: string
}

export function useSubmitReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ card, rating }: SubmitReviewVariables) => {
      const next = scheduleReview(card.review, rating, new Date())
      return studyApi.submitReview(rating, card.review, next)
    },
    onMutate: ({ card, deckId }) =>
      optimisticListRemove<DueCard>(queryClient, ['study', 'due', deckId ?? 'all'], card.id),
    onError: (_error, _variables, context) => rollbackList(queryClient, context),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['study'] })
    },
  })
}

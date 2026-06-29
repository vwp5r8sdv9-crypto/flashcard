import { useMutation, useQueryClient } from '@tanstack/react-query'
import { optimisticListPatch, rollbackList } from '@/lib/optimisticList'
import type { CardStudyState } from '@/domain/study/types'
import { studyApi } from '../api/studyApi'
import type { StudyCard } from '../types'

interface SubmitRatingVariables {
  next: CardStudyState
  /** Not sent to the repository — just so this hook knows which cached pool to patch. */
  deckId?: string
}

export function useSubmitRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ next }: SubmitRatingVariables) => studyApi.submitRating(next),
    onMutate: ({ next, deckId }) =>
      optimisticListPatch<StudyCard>(
        queryClient,
        ['study', 'cards', deckId ?? 'all'],
        next.cardId,
        { studyState: next },
      ),
    onError: (_error, _variables, context) => rollbackList(queryClient, context),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['study'] })
    },
  })
}

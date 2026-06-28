import type { Card } from '@/features/cards/types'
import type { CardReviewState } from '@/domain/srs/types'
import type { LanguageCode } from '@/lib/languages'

export interface DueCard extends Card {
  /** The owning deck's study language — lets the study UI speak the card without a second lookup. */
  language: LanguageCode
  review: CardReviewState
}

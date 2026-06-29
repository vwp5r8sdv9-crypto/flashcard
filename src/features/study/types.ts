import type { Card } from '@/features/cards/types'
import type { CardStudyState } from '@/domain/study/types'
import type { LanguageCode } from '@/lib/languages'

export interface StudyCard extends Card {
  /** The owning deck's study language — lets the study UI speak the card without a second lookup. */
  language: LanguageCode
  studyState: CardStudyState
}

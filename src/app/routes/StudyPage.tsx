import { useTranslation } from 'react-i18next'
import { StudySession } from '@/features/study/components/StudySession'

/** Global study session — every card across all decks. Full-height immersive layout. */
export function StudyPage() {
  const { t } = useTranslation()

  return (
    <div className="flex h-[calc(100dvh-57px)] flex-col lg:h-dvh">
      <div className="shrink-0 px-5 pb-3 pt-6">
        <h1 className="text-display-1">{t('study.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('study.allDescription')}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <StudySession />
      </div>
    </div>
  )
}

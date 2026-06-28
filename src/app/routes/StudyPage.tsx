import { useTranslation } from 'react-i18next'
import { StudySession } from '@/features/study/components/StudySession'

export function StudyPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">{t('study.title')}</h1>
      <p className="mt-1 text-muted-foreground">{t('study.allDueDescription')}</p>
      <div className="mt-6">
        <StudySession />
      </div>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { StudySession } from '@/features/study/components/StudySession'

export function StudyPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-display-1">{t('study.title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('study.allDescription')}</p>
      <div className="mt-8">
        <StudySession />
      </div>
    </div>
  )
}

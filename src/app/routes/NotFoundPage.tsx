import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2">
      <p className="text-lg font-medium">{t('notFound.title')}</p>
      <Link to="/decks" className="text-primary underline">
        {t('notFound.backToDecks')}
      </Link>
    </div>
  )
}

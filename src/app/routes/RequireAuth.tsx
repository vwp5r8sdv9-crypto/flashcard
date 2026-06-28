import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/useAuth'

/**
 * Route guard used to wrap routes that require a signed-in user. This is a
 * UX nicety, not the security boundary — Row Level Security on the database
 * is what actually enforces access (see docs/10-authentication.md).
 */
export function RequireAuth() {
  const { session, isLoading } = useAuth()
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        {t('common.loading')}
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

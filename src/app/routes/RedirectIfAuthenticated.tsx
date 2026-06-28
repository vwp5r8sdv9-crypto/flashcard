import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/useAuth'

/**
 * Wraps /login and /signup: an already-signed-in user visiting either
 * should land back on the app, not see a sign-in form again. Symmetric
 * with RequireAuth (./RequireAuth.tsx).
 */
export function RedirectIfAuthenticated() {
  const { session, isLoading } = useAuth()
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        {t('common.loading')}
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

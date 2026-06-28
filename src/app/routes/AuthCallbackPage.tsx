import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/app/providers/useAuth'

/**
 * Lands here after the Google OAuth redirect (see GoogleSignInButton and
 * authApi.signInWithGoogle's `redirectTo`). The actual code-for-session
 * exchange already happened automatically during the Supabase client's
 * `_initialize()` (PKCE + `detectSessionInUrl` — see
 * src/lib/supabaseClient.ts) by the time AuthProvider's `isLoading`
 * settles; this page only has to wait for that and then either continue
 * into the app or show what went wrong — e.g. the user cancelled the
 * Google consent screen, or the code was already used/expired. Kept
 * outside both route guards (see router.tsx): RedirectIfAuthenticated
 * would bounce away before this page can show a failure state, and
 * RequireAuth would bounce away before the exchange has a session to
 * find. See ADR-0022.
 */
export function AuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session, isLoading } = useAuth()

  useEffect(() => {
    const description = new URLSearchParams(window.location.search).get('error_description')
    if (description) {
      console.error('Google sign-in callback error:', description)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && session) {
      void navigate('/', { replace: true })
    }
  }, [isLoading, session, navigate])

  const failed = !isLoading && !session

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
        </div>
        {!failed ? (
          <p className="text-center text-sm text-muted-foreground" role="status">
            {t('auth.completingSignIn')}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-center text-sm text-destructive" role="alert">
              {t('auth.googleSignInFailed')}
            </p>
            <Link
              to="/login"
              className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('auth.backToLogin')}
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}

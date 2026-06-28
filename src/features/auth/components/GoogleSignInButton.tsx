import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { useSignInWithGoogle } from '../hooks/useSignInWithGoogle'
import { getAuthErrorMessage } from '../lib/authErrorMessage'

/**
 * Self-contained like LoginForm/SignUpForm: owns its own pending/error
 * state. On success `authApi.signInWithGoogle` redirects the browser to
 * Google immediately, so there's no session to react to here — the
 * round trip is picked up later by AuthCallbackPage and AuthProvider.
 * See ADR-0022.
 */
export function GoogleSignInButton() {
  const { t } = useTranslation()
  const signInWithGoogle = useSignInWithGoogle()

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2"
        disabled={signInWithGoogle.isPending}
        onClick={() => signInWithGoogle.mutate()}
      >
        <GoogleLogo />
        {signInWithGoogle.isPending ? t('auth.redirectingToGoogle') : t('auth.continueWithGoogle')}
      </Button>
      {signInWithGoogle.isError && (
        <p className="text-sm text-destructive" role="alert">
          {getAuthErrorMessage(signInWithGoogle.error, t, 'auth.googleSignInFailed')}
        </p>
      )}
    </div>
  )
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z"
      />
    </svg>
  )
}

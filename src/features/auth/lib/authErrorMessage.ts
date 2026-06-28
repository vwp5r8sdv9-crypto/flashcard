import type { TFunction } from 'i18next'

interface AuthErrorLike {
  code?: string
  message?: string
  status?: number
}

/** The generic fallbacks each call site falls back to when no specific error is recognized. */
export type AuthErrorFallbackKey =
  | 'auth.signInFailed'
  | 'auth.signUpFailed'
  | 'auth.googleSignInFailed'
  | 'auth.requestResetLinkFailed'
  | 'auth.updatePasswordFailed'

/**
 * Maps a thrown Supabase Auth error to a translated, user-facing message.
 * Matches primarily on the stable `error.code` values from auth-js's
 * `ErrorCode` union, falling back to the legacy `error.message` string for
 * GoTrue responses that predate `code` — see ADR-0022. Centralized here so
 * every form (login, sign up, forgot password, reset password) shows the
 * same wording for the same underlying error instead of drifting.
 */
export function getAuthErrorMessage(
  error: unknown,
  t: TFunction,
  fallbackKey: AuthErrorFallbackKey = 'auth.signInFailed',
): string {
  const { code, message, status } = (error ?? {}) as AuthErrorLike

  if (code === 'invalid_credentials' || message === 'Invalid login credentials') {
    return t('auth.invalidCredentials')
  }
  if (code === 'email_not_confirmed') {
    return t('auth.emailNotConfirmed')
  }
  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    message === 'User already registered'
  ) {
    return t('auth.emailAlreadyRegistered')
  }
  if (code === 'weak_password') {
    return t('auth.passwordTooShort')
  }
  if (code === 'same_password') {
    return t('auth.samePassword')
  }
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    status === 429
  ) {
    return t('auth.tooManyRequests')
  }

  return t(fallbackKey)
}

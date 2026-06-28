import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import { getAuthErrorMessage } from './authErrorMessage'

// Identity stub: returns the key itself, so assertions can check which
// translation key was chosen without needing a real i18next instance.
const t = ((key: string) => key) as TFunction

describe('getAuthErrorMessage', () => {
  it('maps invalid_credentials by code', () => {
    expect(getAuthErrorMessage({ code: 'invalid_credentials' }, t)).toBe('auth.invalidCredentials')
  })

  it('maps the legacy "Invalid login credentials" message', () => {
    expect(getAuthErrorMessage({ message: 'Invalid login credentials' }, t)).toBe(
      'auth.invalidCredentials',
    )
  })

  it('maps email_not_confirmed', () => {
    expect(getAuthErrorMessage({ code: 'email_not_confirmed' }, t)).toBe('auth.emailNotConfirmed')
  })

  it('maps user_already_exists and the legacy message', () => {
    expect(getAuthErrorMessage({ code: 'user_already_exists' }, t)).toBe(
      'auth.emailAlreadyRegistered',
    )
    expect(getAuthErrorMessage({ message: 'User already registered' }, t)).toBe(
      'auth.emailAlreadyRegistered',
    )
  })

  it('maps weak_password and same_password', () => {
    expect(getAuthErrorMessage({ code: 'weak_password' }, t)).toBe('auth.passwordTooShort')
    expect(getAuthErrorMessage({ code: 'same_password' }, t)).toBe('auth.samePassword')
  })

  it('maps rate-limit codes and HTTP 429', () => {
    expect(getAuthErrorMessage({ code: 'over_email_send_rate_limit' }, t)).toBe(
      'auth.tooManyRequests',
    )
    expect(getAuthErrorMessage({ status: 429 }, t)).toBe('auth.tooManyRequests')
  })

  it('falls back to the provided key for unrecognized errors', () => {
    expect(getAuthErrorMessage({ message: 'boom' }, t, 'auth.signUpFailed')).toBe(
      'auth.signUpFailed',
    )
  })

  it('falls back to auth.signInFailed by default', () => {
    expect(getAuthErrorMessage({ message: 'boom' }, t)).toBe('auth.signInFailed')
  })
})

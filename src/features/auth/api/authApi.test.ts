import { describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('@/lib/supabaseClient', () => ({ supabase: { auth } }))

import { authApi } from './authApi'

describe('authApi', () => {
  it('signIn returns the session on success', async () => {
    const session = { access_token: 'token' }
    auth.signInWithPassword.mockResolvedValueOnce({ data: { session, user: null }, error: null })

    const result = await authApi.signIn('a@example.com', 'hunter2')

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@example.com',
      password: 'hunter2',
    })
    expect(result).toBe(session)
  })

  it('signIn throws the Supabase error on failure', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' },
    })

    await expect(authApi.signIn('a@example.com', 'wrong')).rejects.toEqual({
      message: 'Invalid login credentials',
    })
  })

  it('signUp returns signed_in when email confirmation is disabled', async () => {
    const session = { access_token: 'token' }
    auth.signUp.mockResolvedValueOnce({ data: { session, user: null }, error: null })

    const result = await authApi.signUp('a@example.com', 'hunter2')

    expect(result).toEqual({ status: 'signed_in', session })
  })

  it('signUp returns confirmation_required when email confirmation is enabled', async () => {
    auth.signUp.mockResolvedValueOnce({
      data: { session: null, user: { id: '1', identities: [{ id: 'identity-1' }] } },
      error: null,
    })

    const result = await authApi.signUp('a@example.com', 'hunter2')

    expect(result).toEqual({ status: 'confirmation_required' })
  })

  it('signUp returns already_registered when the error says so', async () => {
    auth.signUp.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'User already registered' },
    })

    const result = await authApi.signUp('a@example.com', 'hunter2')

    expect(result).toEqual({ status: 'already_registered' })
  })

  it('signUp returns already_registered when identities is empty and obfuscated', async () => {
    auth.signUp.mockResolvedValueOnce({
      data: { session: null, user: { id: '1', identities: [] } },
      error: null,
    })

    const result = await authApi.signUp('a@example.com', 'hunter2')

    expect(result).toEqual({ status: 'already_registered' })
  })

  it('signUp throws on an unrelated error', async () => {
    auth.signUp.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'network error' },
    })

    await expect(authApi.signUp('a@example.com', 'hunter2')).rejects.toEqual({
      message: 'network error',
    })
  })

  it('signOut throws on failure', async () => {
    auth.signOut.mockResolvedValueOnce({ error: { message: 'network error' } })

    await expect(authApi.signOut()).rejects.toEqual({ message: 'network error' })
  })

  it('signInWithGoogle calls signInWithOAuth with the Google provider and callback redirect', async () => {
    auth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: null })

    await authApi.signInWithGoogle()

    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  })

  it('signInWithGoogle throws the Supabase error on failure', async () => {
    auth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: { message: 'oauth error' } })

    await expect(authApi.signInWithGoogle()).rejects.toEqual({ message: 'oauth error' })
  })

  it('requestPasswordReset calls resetPasswordForEmail with the reset-password redirect', async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null })

    await authApi.requestPasswordReset('a@example.com')

    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('a@example.com', {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  })

  it('requestPasswordReset throws the Supabase error on failure', async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: { message: 'rate limited' },
    })

    await expect(authApi.requestPasswordReset('a@example.com')).rejects.toEqual({
      message: 'rate limited',
    })
  })

  it('updatePassword calls updateUser with the new password', async () => {
    auth.updateUser.mockResolvedValueOnce({ data: {}, error: null })

    await authApi.updatePassword('new-hunter2')

    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-hunter2' })
  })

  it('updatePassword throws the Supabase error on failure', async () => {
    auth.updateUser.mockResolvedValueOnce({ data: {}, error: { message: 'same password' } })

    await expect(authApi.updatePassword('new-hunter2')).rejects.toEqual({
      message: 'same password',
    })
  })
})

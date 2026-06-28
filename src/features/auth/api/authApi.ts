import { supabase, type Session } from '@/lib/supabaseClient'

/**
 * All authentication goes exclusively through the official Supabase client
 * (no custom token handling) — see docs/10-authentication.md and ADR-0009.
 * `AuthProvider` (src/app/providers) consumes the resulting session reactively
 * via `supabase.auth.onAuthStateChange`, so these functions don't need to
 * update any app state themselves; they just perform the operation.
 */
export interface AuthRepository {
  signIn(email: string, password: string): Promise<Session>
  signUp(email: string, password: string): Promise<SignUpOutcome>
  signOut(): Promise<void>
  /** Redirects the browser to Google; never resolves on success. */
  signInWithGoogle(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  updatePassword(newPassword: string): Promise<void>
}

/**
 * `signUp` has three real outcomes depending on the project's "Confirm
 * email" setting and whether the address is already registered — see
 * ADR-0022. Modeled as a discriminated union instead of `{ session }` so
 * callers can't accidentally treat "confirmation required" and "already
 * registered" as the same case.
 */
export type SignUpOutcome =
  | { status: 'signed_in'; session: Session }
  | { status: 'confirmation_required' }
  | { status: 'already_registered' }

export const authApi: AuthRepository = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.session
  },

  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      if (error.message === 'User already registered') {
        return { status: 'already_registered' }
      }
      throw error
    }

    if (data.session) {
      return { status: 'signed_in', session: data.session }
    }

    // When "Confirm email" is on, Supabase deliberately returns no error
    // for a duplicate address — only an empty `identities` array — so a
    // malicious caller can't use signUp to discover which emails exist.
    if (data.user?.identities?.length === 0) {
      return { status: 'already_registered' }
    }

    return { status: 'confirmation_required' }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  },

  async requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },
}

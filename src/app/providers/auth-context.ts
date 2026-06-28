import { createContext } from 'react'
import type { Session, User } from '@/lib/supabaseClient'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  isLoading: boolean
  /**
   * True only while the current session exists because the user just
   * landed via a password-recovery link (Supabase's `PASSWORD_RECOVERY`
   * auth event) — see ResetPasswordForm and ADR-0022. False for an
   * ordinary signed-in session, even though both have a non-null
   * `session`.
   */
  isPasswordRecovery: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

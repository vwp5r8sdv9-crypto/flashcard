import { useEffect, useState, type ReactNode } from 'react'
import { supabase, type Session } from '@/lib/supabaseClient'
import { AuthContext, type AuthContextValue } from './auth-context'

/**
 * Tracks the current Supabase session and exposes it via `useAuth()`.
 * This is infrastructure only — it has no sign-in/sign-up UI or logic.
 * The actual login feature (forms, `authApi.signIn`, etc.) lives in
 * `features/auth` and is built separately — see docs/10-authentication.md.
 *
 * Also tracks the `PASSWORD_RECOVERY` auth event (see ADR-0022). This has
 * to live here, in the one `onAuthStateChange` subscription mounted at
 * the app root, rather than in ResetPasswordPage itself: the event fires
 * once, asynchronously, while supabase-js processes the recovery link's
 * token from the URL during client initialization, and a subscription
 * registered later — e.g. by a lazy-loaded route component — could miss
 * it depending on how long that route's chunk takes to load relative to
 * the token exchange. Subscribing here, synchronously on mount before
 * routing even resolves, avoids that race.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    let isMounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setIsLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return
      setSession(nextSession)
      setIsLoading(false)
      setIsPasswordRecovery(event === 'PASSWORD_RECOVERY')
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isLoading,
    isPasswordRecovery,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

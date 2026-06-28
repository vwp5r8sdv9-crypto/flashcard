import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { env } from './env'

export type { Session, User } from '@supabase/supabase-js'

/**
 * The only Supabase client instance in the app. Per docs/04-architecture.md
 * §Data-access layer, every other file that needs Supabase imports it from
 * here rather than constructing its own client.
 *
 * Typed against src/types/database.ts, hand-written to match
 * supabase/migrations/20260627234219_init_schema.sql — see that file's
 * header for how to replace it with a real generated one later.
 *
 * `flowType: 'pkce'` is set explicitly (the supabase-js default is still
 * 'implicit') because OAuth and password-recovery redirects both rely on
 * it — PKCE keeps the access/refresh tokens out of the redirect URL
 * itself, exchanging a short-lived code for a session instead. See
 * ADR-0022. The other three are already supabase-js's defaults; spelled
 * out here so the contract this app depends on (persisted sessions,
 * silent refresh, automatic detection of auth tokens in the redirect URL)
 * is visible at the one place that configures it, not just inherited.
 */
export const supabase = createClient<Database>(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
)

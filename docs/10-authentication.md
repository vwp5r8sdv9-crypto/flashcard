# Authentication Strategy

## Mechanism

**Decision:** Supabase Auth — email + password, plus Google OAuth — issuing standard JWTs.
**Why:** It's already part of the chosen backend (see [Tech Stack](05-tech-stack.md)) — no separate auth service to run, and it integrates directly with Row Level Security via `auth.uid()` (see [Database Design](07-database-design.md)). Email/password was the lowest-friction option to build first; Google sign-in (ADR-0022) is additive to the same setup, not a separate mechanism.

`supabase-js` handles token storage and silent refresh in the browser — the app does not implement its own token-refresh logic. The client is configured with `flowType: 'pkce'` (`src/lib/supabaseClient.ts`) rather than the library's default implicit flow, so OAuth and password-recovery redirects exchange a short-lived code for a session instead of carrying tokens in the redirect URL — see ADR-0022.

## What ships

- Sign up (email + password) — creates an `auth.users` row; a Postgres trigger creates the matching `profiles` row (see [Database Design](07-database-design.md)). **Built** (ADR-0021, extended by ADR-0022): `authApi.signUp` returns one of three outcomes — signed in immediately (email confirmation disabled), a "check your email" message (confirmation required), or "an account with this email already exists" — and `SignUpForm` handles all three rather than assuming one.
- Sign in / sign out. **Built**: `LoginForm` calls `signInWithPassword`; a `SignOutButton` in the sidebar calls `signOut` and clears the query cache (see ADR-0021).
- Google sign-in. **Built** (ADR-0022): a "Continue with Google" button on both the login and sign-up screens calls `signInWithOAuth`, redirecting through Google and back to `/auth/callback`, which waits for the session to land and then continues into the app (or shows a failure state if the user cancelled or the exchange failed). Requires the Google provider to be configured in the Supabase dashboard — see ADR-0022's Consequences for the setup this app's code can't do on its own.
- Automatic session persistence and restoration on reopen. **Built**: `AuthProvider` (src/app/providers) reads the existing session via `supabase.auth.getSession()` on mount and stays in sync via `onAuthStateChange` — this was infrastructure from day one (ADR-0009), just unused by any real sign-in until ADR-0021.
- Automatic redirect to `/login` when signed out, and away from `/login`/`/signup`/`/forgot-password` when already signed in. **Built**: `RequireAuth` and the symmetric `RedirectIfAuthenticated` (src/app/routes) are applied to every route except `/reset-password` and `/auth/callback`, which are deliberately left unguarded — both routes legitimately acquire a session mid-flow, and the guard would otherwise redirect away before either page can finish (see ADR-0022).
- Password reset via emailed link. **Built** (ADR-0022): a "Forgot your password?" link on `LoginForm` leads to `/forgot-password` (`ForgotPasswordForm`, calling `resetPasswordForEmail`); the emailed link lands on `/reset-password` (`ResetPasswordForm`), which is gated on Supabase's `PASSWORD_RECOVERY` auth event (exposed as `isPasswordRecovery` on `useAuth()`) rather than session presence alone — this is Supabase's recommended pattern, and it's what stops an already-signed-in user (or anyone who just types the URL) from landing on the "set a new password" form. **Known limitation:** because the client uses PKCE, the reset link must be opened in the same browser/device that requested it; opening it elsewhere shows "this reset link is invalid or expired" even though the link itself is still valid.
- Email verification (Supabase Auth built-in; whether to _require_ verification before use is a project-level setting in the Supabase dashboard, not something this app's code controls either way).

## How authorization actually works

**Decision:** The database — not the frontend — is the authorization boundary.

Every table's Row Level Security policy checks `auth.uid()` (the user id embedded in the validated JWT) against row ownership (see [Database Design](07-database-design.md) for the exact policies). The frontend additionally guards routes (redirecting signed-out users away from "your decks," etc.), but that's a UX nicety, not the security mechanism — a client-side check can always be bypassed by calling the API directly, so it must never be the only thing standing between a user and someone else's data.

This is called out explicitly because it's a common mistake: treating "the UI doesn't show a button for it" as if it were "the user can't do it." Here, the actual guarantee comes from Postgres refusing the query.

## Sessions across devices

Each device/browser holds its own session/JWT (refreshed automatically by `supabase-js`). Signing out on one device does not sign out another — this is standard JWT-session behavior and is the expected behavior, not a gap. There's no "active sessions" management UI in the MVP; it's a reasonable post-MVP addition if users ask for it.

## Deliberately deferred

- **Multi-factor authentication** — revisit if/when the user base or data sensitivity justifies the added friction.
- **Magic-link / passwordless sign-in** — a nice-to-have, not core to validating the MVP.
- **Additional OAuth providers** (GitHub, Apple, etc.) — Google (ADR-0022) proved the pattern; adding another is a Supabase dashboard config + a button, not an architecture change.

None of these are blocked by anything in the current design — they're additive to the same Supabase Auth setup.

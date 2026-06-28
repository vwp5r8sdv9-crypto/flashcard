# 0022. Google OAuth Sign-In and Self-Service Password Recovery

**Status:** Accepted
**Date:** 2026-06-28
**Related:** docs/10-authentication.md, ADR-0009, ADR-0020, ADR-0021

## Context

ADR-0021 made email/password sign-in/sign-up real and mandatory, wired to Supabase Auth and RLS-scoped data. At that point docs/10-authentication.md deliberately deferred OAuth providers (listed under "Deliberately deferred") and listed password reset under "Not built yet" — email/password alone was enough to validate the MVP loop. The product now needs both: "Continue with Google" on the login/sign-up screens, and a full forgot-password → email link → set-new-password flow, built to the same production-ready standard as the rest of the authentication flow.

## Problem

How should Google sign-in and the password-recovery flow be implemented so they fit the existing self-contained-form pattern (ADR-0021) and the existing route-guard scheme, follow Supabase's own recommended client configuration, and avoid the guards built for `/login`/`/signup` incorrectly bouncing a user away from a recovery or OAuth callback page mid-flow?

## Alternatives Considered

- **Implicit OAuth flow** (`flowType: 'implicit'`, supabase-js's actual default) — simpler, no code-verifier handling. Rejected: it puts the access/refresh token directly in the redirect URL, which is more exposed than PKCE's short-lived authorization code. Supabase recommends PKCE for both OAuth and password recovery; we follow that despite PKCE's same-browser limitation for recovery links (see Consequences).
- **Gating `/reset-password` on session presence alone** (`if (session) show the form`) — simpler than tracking a specific auth event, but wrong on two counts: it would let an already-signed-in user land on "set a new password" just by visiting the URL, and it's not what Supabase's docs recommend (they recommend reacting to the `PASSWORD_RECOVERY` event from `onAuthStateChange`). Rejected.
- **Wrapping all three new routes in the existing `RedirectIfAuthenticated` guard**, for consistency with `/login`/`/signup` — correct for `/forgot-password` (an already-signed-in user has no reason to be there) but breaks `/reset-password` and `/auth/callback`: both legitimately acquire a real `session` mid-flow (a recovery link creates one; a successful OAuth exchange creates one), and the guard would redirect to `/` before either page finishes its job. Kept the guard only on `/forgot-password`; left the other two unguarded.
- **One shared Google-sign-in block via a render prop or shared parent** between `LoginForm` and `SignUpForm` — considered, to avoid two copies of the button-plus-divider markup. Rejected: the two forms already diverge immediately below it (password field vs. confirm-email messaging), the duplicated block is a few lines, and there's no third use site to justify the abstraction. Extracted only the button itself (`GoogleSignInButton`), not the surrounding divider.

## Decision

We will extend the existing authentication infrastructure rather than build a parallel path:

- `src/lib/supabaseClient.ts` now passes explicit `auth` options to `createClient` — `flowType: 'pkce'` (overriding the library default), plus `persistSession`, `autoRefreshToken`, and `detectSessionInUrl` spelled out even though they already matched the defaults, so the contract this app depends on is visible at its one configuration point.
- `authApi` gains three methods: `signInWithGoogle` (`signInWithOAuth({ provider: 'google' })`, redirecting to `/auth/callback`), `requestPasswordReset` (`resetPasswordForEmail`, redirecting to `/reset-password`), and `updatePassword` (`updateUser({ password })`).
- `authApi.signUp` now returns a `SignUpOutcome` discriminated union — `'signed_in' | 'confirmation_required' | 'already_registered'` — instead of `{ session }`. "Already registered" is detected two ways: the explicit `User already registered` error, and Supabase's anti-enumeration signal (no error, but an empty `identities` array) used when email confirmation is enabled.
- `AuthProvider`/`auth-context` gain `isPasswordRecovery`, set from the `PASSWORD_RECOVERY` event delivered by the existing `onAuthStateChange` subscription. This is the basis for gating `ResetPasswordForm`.
- New routes: `/forgot-password` (wrapped in `RedirectIfAuthenticated`, like `/login`/`/signup`); `/reset-password` and `/auth/callback` (deliberately unguarded — see Alternatives).
- New components: `GoogleSignInButton` (shared by `LoginForm` and `SignUpForm`), `ForgotPasswordForm`, `ResetPasswordForm`, and `AuthCallbackPage`, which waits for `AuthProvider`'s `isLoading` to settle after the OAuth redirect and then either continues into the app or shows a failure state with a way back to `/login`.
- A shared `getAuthErrorMessage` helper (`features/auth/lib`) centralizes Supabase-error-to-translated-message mapping. It matches primarily on auth-js's stable `error.code` values (`invalid_credentials`, `user_already_exists`, `email_exists`, `weak_password`, `same_password`, `over_email_send_rate_limit`, `over_request_rate_limit`, `email_not_confirmed`), keeping the older message-string checks from ADR-0021 as a fallback for GoTrue responses that predate `code`. Every auth form now uses this instead of special-casing its own subset.
- ~28 new translation keys added across all five locales (en/pt/ru/de/ja).

## Consequences

**Positive:**

- Users can sign in/up with Google or recover a forgotten password entirely within the app's own UI, in the same self-contained-form style as the rest of the authentication flow.
- PKCE keeps OAuth authorization codes and recovery tokens out of redirect URLs instead of putting access/refresh tokens there directly.
- Centralized error-message mapping means every current and future auth form shows consistent wording for the same underlying Supabase error, instead of re-deriving the mapping per form.

**Negative / risks:**

- PKCE's code verifier is stored in the requesting browser's local storage, so a password-recovery link must be opened in the same browser/device that requested it — opening it elsewhere fails with "invalid or expired link" even though the link itself hasn't actually expired. This is a known, accepted limitation of PKCE recovery flows, documented here and in docs/10-authentication.md rather than discovered silently later. Revisit only if real users routinely hit this (e.g. requesting a reset on desktop but reading email on mobile); the fallback would be the implicit flow for recovery specifically, trading this limitation for a less secure token-in-URL exchange.
- Google OAuth requires configuration outside this codebase — a Google Cloud Console OAuth client, the corresponding Supabase dashboard provider settings, and a redirect URL allow-list covering both `localhost` and the production Vercel domain — that no amount of application code can substitute for or verify from here.
- `getAuthErrorMessage`'s `error.code` matching assumes a GoTrue server version that populates the documented `ErrorCode` values; an older or self-hosted GoTrue without `code` set falls through to the message-string checks, which is why both are kept rather than dropping the ADR-0021 checks.

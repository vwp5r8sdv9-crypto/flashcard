import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { AuthLayout } from './AuthLayout'
import { RequireAuth } from './RequireAuth'
import { RedirectIfAuthenticated } from './RedirectIfAuthenticated'
import { NotFoundPage } from './NotFoundPage'

// Page components are lazy-loaded per route (React Router's `lazy` route
// field) rather than imported eagerly: each page pulls in its own feature
// code (forms, dialogs, etc.) that the *other* pages don't need on first
// paint, and splitting at this boundary is what keeps the initial bundle
// from bundling every page's code into one chunk — see ADR-0019.
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/',
            lazy: () => import('./HomePage').then((m) => ({ Component: m.HomePage })),
          },
          {
            path: '/decks',
            lazy: () => import('./DecksPage').then((m) => ({ Component: m.DecksPage })),
          },
          {
            path: '/decks/:deckId',
            lazy: () => import('./DeckDetailPage').then((m) => ({ Component: m.DeckDetailPage })),
          },
          {
            path: '/settings',
            lazy: () => import('./SettingsPage').then((m) => ({ Component: m.SettingsPage })),
          },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        element: <RedirectIfAuthenticated />,
        children: [
          {
            path: '/login',
            lazy: () => import('./LoginPage').then((m) => ({ Component: m.LoginPage })),
          },
          {
            path: '/signup',
            lazy: () => import('./SignUpPage').then((m) => ({ Component: m.SignUpPage })),
          },
          {
            path: '/forgot-password',
            lazy: () =>
              import('./ForgotPasswordPage').then((m) => ({ Component: m.ForgotPasswordPage })),
          },
        ],
      },
      // Deliberately NOT wrapped in RedirectIfAuthenticated: clicking a
      // valid password-recovery link creates a real session, which that
      // guard would treat as "already signed in" and bounce to / before
      // the reset form ever renders. Same reasoning keeps the OAuth
      // callback unguarded — see AuthCallbackPage and ADR-0022.
      {
        path: '/reset-password',
        lazy: () => import('./ResetPasswordPage').then((m) => ({ Component: m.ResetPasswordPage })),
      },
      {
        path: '/auth/callback',
        lazy: () => import('./AuthCallbackPage').then((m) => ({ Component: m.AuthCallbackPage })),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

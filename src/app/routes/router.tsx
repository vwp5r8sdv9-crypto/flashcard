import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from './RootLayout'
import { HomePage } from './HomePage'
import { LoginPage } from './LoginPage'
import { SignUpPage } from './SignUpPage'
import { NotFoundPage } from './NotFoundPage'

// `RequireAuth` (./RequireAuth.tsx) is built and ready, but not applied here
// yet: sign-in is still simulated (no real session ever exists), so the
// guard would only bounce every visit straight back to /login. Once
// LoginPage calls real Supabase Auth, wrap the index route below with
// `{ element: <RequireAuth />, children: [...] }` — see ADR-0009.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignUpPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

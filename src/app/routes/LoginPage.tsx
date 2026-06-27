import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/Card'
import { Logo } from '@/components/Logo'
import { LoginForm } from '@/features/auth/components/LoginForm'

/**
 * Real sign-in UI, simulated sign-in logic. Submitting just navigates home —
 * swapping this handler for a real `authApi.signIn` call (and surfacing its
 * errors) is the only change needed once Supabase Auth is wired up; the form
 * itself does not change. See docs/10-authentication.md and ADR-0009.
 */
export function LoginPage() {
  const navigate = useNavigate()

  function handleSubmit() {
    void navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-lg font-semibold">Sign in to your account</h1>
        </div>
        <LoginForm onSubmit={handleSubmit} />
      </Card>
    </div>
  )
}

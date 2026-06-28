import { Outlet } from 'react-router-dom'

/** Shell for entry-point routes (login/signup) — no sidebar. */
export function AuthLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Outlet />
    </div>
  )
}

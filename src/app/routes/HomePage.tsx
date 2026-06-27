import { Card } from '@/components/Card'
import { Logo } from '@/components/Logo'

/**
 * Temporary landing screen. Proves routing/theming work end to end — the
 * real decks feature (docs/08-user-flows.md §1) replaces the placeholder
 * card below in a later module.
 */
export function HomePage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-10">
        <Logo />
      </header>
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-muted-foreground">Here&apos;s where your decks will live.</p>
      <Card className="mt-6 flex min-h-48 items-center justify-center border-dashed text-muted-foreground">
        Your decks will appear here.
      </Card>
    </div>
  )
}

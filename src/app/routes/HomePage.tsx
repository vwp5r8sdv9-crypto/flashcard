import { Logo } from '@/components/Logo'
import { DeckList } from '@/features/decks/components/DeckList'

export function HomePage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-8">
        <Logo />
      </header>
      <DeckList />
    </div>
  )
}

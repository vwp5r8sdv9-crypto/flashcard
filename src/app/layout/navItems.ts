import { Home, Layers, Settings } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/home', labelKey: 'nav.home', icon: Home },
  { to: '/decks', labelKey: 'nav.decks', icon: Layers },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
] as const

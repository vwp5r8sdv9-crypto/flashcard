import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './navItems'

interface SidebarNavLinksProps {
  /** Called after a link is activated — used to close the mobile drawer. */
  onNavigate?: () => void
}

/** The actual Home/Decks/Settings links, shared by the desktop Sidebar and MobileDrawer. */
export function SidebarNavLinks({ onNavigate }: SidebarNavLinksProps) {
  const { t } = useTranslation()

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/home'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
          {t(labelKey)}
        </NavLink>
      ))}
    </nav>
  )
}

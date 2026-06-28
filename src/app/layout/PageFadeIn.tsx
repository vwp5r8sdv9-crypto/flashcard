import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Keying by pathname forces a remount on navigation, which is what retriggers
 * the CSS animation below (a stable element wouldn't replay it).
 */
export function PageFadeIn({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="animate-page-fade-in">
      {children}
    </div>
  )
}

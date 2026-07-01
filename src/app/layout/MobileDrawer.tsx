import { X } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/IconButton'
import { Logo } from '@/components/Logo'
import { SidebarNavLinks } from './SidebarNavLinks'
import { SidebarFooter } from './SidebarFooter'

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Right-anchored slide-in drawer for mobile navigation. Anchored on the same
 * side as the menu button in MobileNav. Built on Radix Dialog primitives for
 * focus trap / ESC / overlay-click without the overhead of a custom modal.
 */
export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const { t } = useTranslation()

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 lg:hidden" />
        <DialogPrimitive.Content className="animate-drawer-in-right fixed inset-y-0 right-0 z-50 flex w-64 flex-col gap-6 bg-background p-4 shadow-[-2px_0_24px_rgba(0,0,0,0.12)] focus:outline-none lg:hidden">
          <DialogPrimitive.Title className="sr-only">{t('nav.openMenu')}</DialogPrimitive.Title>
          <div className="flex items-center justify-between">
            <Logo />
            <DialogPrimitive.Close asChild>
              <IconButton icon={X} label={t('nav.closeMenu')} className="text-muted-foreground" />
            </DialogPrimitive.Close>
          </div>
          <SidebarNavLinks onNavigate={() => onOpenChange(false)} />
          <SidebarFooter />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

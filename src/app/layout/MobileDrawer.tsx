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
 * Left-anchored slide-in drawer for mobile navigation. Built directly on
 * Radix's Dialog primitives rather than the shared `Dialog` component,
 * since that one is shaped for centered content dialogs, not a full-height
 * side panel — Radix still gives focus trap / ESC / overlay-click for free.
 */
export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const { t } = useTranslation()

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 lg:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-6 bg-background p-4 shadow-lg focus:outline-none lg:hidden">
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

import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/IconButton'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

/**
 * Thin Tailwind skin over Radix's Dialog primitive — focus trap, ESC to
 * close, and overlay-click to close all come from Radix for free. This is
 * the one base modal used by every dialog in the app (see ConfirmDialog).
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const { t } = useTranslation()

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-[6vh] z-50 max-h-[88dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-y-auto rounded-[28px] bg-card p-6 shadow-lg focus:outline-none data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out sm:top-1/2 sm:max-h-[85vh] sm:-translate-y-1/2',
            className,
          )}
        >
          <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          )}
          <div className="mt-5">{children}</div>
          <DialogPrimitive.Close asChild>
            <IconButton
              icon={X}
              label={t('common.close')}
              className="absolute right-4 top-4 text-muted-foreground"
            />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type IconButtonVariant = 'default' | 'destructive'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon
  label: string
  variant?: IconButtonVariant
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: 'hover:bg-border hover:text-foreground',
  destructive: 'hover:bg-border hover:text-destructive',
}

/** A small icon-only button with a ~36px hit area and a visible focus ring — used for inline row actions like edit/delete. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, variant = 'default', className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex min-h-9 min-w-9 items-center justify-center rounded-md transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  ),
)
IconButton.displayName = 'IconButton'

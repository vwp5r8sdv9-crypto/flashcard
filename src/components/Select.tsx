import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  children: ReactNode
}

/**
 * A native <select>, not a custom listbox — keyboard nav, screen readers,
 * and the mobile native picker UI all come for free, for a control that
 * doesn't need anything a custom dropdown would add. Mirrors TextField's
 * API so the two compose the same way in forms.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, className, children, ...props }, ref) => {
    const generatedId = useId()
    const selectId = id ?? generatedId

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium">
          {label}
        </label>
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-11 rounded-2xl border border-border bg-card-soft px-4 text-base outline-none focus:ring-2 focus:ring-primary',
            error && 'border-destructive',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'

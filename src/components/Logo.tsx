import { cn } from '@/lib/utils'

/** App wordmark — icon adapts to light/dark via CSS variables. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground"
      >
        {/* Two stacked cards — back card at reduced opacity, front card full */}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="11" height="8" rx="2" fill="currentColor" opacity="0.28" />
          <rect x="4" y="6" width="11" height="8" rx="2" fill="currentColor" />
        </svg>
      </span>
      <span className="font-semibold tracking-tight">Flashcards</span>
    </div>
  )
}

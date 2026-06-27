import { cn } from '@/lib/utils'

/** Placeholder wordmark — swap the glyph for a real logo when one exists. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="4" width="11" height="8" rx="1.5" fill="currentColor" opacity="0.5" />
          <rect x="3.5" y="2" width="11" height="8" rx="1.5" fill="currentColor" />
        </svg>
      </span>
      <span className="font-semibold tracking-tight">Flashcards</span>
    </div>
  )
}

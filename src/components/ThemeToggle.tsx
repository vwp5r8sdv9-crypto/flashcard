import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/app/providers/useTheme'
import type { Theme } from '@/app/providers/theme-context'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Theme; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
]

/** A three-way Light/Dark/System segmented control backed by ThemeProvider. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <div
      role="radiogroup"
      aria-label={t('settings.theme')}
      className="inline-flex rounded-md border border-border bg-muted p-1"
    >
      {OPTIONS.map(({ value, icon: Icon }) => {
        const selected = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(`settings.theme_${value}`)}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-sm px-3 text-sm font-medium transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {t(`settings.theme_${value}`)}
          </button>
        )
      })}
    </div>
  )
}

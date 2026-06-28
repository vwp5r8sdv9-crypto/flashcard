import { useState } from 'react'
import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/IconButton'
import { Logo } from '@/components/Logo'
import { MobileDrawer } from './MobileDrawer'

/** Top bar shown only below the lg breakpoint, opening MobileDrawer. */
export function MobileNav() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="flex items-center justify-between border-b border-border p-4 lg:hidden">
        <Logo />
        <IconButton
          icon={Menu}
          label={t('nav.openMenu')}
          onClick={() => setIsOpen(true)}
          className="text-muted-foreground"
        />
      </header>
      <MobileDrawer open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}

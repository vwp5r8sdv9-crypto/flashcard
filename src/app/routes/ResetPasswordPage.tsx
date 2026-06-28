import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { Logo } from '@/components/Logo'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'

export function ResetPasswordPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-lg font-semibold">{t('auth.resetPasswordTitle')}</h1>
        </div>
        <ResetPasswordForm />
      </Card>
    </div>
  )
}

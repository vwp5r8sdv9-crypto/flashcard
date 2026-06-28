import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { Logo } from '@/components/Logo'
import { SignUpForm } from '@/features/auth/components/SignUpForm'

export function SignUpPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-lg font-semibold">{t('auth.signUpToAccount')}</h1>
        </div>
        <SignUpForm />
      </Card>
    </div>
  )
}

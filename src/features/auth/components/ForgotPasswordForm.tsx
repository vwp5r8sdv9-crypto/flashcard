import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { useRequestPasswordReset } from '../hooks/useRequestPasswordReset'
import { getAuthErrorMessage } from '../lib/authErrorMessage'

interface ForgotPasswordFormValues {
  email: string
}

/**
 * Supabase's `resetPasswordForEmail` never reveals whether the address is
 * registered (anti-enumeration), so the success state below is shown
 * unconditionally once the request completes without a network/rate-limit
 * error — never "no account found for that email". See ADR-0022.
 */
export function ForgotPasswordForm() {
  const { t } = useTranslation()
  const requestPasswordReset = useRequestPasswordReset()
  const [sentTo, setSentTo] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailInvalid')),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(schema) })

  function onSubmit(values: ForgotPasswordFormValues) {
    requestPasswordReset.mutate(values.email, {
      onSuccess: () => setSentTo(values.email),
    })
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-sm text-muted-foreground" role="status">
          {t('auth.resetLinkSent', { email: sentTo })}
        </p>
        <Link
          to="/login"
          className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('auth.backToLogin')}
        </Link>
      </div>
    )
  }

  const errorMessage = requestPasswordReset.isError
    ? getAuthErrorMessage(requestPasswordReset.error, t, 'auth.requestResetLinkFailed')
    : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-muted-foreground">{t('auth.forgotPasswordInstructions')}</p>
      <TextField
        label={t('auth.email')}
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      {errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={requestPasswordReset.isPending}
        aria-busy={requestPasswordReset.isPending}
      >
        {requestPasswordReset.isPending ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
      </Button>
      <Link
        to="/login"
        className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t('auth.backToLogin')}
      </Link>
    </form>
  )
}

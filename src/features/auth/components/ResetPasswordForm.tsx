import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/app/providers/useAuth'
import { useUpdatePassword } from '../hooks/useUpdatePassword'
import { getAuthErrorMessage } from '../lib/authErrorMessage'

interface ResetPasswordFormValues {
  newPassword: string
  confirmPassword: string
}

/**
 * Gated on `isPasswordRecovery` from AuthProvider (set when Supabase fires
 * its `PASSWORD_RECOVERY` auth event) rather than on session presence —
 * this is Supabase's recommended way to drive a password-recovery screen,
 * and it's what stops an ordinary signed-in session (or someone who just
 * types this URL) from landing on the reset form. See ADR-0022.
 */
export function ResetPasswordForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isLoading, isPasswordRecovery } = useAuth()
  const updatePassword = useUpdatePassword()
  const [isDone, setIsDone] = useState(false)

  const schema = useMemo(
    () =>
      z
        .object({
          newPassword: z.string().min(6, t('auth.passwordTooShort')),
          confirmPassword: z.string().min(1, t('auth.passwordRequired')),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t('auth.passwordsDontMatch'),
          path: ['confirmPassword'],
        }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(schema) })

  function onSubmit(values: ResetPasswordFormValues) {
    updatePassword.mutate(values.newPassword, {
      onSuccess: () => setIsDone(true),
    })
  }

  if (isLoading) {
    return <p className="text-center text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  if (isDone) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-sm text-muted-foreground" role="status">
          {t('auth.passwordUpdated')}
        </p>
        <Button className="w-full" onClick={() => void navigate('/', { replace: true })}>
          {t('auth.continueToApp')}
        </Button>
      </div>
    )
  }

  if (!isPasswordRecovery) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-sm text-destructive" role="alert">
          {t('auth.invalidResetLink')}
        </p>
        <Link
          to="/forgot-password"
          className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('auth.requestNewResetLink')}
        </Link>
      </div>
    )
  }

  const errorMessage = updatePassword.isError
    ? getAuthErrorMessage(updatePassword.error, t, 'auth.updatePasswordFailed')
    : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <TextField
        label={t('auth.newPassword')}
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <TextField
        label={t('auth.confirmPassword')}
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      {errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={updatePassword.isPending}
        aria-busy={updatePassword.isPending}
      >
        {updatePassword.isPending ? t('auth.updatingPassword') : t('auth.updatePassword')}
      </Button>
    </form>
  )
}

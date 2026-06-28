import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { useSignIn } from '../hooks/useSignIn'
import { GoogleSignInButton } from './GoogleSignInButton'
import { getAuthErrorMessage } from '../lib/authErrorMessage'

interface LoginFormValues {
  email: string
  password: string
}

/**
 * Fully self-contained: owns its own submit/error/pending state and the
 * post-success redirect, the same way DeckFormDialog/CardFormDialog own
 * their mutations rather than taking an onSubmit callback prop. Calls
 * Supabase Auth directly through `authApi` — see ADR-0020 and
 * docs/10-authentication.md. AuthProvider picks up the resulting session
 * reactively; this component doesn't need to touch it.
 */
export function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const signIn = useSignIn()

  // Rebuilt whenever the language changes, so already-visible validation
  // messages switch language immediately rather than staying stale.
  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailInvalid')),
        password: z.string().min(1, t('auth.passwordRequired')),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  function onSubmit(values: LoginFormValues) {
    signIn.mutate(values, {
      onSuccess: () => void navigate('/', { replace: true }),
    })
  }

  const errorMessage = signIn.isError
    ? getAuthErrorMessage(signIn.error, t, 'auth.signInFailed')
    : null

  return (
    <div className="flex flex-col gap-4">
      <GoogleSignInButton />
      <div className="flex items-center gap-3 text-xs text-muted-foreground" role="separator">
        <span className="h-px flex-1 bg-border" />
        {t('auth.orContinueWithEmail')}
        <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="flex flex-col gap-1.5">
          <TextField
            label={t('auth.password')}
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Link
            to="/forgot-password"
            className="self-end text-sm text-primary underline-offset-4 hover:underline"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>
        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={signIn.isPending}
          aria-busy={signIn.isPending}
        >
          {signIn.isPending ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link
            to="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('auth.createAccount')}
          </Link>
        </p>
      </form>
    </div>
  )
}

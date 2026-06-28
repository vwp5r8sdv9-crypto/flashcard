import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { useSignUp } from '../hooks/useSignUp'
import { GoogleSignInButton } from './GoogleSignInButton'
import { getAuthErrorMessage } from '../lib/authErrorMessage'

interface SignUpFormValues {
  email: string
  password: string
}

/**
 * Self-contained, same shape as LoginForm. `authApi.signUp` resolves to one
 * of three outcomes — signed in immediately, confirmation email sent, or
 * the address is already registered — modeled as a discriminated union
 * (`SignUpOutcome`) rather than assuming one. See ADR-0022 and
 * docs/10-authentication.md.
 */
export function SignUpForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const signUp = useSignUp()
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)

  const signUpSchema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailInvalid')),
        password: z.string().min(6, t('auth.passwordTooShort')),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({ resolver: zodResolver(signUpSchema) })

  function onSubmit(values: SignUpFormValues) {
    setAlreadyRegistered(false)
    signUp.mutate(values, {
      onSuccess: (outcome) => {
        if (outcome.status === 'signed_in') {
          void navigate('/', { replace: true })
        } else if (outcome.status === 'confirmation_required') {
          setConfirmationSentTo(values.email)
        } else {
          setAlreadyRegistered(true)
        }
      },
    })
  }

  if (confirmationSentTo) {
    return (
      <p className="text-center text-sm text-muted-foreground" role="status">
        {t('auth.confirmEmailSent', { email: confirmationSentTo })}
      </p>
    )
  }

  const errorMessage = signUp.isError
    ? getAuthErrorMessage(signUp.error, t, 'auth.signUpFailed')
    : alreadyRegistered
      ? t('auth.emailAlreadyRegistered')
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
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
            {alreadyRegistered && (
              <>
                {' '}
                <Link to="/login" className="font-medium underline-offset-4 hover:underline">
                  {t('auth.signIn')}
                </Link>
              </>
            )}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={signUp.isPending}
          aria-busy={signUp.isPending}
        >
          {signUp.isPending ? t('auth.creatingAccount') : t('auth.createAccount')}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </form>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { SpeakButton } from '@/components/SpeakButton'
import type { LanguageCode } from '@/lib/languages'
import { useCreateCard } from '../hooks/useCreateCard'

interface CardAddFormProps {
  deckId: string
  language: LanguageCode
}

interface FormValues {
  front: string
  back: string
  pronunciation?: string
  exampleSentence?: string
  notes?: string
}

export function CardAddForm({ deckId, language }: CardAddFormProps) {
  const { t } = useTranslation()
  const createCard = useCreateCard()
  const [showSuccess, setShowSuccess] = useState(false)

  const schema = useMemo(
    () =>
      z.object({
        front: z.string().min(1, t('cards.frontRequired')),
        back: z.string().min(1, t('cards.backRequired')),
        pronunciation: z.string().optional(),
        exampleSentence: z.string().optional(),
        notes: z.string().optional(),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      front: '',
      back: '',
      pronunciation: '',
      exampleSentence: '',
      notes: '',
    } satisfies FormValues,
  })

  const front = useWatch({ control, name: 'front' })
  const back = useWatch({ control, name: 'back' })

  function blankToNull(v: string | undefined): string | null {
    return v?.trim() ? v.trim() : null
  }

  function onSubmit(values: FormValues) {
    createCard.mutate(
      {
        deckId,
        front: values.front.trim(),
        back: values.back.trim(),
        pronunciation: blankToNull(values.pronunciation),
        exampleSentence: blankToNull(values.exampleSentence),
        notes: blankToNull(values.notes),
      },
      {
        onSuccess: () => {
          reset()
          setShowSuccess(true)
          setTimeout(() => {
            setShowSuccess(false)
          }, 2500)
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 pt-2" noValidate>
      {showSuccess && (
        <p className="rounded-2xl bg-muted px-4 py-2.5 text-sm font-medium text-foreground">
          {t('cards.addedConfirmation')}
        </p>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label={t('cards.front')}
            error={errors.front?.message}
            autoFocus
            {...register('front')}
          />
        </div>
        <SpeakButton text={front} lang={language} />
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField label={t('cards.back')} error={errors.back?.message} {...register('back')} />
        </div>
        <SpeakButton text={back} lang={language} />
      </div>

      <TextField
        label={`${t('cards.pronunciation')} (${t('common.optional')})`}
        {...register('pronunciation')}
      />
      <TextField
        label={`${t('cards.exampleSentence')} (${t('common.optional')})`}
        {...register('exampleSentence')}
      />
      <TextField label={`${t('cards.notes')} (${t('common.optional')})`} {...register('notes')} />

      {createCard.error && (
        <p className="text-sm text-destructive">{t('common.somethingWentWrong')}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={createCard.isPending}>
          {t('cards.createCard')}
        </Button>
      </div>
    </form>
  )
}

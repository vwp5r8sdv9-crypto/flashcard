import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@/components/Dialog'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { SpeakButton } from '@/components/SpeakButton'
import type { LanguageCode } from '@/lib/languages'
import { useCreateCard } from '../hooks/useCreateCard'
import { useUpdateCard } from '../hooks/useUpdateCard'
import type { Card } from '../types'

interface CardFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deckId: string
  /** The deck's study language — used to pronounce the front/back fields while editing. */
  language: LanguageCode
  /** Pass a card to edit it; omit to create a new one. */
  card?: Card | null
}

interface CardFormValues {
  front: string
  back: string
  pronunciation?: string
  notes?: string
  exampleSentence?: string
}

function toDefaultValues(card?: Card | null): CardFormValues {
  return {
    front: card?.front ?? '',
    back: card?.back ?? '',
    pronunciation: card?.pronunciation ?? '',
    notes: card?.notes ?? '',
    exampleSentence: card?.exampleSentence ?? '',
  }
}

export function CardFormDialog({
  open,
  onOpenChange,
  deckId,
  language,
  card,
}: CardFormDialogProps) {
  const { t } = useTranslation()
  const isEditing = Boolean(card)
  const createCard = useCreateCard()
  const updateCard = useUpdateCard()

  const cardFormSchema = useMemo(
    () =>
      z.object({
        front: z.string().min(1, t('cards.frontRequired')),
        back: z.string().min(1, t('cards.backRequired')),
        pronunciation: z.string().optional(),
        notes: z.string().optional(),
        exampleSentence: z.string().optional(),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: toDefaultValues(card),
  })
  const front = useWatch({ control, name: 'front' })
  const back = useWatch({ control, name: 'back' })

  useEffect(() => {
    if (open) reset(toDefaultValues(card))
  }, [open, card, reset])

  function blankToNull(value: string | undefined): string | null {
    return value?.trim() ? value.trim() : null
  }

  function onSubmit(values: CardFormValues) {
    const input = {
      front: values.front.trim(),
      back: values.back.trim(),
      pronunciation: blankToNull(values.pronunciation),
      notes: blankToNull(values.notes),
      exampleSentence: blankToNull(values.exampleSentence),
    }
    const onSuccess = () => onOpenChange(false)

    if (isEditing && card) {
      updateCard.mutate({ id: card.id, deckId: card.deckId, input }, { onSuccess })
    } else {
      createCard.mutate({ ...input, deckId }, { onSuccess })
    }
  }

  const isSubmitting = createCard.isPending || updateCard.isPending
  const mutationError = createCard.error ?? updateCard.error

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? t('cards.editCard') : t('cards.newCard')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <TextField
              label={t('cards.front')}
              error={errors.front?.message}
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
        {mutationError && (
          <p className="text-sm text-destructive">{t('common.somethingWentWrong')}</p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isEditing ? t('cards.saveChanges') : t('cards.createCard')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

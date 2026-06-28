import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@/components/Dialog'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { Select } from '@/components/Select'
import { LANGUAGE_CODES, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languages'
import { useCreateDeck } from '../hooks/useCreateDeck'
import { useUpdateDeck } from '../hooks/useUpdateDeck'
import { DeckColorPicker } from './DeckColorPicker'
import { DEFAULT_DECK_COLOR } from './deckColors'
import type { Deck } from '../types'

interface DeckFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass a deck to edit it; omit to create a new one. */
  deck?: Deck | null
}

function toDefaultValues(deck?: Deck | null) {
  return {
    name: deck?.name ?? '',
    language: deck?.language ?? LANGUAGE_CODES[0],
    color: deck?.color ?? DEFAULT_DECK_COLOR,
  }
}

export function DeckFormDialog({ open, onOpenChange, deck }: DeckFormDialogProps) {
  const { t } = useTranslation()
  const isEditing = Boolean(deck)
  const createDeck = useCreateDeck()
  const updateDeck = useUpdateDeck()

  const deckFormSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('decks.nameRequired')).max(60, t('decks.nameTooLong')),
        language: z.enum(LANGUAGE_CODES, { message: t('decks.languageRequired') }),
        color: z.string().min(1, t('decks.colorRequired')),
      }),
    [t],
  )

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ name: string; language: LanguageCode; color: string }>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: toDefaultValues(deck),
  })

  // Re-sync the form whenever the dialog opens for a (possibly different) deck.
  useEffect(() => {
    if (open) reset(toDefaultValues(deck))
  }, [open, deck, reset])

  function onSubmit(values: { name: string; language: LanguageCode; color: string }) {
    const input = { name: values.name.trim(), language: values.language, color: values.color }
    const onSuccess = () => onOpenChange(false)

    if (isEditing && deck) {
      updateDeck.mutate({ id: deck.id, input }, { onSuccess })
    } else {
      createDeck.mutate(input, { onSuccess })
    }
  }

  const isSubmitting = createDeck.isPending || updateDeck.isPending
  const mutationError = createDeck.error ?? updateDeck.error

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? t('decks.editDeck') : t('decks.newDeck')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <TextField label={t('decks.name')} error={errors.name?.message} {...register('name')} />
        <Select
          label={t('decks.language')}
          error={errors.language?.message}
          {...register('language')}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.flag} {t(`languages.${language.code}`)}
            </option>
          ))}
        </Select>
        <Controller
          control={control}
          name="color"
          render={({ field }) => <DeckColorPicker value={field.value} onChange={field.onChange} />}
        />
        {mutationError && (
          <p className="text-sm text-destructive">{t('common.somethingWentWrong')}</p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isEditing ? t('decks.saveChanges') : t('decks.createDeck')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

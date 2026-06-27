import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@/components/Dialog'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { useCreateDeck } from '../hooks/useCreateDeck'
import { useUpdateDeck } from '../hooks/useUpdateDeck'
import { DeckColorPicker } from './DeckColorPicker'
import { DEFAULT_DECK_COLOR } from './deckColors'
import type { Deck } from '../types'

const deckFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60, 'Keep it under 60 characters'),
  language: z.string().max(40, 'Keep it under 40 characters').optional(),
  color: z.string().min(1, 'Pick a color'),
})

type DeckFormValues = z.infer<typeof deckFormSchema>

interface DeckFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass a deck to edit it; omit to create a new one. */
  deck?: Deck | null
}

function toDefaultValues(deck?: Deck | null): DeckFormValues {
  return {
    name: deck?.name ?? '',
    language: deck?.language ?? '',
    color: deck?.color ?? DEFAULT_DECK_COLOR,
  }
}

export function DeckFormDialog({ open, onOpenChange, deck }: DeckFormDialogProps) {
  const isEditing = Boolean(deck)
  const createDeck = useCreateDeck()
  const updateDeck = useUpdateDeck()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeckFormValues>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: toDefaultValues(deck),
  })

  // Re-sync the form whenever the dialog opens for a (possibly different) deck.
  useEffect(() => {
    if (open) reset(toDefaultValues(deck))
  }, [open, deck, reset])

  function onSubmit(values: DeckFormValues) {
    const input = {
      name: values.name.trim(),
      language: values.language?.trim() ? values.language.trim() : null,
      color: values.color,
    }

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
    <Dialog open={open} onOpenChange={onOpenChange} title={isEditing ? 'Edit deck' : 'New deck'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label="Name" error={errors.name?.message} {...register('name')} />
        <TextField
          label="Language (optional)"
          error={errors.language?.message}
          {...register('language')}
        />
        <Controller
          control={control}
          name="color"
          render={({ field }) => <DeckColorPicker value={field.value} onChange={field.onChange} />}
        />
        {mutationError && (
          <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isEditing ? 'Save changes' : 'Create deck'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

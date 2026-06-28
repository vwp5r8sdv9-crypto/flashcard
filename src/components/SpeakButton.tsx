import { Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { speak, useVoices } from '@/lib/speech'
import type { LanguageCode } from '@/lib/languages'
import { IconButton } from './IconButton'

interface SpeakButtonProps {
  text: string
  lang: LanguageCode
  className?: string
}

const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

/** Renders nothing when the browser has no SpeechSynthesis support — see ADR-0025. */
export function SpeakButton({ text, lang, className }: SpeakButtonProps) {
  const { t } = useTranslation()
  const voices = useVoices()

  if (!isSpeechSupported) return null

  return (
    <IconButton
      icon={Volume2}
      label={t('common.playPronunciation')}
      onClick={() => speak(text, lang, voices)}
      className={className}
    />
  )
}

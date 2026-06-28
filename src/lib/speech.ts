import { useEffect, useState } from 'react'
import type { LanguageCode } from './languages'

function getVoices(): SpeechSynthesisVoice[] {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis.getVoices()
    : []
}

/**
 * Voices typically load asynchronously after page load (most browsers fire
 * `voiceschanged` once, shortly after `getVoices()` first returns `[]`) —
 * this re-renders the consumer when that happens.
 */
export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(getVoices)

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    function handleVoicesChanged() {
      setVoices(getVoices())
    }
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
  }, [])

  return voices
}

/**
 * Matches by BCP-47 primary subtag — the app's language codes (en/pt/ru/de/ja)
 * are themselves valid prefixes (e.g. `en` matches a voice tagged `en-US`).
 * Prefers the browser's marked-default voice among matches.
 */
export function pickBestVoice(
  lang: LanguageCode,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const candidates = voices.filter((voice) => voice.lang.toLowerCase().startsWith(lang))
  return candidates.find((voice) => voice.default) ?? candidates[0] ?? null
}

/**
 * Speaks `text` in `lang`, cancelling any utterance already in flight so
 * rapid clicks (e.g. front then back) don't overlap. No-ops if the browser
 * has no SpeechSynthesis support, or if no voice is available for `lang` —
 * see ADR-0025 for why that's an accepted limitation rather than an error.
 */
export function speak(text: string, lang: LanguageCode, voices: SpeechSynthesisVoice[]) {
  if (!('speechSynthesis' in window) || !text.trim()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  const voice = pickBestVoice(lang, voices)
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

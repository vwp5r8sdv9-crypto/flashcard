import { describe, expect, it } from 'vitest'
import { pickBestVoice } from './speech'

function voice(overrides: Partial<SpeechSynthesisVoice> = {}): SpeechSynthesisVoice {
  return {
    voiceURI: 'voice',
    name: 'voice',
    lang: 'en-US',
    default: false,
    localService: true,
    ...overrides,
  }
}

describe('pickBestVoice', () => {
  it('matches a voice whose lang starts with the requested language code', () => {
    const voices = [voice({ lang: 'fr-FR' }), voice({ lang: 'en-US', name: 'match' })]

    expect(pickBestVoice('en', voices)?.name).toBe('match')
  })

  it('prefers the browser-marked default among matching voices', () => {
    const voices = [
      voice({ lang: 'en-GB', name: 'non-default' }),
      voice({ lang: 'en-US', name: 'default', default: true }),
    ]

    expect(pickBestVoice('en', voices)?.name).toBe('default')
  })

  it('matches case-insensitively', () => {
    const voices = [voice({ lang: 'EN-us', name: 'match' })]

    expect(pickBestVoice('en', voices)?.name).toBe('match')
  })

  it('returns null when no voice matches the language', () => {
    const voices = [voice({ lang: 'fr-FR' })]

    expect(pickBestVoice('ja', voices)).toBeNull()
  })

  it('returns null for an empty voice list', () => {
    expect(pickBestVoice('en', [])).toBeNull()
  })
})

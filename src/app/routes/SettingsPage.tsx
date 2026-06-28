import { useTranslation } from 'react-i18next'
import { Select } from '@/components/Select'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SUPPORTED_LANGUAGES } from '@/lib/languages'

export function SettingsPage() {
  const { t, i18n } = useTranslation()

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-display-1">{t('settings.title')}</h1>

      <div className="mt-6 max-w-xs">
        <Select
          label={t('settings.language')}
          value={i18n.language}
          onChange={(event) => void i18n.changeLanguage(event.target.value)}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.flag} {language.nativeName}
            </option>
          ))}
        </Select>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('settings.languageDescription')}</p>
      </div>

      <div className="mt-6 max-w-xs">
        <span className="text-sm font-medium">{t('settings.theme')}</span>
        <div className="mt-1.5">
          <ThemeToggle />
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('settings.themeDescription')}</p>
      </div>
    </div>
  )
}

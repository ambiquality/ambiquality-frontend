import { ButtonGroup, Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '@/i18n';

/**
 * Always-available cs⇄en language switch (POU). Rendered as a small segmented control: one
 * button per supported language, the active one marked with `aria-pressed` (toggle-button
 * semantics) so screen readers announce the current language. Selecting a language calls
 * `i18n.changeLanguage`, which both re-renders translated UI live and — via the i18next
 * language detector's `cacheUserLanguage` — persists the choice to `localStorage` (`amq.lang`).
 *
 * Keyboard-operable by construction (native `<button>`s); accessible group label from i18n.
 */
export function LanguageSwitch() {
  const { t, i18n } = useTranslation('common');
  const current = (i18n.resolvedLanguage ?? i18n.language) as Language;

  return (
    <ButtonGroup size="sm" variant="outline" attached role="group" aria-label={t('language.label')}>
      {SUPPORTED_LANGUAGES.map((lng) => {
        const isActive = current === lng;
        return (
          <Button
            key={lng}
            onClick={() => void i18n.changeLanguage(lng)}
            aria-pressed={isActive}
            aria-label={t('language.switchTo', { language: t(`language.${lng}`) })}
            variant={isActive ? 'solid' : 'outline'}
            colorPalette="brand"
          >
            {lng.toUpperCase()}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}

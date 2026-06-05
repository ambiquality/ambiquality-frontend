import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  DEFAULT_NAMESPACE,
  NAMESPACES,
  resources,
  SUPPORTED_LANGUAGES,
  type Language,
} from './resources';

/** localStorage key the explicit language choice is persisted under (POU: persisted across sessions). */
export const LANGUAGE_STORAGE_KEY = 'amq.lang';

/**
 * react-i18next initialization (Phase 3, POU).
 *
 * - Resources for cs + en are bundled inline (no async backend) — small dictionary, fast first paint.
 * - Language detection order: an explicit choice persisted in `localStorage` wins; otherwise we
 *   fall back to the browser's `navigator` language, then to `en`.
 * - `LanguageSwitch` calls `i18n.changeLanguage(...)`; the detector's `cacheUserLanguage` then
 *   writes the choice back to `localStorage` so it survives reloads.
 *
 * Codelist labels are intentionally NOT part of these resources — see `src/i18n/README.md`.
 */
export const FALLBACK_LANGUAGE: Language = 'en';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: FALLBACK_LANGUAGE,
    ns: NAMESPACES,
    defaultNS: DEFAULT_NAMESPACE,
    nonExplicitSupportedLngs: true, // treat `en-US` etc. as `en`
    detection: {
      // Persisted explicit choice first, then the browser, then the html lang attribute.
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes; no XSS surface here.
    },
    returnNull: false,
  });

export default i18n;

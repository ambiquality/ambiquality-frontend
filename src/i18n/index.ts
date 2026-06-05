export { default as i18n, LANGUAGE_STORAGE_KEY, FALLBACK_LANGUAGE } from './config';
export { I18nProvider } from './I18nProvider';
export {
  SUPPORTED_LANGUAGES,
  NAMESPACES,
  DEFAULT_NAMESPACE,
  resources,
  type Language,
} from './resources';
export {
  resolveCodelistLabel,
  useCodelistLabel,
  type CodelistConcept,
  type CodelistScheme,
} from './codelist-labels';

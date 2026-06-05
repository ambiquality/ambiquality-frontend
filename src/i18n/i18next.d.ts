import 'i18next';
import type { en } from './resources/en';

/**
 * Type-safe i18next: tells `useTranslation`/`t` about our namespaces and key shapes, so
 * `t('common:nav.map')` is checked at compile time and typos become type errors.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof en;
  }
}

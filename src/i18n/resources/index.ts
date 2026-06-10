import { cs } from './cs';
import { en } from './en';

/** Supported UI languages (POU: cs + en, language switch always available). */
export const SUPPORTED_LANGUAGES = ['cs', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/** i18next namespaces. `common` is the default; the rest are loaded eagerly (bundled). */
export const NAMESPACES = [
  'common',
  'glossary',
  'forms',
  'errors',
  'account',
  'evidence',
  'map',
  'about',
  'catalog',
  'archive',
  'legal',
  'browse',
  'entity',
] as const;
export const DEFAULT_NAMESPACE = 'common';

/** Eagerly-bundled resources (no async backend; the app ships cs+en inline). */
export const resources = {
  cs,
  en,
} as const;

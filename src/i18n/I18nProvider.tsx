import type { PropsWithChildren } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './config';

/**
 * Mounts the initialized i18next instance into the React tree. Importing `./config` runs
 * `i18n.init(...)` as a side effect (synchronous — resources are bundled), so by the time
 * this provider renders, translations are ready. Mount once near the root, above the router.
 */
export function I18nProvider({ children }: PropsWithChildren) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

/**
 * Shared, hard-coded app constants (not env-driven). Later tasks (footer, privacy, archive)
 * extend this file — keep additions small, public-safe, and free of secrets.
 */

/** GitHub organisation hosting the open-source platform repositories. */
export const GITHUB_ORG_URL = 'https://github.com/ambiquality';

/** Public contact address (NOT the author's personal email — see the About page rule). */
export const CONTACT_EMAIL = 'info@ambiquality.org';

/** Licence under which the platform publishes its open data. */
export const DATA_LICENSE = {
  name: 'CC BY 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
} as const;

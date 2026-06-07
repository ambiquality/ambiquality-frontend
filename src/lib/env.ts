/**
 * Typed, validated access to the build-time environment.
 *
 * Vite inlines `import.meta.env.VITE_*` at build time. We read them once here so the
 * rest of the app imports a typed `env` object instead of touching `import.meta.env`
 * directly (and so a missing var fails fast and loudly rather than silently being
 * `undefined` deep inside a fetch call).
 */

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        'Copy .env.example to .env and fill it in.',
    );
  }
  return value;
}

/** Read an optional boolean flag (`1`/`true` = on). Falls back when unset/empty. */
function optionalBool(name: keyof ImportMetaEnv, fallback: boolean): boolean {
  const value = import.meta.env[name];
  if (value == null || value === '') return fallback;
  return value === '1' || value === 'true';
}

export const env = {
  authApiBase: required('VITE_AUTH_API_BASE'),
  evidenceApiBase: required('VITE_EVIDENCE_API_BASE'),
  publicApiBase: required('VITE_PUBLIC_API_BASE'),
  mapStyleUrl: required('VITE_MAP_STYLE_URL'),
  mapAttribution: required('VITE_MAP_ATTRIBUTION'),
  /**
   * When on, an MSW worker intercepts the map's read endpoints (`/v1/map/snapshot`,
   * `/v1/observations/aggregate`, `/v1/properties`) with synthetic data, so the public map runs
   * end-to-end before the backend ships those endpoints. Defaults on in dev; flip to `0` once the
   * real Public.Api routes exist. Never enabled in a production build.
   */
  enableApiMocks: optionalBool('VITE_ENABLE_API_MOCKS', import.meta.env.DEV),
} as const;

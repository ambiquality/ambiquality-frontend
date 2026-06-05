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

export const env = {
  authApiBase: required('VITE_AUTH_API_BASE'),
  evidenceApiBase: required('VITE_EVIDENCE_API_BASE'),
  publicApiBase: required('VITE_PUBLIC_API_BASE'),
  mapStyleUrl: required('VITE_MAP_STYLE_URL'),
  mapAttribution: required('VITE_MAP_ATTRIBUTION'),
} as const;

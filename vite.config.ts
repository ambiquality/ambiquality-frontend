import { fileURLToPath, URL } from 'node:url';
// `vitest/config` re-exports Vite's `defineConfig` with the `test` field typed (and `configDefaults`
// for extending the default include/exclude globs).
import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Playwright owns `e2e/` (real browser); keep Vitest out of it so the two runners don't both
    // try to execute the `*.spec.ts` files there.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Committed, dummy `VITE_*` values so the typed `env` seam (src/lib/env.ts) resolves when test
    // files import the API clients. These URLs are never hit — tests stub `authClient`/`fetch`.
    // Real dev/prod config lives in `.env` (copied from `.env.example`, gitignored).
    env: {
      VITE_AUTH_API_BASE: 'http://auth.test/auth',
      VITE_EVIDENCE_API_BASE: 'http://evidence.test/evidence',
      VITE_PUBLIC_API_BASE: 'http://public.test/public',
      VITE_MAP_STYLE_URL: 'http://map.test/style.json',
      VITE_MAP_ATTRIBUTION: '© Test',
    },
  },
});

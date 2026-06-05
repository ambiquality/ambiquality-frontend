/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
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

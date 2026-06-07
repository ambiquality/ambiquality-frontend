import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config (Phase 8). Runs the real app in Chromium against a **hermetic** dev server:
 *  - `VITE_ENABLE_API_MOCKS=1` forces the MSW worker on, so the map's data is the deterministic
 *    mock set regardless of the local `.env` (which now points at the live backend) — E2E must not
 *    depend on backend/seed state.
 *  - `VITE_MAP_STYLE_URL` is an inline empty MapLibre style (data URI), so the map mounts without
 *    fetching external basemap tiles — no network flakiness, and the assertions target the DOM
 *    (filter, accessible table, dialog, charts), not the WebGL canvas.
 *
 * A dedicated port (5174) avoids clobbering a dev server you may already have on 5173.
 */
const PORT = 5174;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_ENABLE_API_MOCKS: '1',
      VITE_MAP_STYLE_URL: 'data:application/json,{"version":8,"sources":{},"layers":[]}',
      VITE_MAP_ATTRIBUTION: '© Test',
      VITE_AUTH_API_BASE: 'http://localhost:8080/auth',
      VITE_EVIDENCE_API_BASE: 'http://localhost:8080/evidence',
      VITE_PUBLIC_API_BASE: 'http://localhost:8080/public',
    },
  },
});

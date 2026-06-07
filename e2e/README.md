# `e2e/` — Playwright end-to-end tests (Phase 8)

Browser (Chromium) E2E for the public map, run with `npm run e2e` (`npm run e2e:ui` for the
inspector). `playwright.config.ts` boots a **hermetic** dev server on port 5174:

- `VITE_ENABLE_API_MOCKS=1` forces the MSW mock on, so the data is deterministic regardless of the
  local `.env` (which points at the live backend) — E2E never depends on backend/seed state.
- `VITE_MAP_STYLE_URL` is an inline empty MapLibre style (data URI), so the map mounts without
  fetching external basemap tiles. Assertions target the DOM (filter, accessible table, dialog,
  charts), not the WebGL canvas (which has no per-marker DOM).

First run needs the browser binary: `npx playwright install chromium`.

## Specs

- `map.spec.ts` — the F18 journey: shell + filter + table render; building click → dialog with
  trend/boxplot; keyboard operability (open a row's dialog via the table); PER (°C → °F). Includes
  the y-axis-title regression (the title must be a rotated/vertical label, not collapsed on the top
  tick).
- `a11y.spec.ts` — browser axe (`@axe-core/playwright`) WCAG 2.1 A/AA on the map page and the open
  dialog. Unlike the jsdom pass in `src/features/public-map/a11y.test.tsx`, this runs in a real
  layout engine so it **includes `color-contrast`**.
- `responsive.spec.ts` — no horizontal overflow at 360 px (page and open dialog), core controls
  reachable.

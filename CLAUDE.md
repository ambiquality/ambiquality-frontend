# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## About

Frontend for **Ambiquality** — an IEQ (Indoor Environmental Quality) monitoring platform
built as a bachelor thesis at VŠE Prague (author: Vilém Charwot, submission May 2026). This
is the platform's **"Webová aplikace"**: a single-page application that lets the public
explore indoor environmental measurements and lets operators register and maintain the
catalog of monitored buildings, rooms and sensors.

The backend (`../ambiquality-backend`) is **fully built** — independently deployable .NET
services for auth, the evidence catalog, ingestion, and a public open-data API. This repo
consumes those services; it owns no database.

The root `README.md` is the human-facing doc (setup, scripts, env); this file is the agent
guide.

## Two interfaces, two read sources

The SPA exposes **two interfaces**, and which backend service each one consumes is a
deliberate architectural decision — do not blur them:

| Interface   | Auth          | Consumes                  | Data characteristics                                  |
| ----------- | ------------- | ------------------------- | ----------------------------------------------------- |
| **Visitor** | anonymous     | **Public.Api** (`/v1/*`)  | masked coordinates, paginated, cacheable, open-data shape |
| **Operator**| authenticated | **Auth.Api** + **Evidence.Api** | ownership-aware, precise coordinates, `asOf` history    |

> **Two read sources rule.** Catalog reads exist on **both** Evidence.Api (owner-precise
> coords, `asOf`) and Public.Api (masked coords, paginated, SSN/SOSA open-data shape). The
> operator path reads/writes via Evidence.Api; the visitor path reads via Public.Api. Keep
> their auth / coordinate / `asOf` semantics distinct.

## Functional scope (from thesis)

| ID       | Frontend responsibility                                                        | Service       |
| -------- | ------------------------------------------------------------------------------ | ------------- |
| F01–F04  | Register / login / logout / change credentials (+ email confirm/change, delete)| Auth.Api      |
| F05–F09  | Building / room / sensor registration + temporal edits + sensor lifecycle      | Evidence.Api  |
| F11–F14  | Read observations + catalog; filter (time/bbox/entity/parameter); paginate; search | Public.Api |
| F15–F17  | Surface API spec + DCAT catalog links; archive download (CSV / JSON-LD)        | Public.Api    |
| **F18**  | **Public interactive map** with latest values + click-through to entity detail | Public.Api    |

F18 is the headline deliverable.

## Tech stack (decided)

- **React + Vite + TypeScript**, **React Router** (data router; `createBrowserRouter`)
- **Chakra UI v3** — the single design system (the VZH requirement: one kit, no mixing)
- **MapLibre GL JS** for the slippy/tile map (style URL is env-configurable — EXT) +
  **d3** for value indicators and time-series charts _(added in Phases 6–7)_
- **openapi-typescript** (types) + **openapi-fetch** (runtime) — one typed client per
  service, generated from each backend's `/openapi/v1.json` _(Phase 2)_
- **TanStack Query** — server state, caching, the heterogeneous pagination, retries, the
  UC18 "API unavailable" degradation path _(Phase 2)_
- **react-i18next** — cs + en, preference persisted in `localStorage` _(Phase 3)_
- **Vitest** + **React Testing Library**; **Playwright** for E2E (incl. axe-core) _(Phase 8)_

## Directory map

```
ambiquality-frontend/
  index.html, vite.config.ts, tsconfig*.json, eslint.config.js
  .env.example              VITE_AUTH_API_BASE / VITE_EVIDENCE_API_BASE /
                            VITE_PUBLIC_API_BASE / VITE_MAP_STYLE_URL / VITE_MAP_ATTRIBUTION
  scripts/gen-api.mjs       OpenAPI codegen entry (no-op stub until Phase 2)
  openapi/                  vendored backend specs (Phase 2)
  src/
    main.tsx, App.tsx       app entry + RouterProvider
    router.tsx              data router: public routes by slug; /admin behind ProtectedRoute
    api/                    [Phase 2] generated clients (auth/, evidence/, public/) + fetch middleware
    auth/                   AuthProvider, token store, useAuth, ProtectedRoute, silent refresh
                            (Phase 1 = stub: useAuth always "not authenticated")
    i18n/                   [Phase 3] react-i18next cs/en, glossary-driven
    theme/                  Chakra v3 system + a11y tokens + color-mode + UiProvider
    components/             shared UI (RootLayout, ErrorPage; later Breadcrumb, FormField,
                            ProblemError, UnitValue, LanguageSwitch)
    features/
      public-map/           F18: MapLibre + d3 overlay, parameter filter, degradation banner
      entity-detail/        building/room/sensor detail, breadcrumb, d3 time-series chart
      catalog-browse/       F11–F14 list/search/filter/paginate
      archive/              F17 DCAT distributions + download links
      account/              F01–F04 register/login/logout/credentials
      evidence-admin/       F05–F09 forms + temporal-change + lifecycle + one-time API key
    units/                  [Phase 8] QUDT display-unit preference + conversion (display-only)
    lib/                    env access, query client, problem-details parsing, formatting
    test/                   Vitest setup + render helpers
  e2e/                      [Phase 8] Playwright + axe-core
```

The `@/*` import alias maps to `src/*` (see `tsconfig.app.json` + `vite.config.ts`).

## Implementation phases

1. Scaffold & repo setup (Vite+React+TS, Chakra v3 provider/theme, router shell,
   ESLint/Prettier, `.env.example`, README/CLAUDE) — **done**
2. API integration layer (vendor specs, codegen, fetch middleware, TanStack Query)
3. Cross-cutting UI (i18n, language switch, a11y tokens, Breadcrumb/FormField/ProblemError/UnitValue)
4. Auth & account (F01–F04)
5. Evidence admin (F05–F09)
6. Public catalog & archive (F11–F17)
7. Public map (F18 / UC18)
8. PER (display units), WCAG AA pass, responsive 360 px→desktop, E2E

## Key gotchas

When implementing later phases, these are the easy things to get wrong:

- **Per-attribute temporal `PUT` with `validFrom`.** Evidence edits are **not** a single
  "save object" form. Each building/room/sensor attribute is changed via its own `PUT`
  carrying a `validFrom`; the server closes the open history row and opens a new one
  (`204`). Reads accept `asOf` to project past state. Build an attribute-by-attribute edit
  model + an `asOf` history viewer. Respect `409 overlapping-validity-range` and surface it
  clearly. Collections (pollution sources, measured parameters) change via `POST`/`DELETE`.
- **Keyset vs offset pagination (heterogeneous).** `/v1/observations` uses **keyset/cursor**
  pagination (follow the opaque `next` link/cursor); catalog lists (`/v1/buildings`, etc.)
  use **offset** `page`/`pageSize`. The query layer must support both patterns; don't assume
  one. Default page 50, max 200.
- **Two read sources.** (See the table above.) Never read operator data from Public.Api or
  visitor data from Evidence.Api.
- **RFC 9457 ProblemDetails everywhere.** All three services return ProblemDetails with
  stable `type` URNs (e.g. `urn:ambiquality:auth:*`, evidence's `unknown-codelist-code` /
  `domain-rule-violation`). One shared parser maps `type` → localized, field-aware messages.
  Auth uses **generic** error codes on purpose (anti-enumeration) — don't leak specifics.
  `/login` is rate-limited: handle **429 + Retry-After**.
- **Token model: in-memory access token + localStorage refresh, single-flight refresh.**
  Access token (15 min) lives in **memory** (React context); refresh token (30 days) in
  `localStorage`. On 401/expiry, refresh silently. Multiple concurrent 401s must trigger
  **one** refresh (single-flight), then replay the queued requests; on refresh failure, hard
  logout. Because the refresh token is in `localStorage`, keep the app XSS-clean — rely on
  React/Chakra escaping, never use `dangerouslySetInnerHTML`.
- **Coordinate masking.** Public.Api coarsens non-owner coordinates (`street`/`municipality`).
  Map markers are intentionally imprecise — never imply exactness in the UI.
- **API key shown once (F08).** Sensor-registration returns `apiKey` (`amq_sk_…`) once and it
  is unrecoverable. Present it prominently with copy + "store it now" warning; never refetch
  or display it afterward.
- **UC18 degradation.** When Public.Api is down/errors, render the map **without** indicators
  plus an informative banner — bake this into the map feature's loading/error states. Provide
  an accessible list/table fallback for the map (WCAG keyboard operability).
- **i18n + canonical terminology (KON).** Use the thesis glossary's single canonical term per
  concept (budova/building, místnost/room, senzor/sensor, pozorování/observation, subjekt
  zájmu/feature of interest, veličina/quantity, jednotka/unit) — no synonyms. Codelist labels
  come from the backend SKOS `prefLabel`s (cs+en), not re-translated in the frontend.
- **Display-unit conversion is display-only (PER).** Convert for presentation
  (°C/°F, ppm/mg·m⁻³) using `/v1/properties` `applicableUnit` (+ QUDT). Never mutate fetched
  canonical values; the API and archives stay canonical.
- **Env-driven base URLs / HTTPS.** API bases come from `VITE_*` env (dev = Caddy on
  `localhost:8080`; prod = real HTTPS origins). Read them via `src/lib/env.ts`, not
  `import.meta.env` directly. Public endpoints are CORS-open.

## Conventions

- Idiomatic modern Vite + Chakra v3. No raw hex in feature code — reference theme tokens in
  `src/theme/`. Chakra v3 API: `createSystem(defaultConfig, defineConfig({...}))`, mounted via
  `<ChakraProvider value={system}>` (see `src/theme/`). Color mode is delegated to
  `next-themes`.
- Public detail routes use backend-issued **slugs** (`bld-…` / `rm-…` / `sns-…`) so URLs are
  stable/shareable.
- Verification gates: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`
  must all pass before considering work done.

## Git rules

- Before any fresh changes, check the branch you are on.
- Never make changes on `main` branch — it's protected.
- Always pull `origin/main` before creating branches from `main`.
- Always create a new branch based on `main` for a brand-new feature and name it properly.
- In the presence of uncommitted changes, ask the user whether to commit first. If yes, wait
  for the user to merge them into `main` and to instruct you to continue.

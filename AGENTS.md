# AGENTS.md

Agent guide for this repository (read by opencode and Claude Code). The human-facing docs —
setup, scripts, env — live in [`README.md`](README.md).

## About

Frontend for **Ambiquality** — an IEQ (Indoor Environmental Quality) monitoring platform
built as a bachelor thesis at VŠE Prague (author: Vilém Charwot, submitted May 2026). This
is the platform's **"Webová aplikace"**: a single-page application that lets the public
explore indoor environmental measurements and lets operators register and maintain the
catalog of monitored buildings, rooms and sensors.

The backend (`../ambiquality-backend`) is **fully built** — independently deployable .NET
services for auth, the evidence catalog, ingestion, and a public open-data API. This repo
consumes those services; it owns no database.

## Two interfaces, two read sources

The SPA exposes **two interfaces**, and which backend service each one consumes is a
deliberate architectural decision — do not blur them:

| Interface   | Auth          | Consumes                  | Data characteristics                                  |
| ----------- | ------------- | ------------------------- | ----------------------------------------------------- |
| **Visitor** | anonymous     | **Public.Api** (`/v1/*`)  | precise coordinates, paginated, cacheable, open-data shape |
| **Operator**| authenticated | **Auth.Api** + **Evidence.Api** | ownership-aware, `asOf` history    |

> **Two read sources rule.** Catalog reads exist on **both** Evidence.Api (owner-scoped,
> `asOf`) and Public.Api (paginated, SSN/SOSA open-data shape). The operator path reads/writes
> via Evidence.Api; the visitor path reads via Public.Api. Coordinates are precise on **both**
> (anonymization was dropped backend-side); keep their auth / `asOf` semantics distinct.

## Functional scope (from thesis)

| ID       | Frontend responsibility                                                        | Service       |
| -------- | ------------------------------------------------------------------------------ | ------------- |
| F01–F04  | Register / login / logout / change credentials (+ email confirm/change, delete)| Auth.Api      |
| F05–F09  | Building / room / sensor registration + temporal edits + sensor lifecycle      | Evidence.Api  |
| F11–F14  | Read observations + catalog; filter (time/bbox/entity/parameter); paginate; search | Public.Api |
| F15–F17  | Surface API spec + DCAT catalog links; archive download (CSV / JSON-LD)        | Public.Api    |
| **F18**  | **Public interactive map** with latest values + click-through to entity detail | Public.Api    |

F18 is the headline deliverable.

## Tech stack

- **React + Vite + TypeScript**, **React Router** (data router; `createBrowserRouter`)
- **Chakra UI v3** — the single design system (the VZH requirement: one kit, no mixing)
- **MapLibre GL JS** for the slippy/tile map (style URL is env-configurable) +
  **d3** for value indicators and time-series charts
- **openapi-typescript** (types) + **openapi-fetch** (runtime) — one typed client per
  service, generated from the vendored backend specs via `npm run gen:api`
- **TanStack Query** — server state, caching, the heterogeneous pagination, retries, the
  UC18 "API unavailable" degradation path
- **react-i18next** — cs + en, preference persisted in `localStorage`
- **Vitest** + **React Testing Library**; **Playwright** for E2E (incl. axe-core)

## Directory map

```
ambiquality-frontend/
  index.html, vite.config.ts, tsconfig*.json, eslint.config.js
  .env.example              VITE_AUTH_API_BASE / VITE_EVIDENCE_API_BASE /
                            VITE_PUBLIC_API_BASE / VITE_INGESTION_API_BASE /
                            VITE_DOCS_BASE / VITE_RUM_ENDPOINT / VITE_ENABLE_API_MOCKS /
                            VITE_MAP_STYLE_URL / VITE_MAP_ATTRIBUTION
  scripts/gen-api.mjs       OpenAPI codegen: generates src/api/<svc>/schema.d.ts from the
                            vendored openapi/*.json; `--fetch` re-pulls the specs from a live backend
  openapi/                  vendored backend specs (auth, evidence, public)
  src/
    main.tsx, App.tsx       app entry + RouterProvider (optional MSW mock worker gate)
    router.tsx              data router: visitor + informational + account routes; /operator behind ProtectedRoute
    api/                    generated clients (auth/, evidence/, public/) + fetch middleware +
                            pagination helpers + public feature hooks (hooks, map-hooks, catalog-hooks, entity-hooks)
    auth/                   AuthProvider, token store (memory access + HttpOnly-cookie refresh),
                            useAuth, ProtectedRoute, silent single-flight refresh
    i18n/                   react-i18next cs/en, glossary-driven codelist labels, resources/
    theme/                  Chakra v3 system + a11y tokens + color-mode + UiProvider
    components/             shared UI (RootLayout, Footer, ErrorPage, Breadcrumb, FormField,
                            FormActions, InfoTip, LanguageSwitch, ProblemError, UnitValue)
    features/
      public-map/           F18: MapLibre + d3 overlay, parameter filter, degradation banner,
                            marker-table fallback, charts/ (TimeSeriesChart, BoxPlot)
      entity-detail/        visitor building/room/sensor detail (Public.Api slugs)
      catalogue/            F11–F14 open-data catalog frontend (`/catalog`)
      catalog-browse/       evidence browsing list/search/filter/paginate (`/browse`)
      archive/              F17 DCAT distributions + download links
      account/              F01–F04 register/login/logout/credentials
      evidence-admin/       F05–F09 forms + temporal-change + lifecycle + one-time API key;
                            components/ (AsOfViewer, AttributeEditForm, CollectionEditor, …),
                            ruian/ (RÚIAN address autocomplete)
      about/, legal/        informational pages
    units/                  QUDT display-unit preference + conversion (display-only)
    lib/                    env access, query client, vitals (RUM), constants
    mocks/                  MSW handlers/data for the map endpoints (dev only)
    test/                   Vitest setup + render helpers
  e2e/                      Playwright + axe-core
```

The `@/*` import alias maps to `src/*` (see `tsconfig.app.json` + `vite.config.ts`).

## Project status

All implementation phases are **complete** (scaffold → API layer → UI → auth → evidence
admin → catalog/archive → map → PER/WCAG/E2E). Treat the app as finished: changes should
extend or fix, not scaffold.

## Key gotchas

These are the easy things to get wrong:

- **Per-attribute temporal `PUT` with `validFrom`.** Evidence edits are **not** a single
  "save object" form. Each building/room/sensor attribute is changed via its own `PUT`
  carrying a `validFrom`; the server closes the open history row and opens a new one
  (`204`). Reads accept `asOf` to project past state. Respect `409 overlapping-validity-range`
  and surface it clearly. Collections (pollution sources, measured parameters) change via
  `POST`/`DELETE`.
- **Keyset vs offset pagination (heterogeneous).** `/v1/observations` uses **keyset/cursor**
  pagination (follow the opaque `next` link/cursor); catalog lists (`/v1/buildings`, etc.)
  use **offset** `page`/`pageSize`. The query layer must support both patterns; don't assume
  one. Default page 50, max 200.
- **Two read sources.** (See the table above.) Never read operator data from Public.Api or
  visitor data from Evidence.Api. The one exception: shared controlled vocabularies
  (codelists) come from Public.Api's `/v1/codelists` even on the operator side.
- **RFC 9457 ProblemDetails everywhere.** All three services return ProblemDetails with
  stable `type` URNs (e.g. `urn:ambiquality:auth:*`, evidence's `unknown-codelist-code` /
  `domain-rule-violation`). The middleware throws `ProblemError` on non-2xx; one component
  maps `type` → localized, field-aware messages. Auth uses **generic** error codes on
  purpose (anti-enumeration) — don't leak specifics. `/login` is rate-limited: handle
  **429 + Retry-After**.
- **Token model: in-memory access token + HttpOnly-cookie refresh, single-flight refresh.**
  Access token (15 min) lives in **memory** (React context); the refresh token (30 days) is an
  **HttpOnly + SameSite=Strict cookie** set by Auth.Api — page JS never reads it, so there is
  nothing to store in `localStorage`. On 401/expiry, refresh silently (the cookie travels via
  `credentials: 'include'`). Multiple concurrent 401s must trigger
  **one** refresh (single-flight), then replay the queued requests; on refresh failure, hard
  logout. Because the refresh token is unreadable, a DOM-XSS can no longer mint a session, but
  keep the app XSS-clean anyway (React/Chakra escaping, never `dangerouslySetInnerHTML`) to
  protect the short-lived access token.
- **Coordinates are precise everywhere.** Anonymization/coordinate masking was removed
  backend-side; Public.Api returns exact lat/lon to everyone. Render coordinates as-is —
  there is no coordinate-precision (`anonymizationLevel`) field on buildings.
- **Czech OFN Adresy address model (RÚIAN-anchored).** A building address is NOT flat
  street/city/postcode/country. It is the structured Czech OFN model: `addressPointCode` (RÚIAN
  kód adresního místa, required > 0), `streetName?`, `houseNumber` + `houseNumberType`
  (`č.p.`/`č.ev.`), `orientationNumber?` (+ `orientationNumberLetter?`), `municipalityName`,
  `municipalityPartName?`, `psc` (5 digits), `districtName?`, `regionName?`. Country is a
  **scope gate, not a stored field** — the platform is CZ-only and the registration form's
  country picker hard-blocks anything but CZ. Each territorial element has an optional RÚIAN
  `*Code` (`streetCode?`, `municipalityCode?`, `municipalityPartCode?`, `districtCode?`,
  `regionCode?`, all positive-when-present) that backs a dereferenceable `linked.cuzk.cz`
  IRI in the JSON-LD. Evidence.Api returns the fields flat; compose display text in the
  frontend (`evidence-admin/address.ts`).
- **RÚIAN autocomplete is live.** `evidence-admin/ruian/useAddressLookup.ts` calls
  Evidence.Api's operator-only `address-lookup` endpoints (suggest ≥ 2 chars, resolve on
  pick) which proxy ČÚZK's RÚIAN geocoder; `AddressAutocomplete` fills the ~18 OFN fields.
  The backend stays authoritative and re-validates on submit. Backend geocoder outages
  surface as a degradation path, not a form blocker.
- **API key shown once (F08).** Sensor-registration returns `apiKey` (`amq_sk_…`) once and it
  is unrecoverable. Present it prominently with copy + "store it now" warning; never refetch
  or display it afterward.
- **UC18 degradation.** When Public.Api is down/errors, render the map **without** indicators
  plus an informative banner — baked into the map feature's loading/error states. An
  accessible list/table fallback covers the map (WCAG keyboard operability).
- **i18n + canonical terminology (KON).** Use the thesis glossary's single canonical term per
  concept (budova/building, místnost/room, senzor/sensor, pozorování/observation, subjekt
  zájmu/feature of interest, veličina/quantity, jednotka/unit) — no synonyms. Codelist labels
  come from the backend SKOS `prefLabel`s (cs+en), not re-translated in the frontend.
- **Display-unit conversion is display-only (PER).** Convert for presentation
  (°C/°F, ppm/mg·m⁻³) using `/v1/properties` `applicableUnit` (+ QUDT). Never mutate fetched
  canonical values; the API and archives stay canonical.
- **Env-driven base URLs / HTTPS.** API bases come from `VITE_*` env (dev = Caddy on
  `localhost:8080`; prod = real HTTPS origins). Read them via `src/lib/env.ts`, not
  `import.meta.env` directly. Public endpoints are CORS-open. MSW mocks gate on
  `VITE_ENABLE_API_MOCKS` (dev-only).

## Core Web Vitals / RUM

`src/lib/vitals.ts` reports anonymized Core Web Vitals (LCP / INP / TTFB / CLS — web-vitals
v6 dropped FID, INP is its successor) and page views to the backend's Public.Api
`POST /telemetry/vitals` on `pagehide` via `sendBeacon` with a `text/plain` blob
(CORS-safelisted, no preflight). It is enabled only when `VITE_RUM_ENDPOINT` is set (empty
in dev; baked by the release workflow as `…/public/telemetry/vitals`) and feeds the backend's
Grafana "Overview" bar gauges. Keep `deriveRouteBucket`'s buckets in sync with
`src/router.tsx` top-level segments and with the backend's `SanitizeRouteBucket`.

## Conventions

- Idiomatic modern Vite + Chakra v3. No raw hex in feature code — reference theme tokens in
  `src/theme/`. Chakra v3 API: `createSystem(defaultConfig, defineConfig({...}))`, mounted via
  `<ChakraProvider value={system}>` (see `src/theme/`). Color mode is delegated to
  `next-themes`.
- Public detail routes use backend-issued **slugs** (`bld-…` / `rm-…` / `sns-…`) so URLs are
  stable/shareable. Operator routes use server UUIDs under `/operator/*`.
- Generated clients in `src/api/*/client.ts` are committed; regenerate with `npm run gen:api`
  after a backend contract change (use `gen:api:fetch` to refresh the vendored specs first).

## Verification gates

```bash
npm run typecheck   # tsc -b
npm run lint        # ESLint (no errors)
npm run test        # Vitest suite
npm run build       # tsc -b && vite build
npm run e2e         # Playwright (incl. axe-core)
```

All four main gates must pass before considering work done. Note: the Vitest suite is
**flakey under full parallel runs** (page tests using MSW can exceed the 5 s default
timeout); re-run failed files individually — they pass in isolation.

## Git rules

- Before any fresh changes, check the branch you are on.
- Never make changes on `main` branch — it's protected.
- Always pull `origin/main` before creating branches from `main`.
- Always create a new branch based on `main` for a brand-new feature and name it properly.
- In the presence of uncommitted changes, ask the user whether to commit first. If yes, wait
  for the user to merge them into `main` and to instruct you to continue.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Semantic search: embeddings config (IMPORTANT)

The graph's vectors are computed with the **openai** provider using
`nomic-embed-text-v2-moe` (served via a local OpenAI-compatible endpoint). The MCP server
inherits the config from the shell env:

- `CRG_OPENAI_BASE_URL=http://10.0.0.1:11434/v1`
- `CRG_OPENAI_MODEL=nomic-embed-text-v2-moe`
- `CRG_OPENAI_API_KEY` (any non-empty value for the local endpoint)
- `CRG_OPENAI_BATCH_SIZE`

**Gotcha:** `semantic_search_nodes_tool` defaults to `provider="local"`
(all-MiniLM-L6-v2), which has **no** matching vectors in this graph, so it silently falls
back to keyword/FTS and returns 0 for fuzzy queries. To use the real vectors, **always pass
`provider="openai"`** — the model auto-falls back to `CRG_OPENAI_MODEL`, so the model
argument is not needed:

```
semantic_search_nodes_tool(query="...", provider="openai")
```

The provider is stored per-vector; a re-embed with a different provider/model/endpoint is
refused (migration), so keep `provider="openai"` and `CRG_OPENAI_MODEL` in sync with what
was used for `code-review-graph embed`.

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.

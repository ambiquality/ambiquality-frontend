# Ambiquality — Frontend

Web client (single-page application) for **Ambiquality**, an IEQ (Indoor Environmental
Quality) monitoring platform built as a bachelor thesis at VŠE Prague (author: Vilém
Charwot, submission May 2026). The platform collects sensor measurements of indoor
environmental parameters (CO₂, temperature, humidity, particulate matter, VOCs,
acoustics, light) and publishes them as open data.

This repository is the **"Webová aplikace"** of the platform. The backend lives in
[`ambiquality-backend`](../ambiquality-backend) — a set of independently deployable .NET
services for authentication, the evidence catalog, ingestion, and a public open-data API.

## Two interfaces

The SPA exposes two distinct interfaces:

- **Visitor** (anonymous, public) — interactive map of registered buildings with their
  latest sensor values, entity detail with time-series charts, parameter filtering, and
  archive download. Consumes the **Public.Api**.
- **Operator** (authenticated) — account management and the full evidence lifecycle
  (buildings → rooms → sensors) with temporal versioning. Consumes the **Auth.Api** and
  **Evidence.Api**.

> Catalog reads exist on both Evidence.Api and Public.Api. By design the **operator**
> reads/writes via Evidence.Api (ownership, precise coordinates, `asOf` history); the
> **visitor** reads via Public.Api (masked coordinates, paginated, cacheable). Keep these
> two read paths distinct.

## Tech stack

- **React + Vite + TypeScript**, **React Router** (data router)
- **Chakra UI v3** — the single design system (no other UI kit)
- **MapLibre GL JS** for the tile map (configurable style/tile URL) + **d3** for value
  indicators and time-series charts _(added in a later phase)_
- **openapi-typescript** + **openapi-fetch** — typed clients generated per service from
  the backend OpenAPI specs _(Phase 2)_
- **TanStack Query** for server state / caching / pagination _(Phase 2)_
- **react-i18next** for **cs + en**, preference persisted in `localStorage` _(Phase 3)_
- **Vitest** + **React Testing Library** (unit/component); **Playwright** for E2E
  (incl. axe-core accessibility checks)

## Prerequisites

- **Node** ≥ 22 (developed on v26) and a recent **npm** (developed on 11.x)
- A **running backend stack**. In `ambiquality-backend`, start it with `./dev.sh up`,
  which brings up Postgres, Redis, Caddy (`:8080`), Mailpit (`:8025`), the APIs, the
  ingestion worker, and migrations. See that repo's README for details.

## Quick start

```bash
cp .env.example .env      # then edit: API base URLs + map style/attribution
npm install
npm run dev               # Vite dev server on http://localhost:5173
```

With the backend stack up, the default `.env` values route the three APIs through Caddy
on `:8080`.

## Environment variables

All client-exposed variables must be prefixed with `VITE_` (Vite only inlines those).
Copy `.env.example` to `.env` and adjust. Never commit `.env`.

| Variable                  | Purpose                                                       | Dev default (via Caddy)               |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------- |
| `VITE_AUTH_API_BASE`      | Auth.Api — register / login / refresh / account              | `http://localhost:8080/auth`          |
| `VITE_EVIDENCE_API_BASE`  | Evidence.Api — operator catalog, temporal edits, `asOf`      | `http://localhost:8080/evidence`      |
| `VITE_PUBLIC_API_BASE`    | Public.Api — open-data read API (`/v1/*`) for the visitor     | `http://localhost:8080/public`        |
| `VITE_MAP_STYLE_URL`      | MapLibre GL style JSON from a configurable tile provider      | `https://demotiles.maplibre.org/style.json` |
| `VITE_MAP_ATTRIBUTION`    | Attribution string shown on the map                          | `© MapLibre`                          |

In production, point the API bases at the real HTTPS origins (treat backend URIs as
permanent) and supply your own map provider/key.

## Scripts

| Script              | Description                                                    |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                                     |
| `npm run build`     | Type-check (`tsc -b`) then produce a production build         |
| `npm run preview`   | Preview the production build locally                          |
| `npm run typecheck` | `tsc --noEmit` — type-check without emitting                  |
| `npm run lint`      | ESLint over the project                                       |
| `npm run format`    | Format with Prettier                                          |
| `npm run test`      | Run the Vitest suite                                          |
| `npm run gen:api`   | Generate typed API clients from the OpenAPI specs (Phase 2 — currently a no-op stub) |

### OpenAPI codegen (Phase 2)

Typed clients are generated per service from the backend's `/openapi/v1.json` specs into
`src/api/`:

```bash
npm run gen:api
```

This is currently a placeholder (`scripts/gen-api.mjs`); the real codegen — vendoring the
three specs into `openapi/` and running `openapi-typescript` — lands in Phase 2.

## Relationship to the backend

The frontend talks to three backend services through **Caddy** on `:8080`, which strips
the path prefix and routes:

| Prefix       | Service       | Used by             |
| ------------ | ------------- | ------------------- |
| `/auth`      | Auth.Api      | Operator (account)  |
| `/evidence`  | Evidence.Api  | Operator (catalog)  |
| `/public`    | Public.Api    | Visitor (open data) |

During development, **Mailpit** on `:8025` captures outgoing email (e.g. registration /
email-confirmation flows). All three services return **RFC 9457 ProblemDetails** error
bodies with stable `type` URNs.

## License & thesis context

Released under the **MIT License** (see [`LICENSE`](./LICENSE)), matching the backend.
This project is part of a bachelor thesis at VŠE Prague (Prague University of Economics
and Business), submission May 2026.

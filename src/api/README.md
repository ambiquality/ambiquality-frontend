# `src/api/` — typed API clients (Phase 2)

Typed, generated clients — one per backend service — plus shared fetch middleware and the
pagination vocabulary the query layer builds on.

```
api/
  auth/        # Auth.Api: schema.d.ts (generated) + client.ts (secured openapi-fetch client)
  evidence/    # Evidence.Api: schema.d.ts + client.ts (secured)
  public/      # Public.Api: schema.d.ts + client.ts (anonymous) + hooks.ts (example query hooks)
  middleware/  # auth header injection, single-flight refresh, RFC 9457 ProblemDetails, token-store seam
  pagination.ts  # keyset (cursor) + offset (page/pageSize) types & helpers
  index.ts     # barrel: clients + middleware + pagination
```

## Codegen

`npm run gen:api` regenerates `src/api/<service>/schema.d.ts` from the **vendored** specs in
`openapi/{auth,evidence,public}.json` using `openapi-typescript`. It runs fully **offline** — the
backend need not be running. `npm run gen:api:fetch` first re-pulls each spec from the live
backend (`/openapi/v1.json` via the `VITE_*_API_BASE` routes) and overwrites the vendored copy,
then generates. The generated `schema.d.ts` files are committed and are excluded from
ESLint/Prettier (they are machine output, not hand-edited).

> **Public.Api typing caveat.** The Public.Api spec declares **no component schemas** and types
> its query params / response bodies in prose only. So its generated `paths` give correct
> URLs/methods but `unknown` responses and `never` query params. The example hooks in
> `public/hooks.ts` layer hand-written, provisional response types on top and pass query params
> with a documented cast. This is expected, not a bug.

## Clients

Each service exports a typed `openapi-fetch` client bound to its base URL from `@/lib/env`:

- **`authClient`** / **`evidenceClient`** — secured. Middleware order: Bearer header injection →
  single-flight refresh-on-401 → ProblemDetails. Evidence reads are anonymous but mutations are
  Bearer-secured; Auth account endpoints are Bearer-secured.
- **`publicClient`** — anonymous, CORS-open. ProblemDetails middleware **only** (no auth header,
  no refresh).

### Two read sources rule

The **operator** interface reads/writes via `evidenceClient` (ownership, precise coords, `asOf`
history). The **visitor** interface reads via `publicClient` (masked coords, paginated,
cacheable). Do not blur their auth/coords/`asOf` semantics.

## Middleware

- **Auth header injection + single-flight refresh** (`middleware/auth.ts`, pitfall #8) —
  concurrent 401s trigger exactly **one** `TokenStore.refresh()`; the originals queue behind it
  and are replayed with the new token. On refresh failure → `TokenStore.onAuthFailure()`
  (hard logout). A retry marker header prevents refresh loops.
- **Token-store seam** (`middleware/token-store.ts`) — the `TokenStore` interface
  (`getAccessToken` / `getRefreshToken` / `refresh` / `onAuthFailure`) is the **Phase 4** plug
  point. A default `InMemoryTokenStore` is active until the AuthProvider installs a real one via
  `setTokenStore()`. Access token lives in memory; refresh token in localStorage (XSS-safe model).
- **RFC 9457 ProblemDetails** (`middleware/problem-details.ts`, pitfall #9) — one shared parser
  maps the stable `urn:ambiquality:*` `type`, `status`/`title`/`detail`, and validation `errors`
  into a typed `ProblemError` (with `Retry-After` for 429s). `problemDetailsMiddleware` throws it
  on any non-ok response, so `client.GET(...)` rejects on error — the shape React Query expects.
  Localization is **not** done here (Phase 3 owns the i18n dictionary; the `type` URN is the key).

## Pagination (`pagination.ts`, pitfall #6)

Public.Api uses **two** pagination styles; the query layer expresses both:

| Endpoint(s)                | Style          | Request params        | Response surface                  |
| -------------------------- | -------------- | --------------------- | --------------------------------- |
| `/v1/observations`         | keyset/cursor  | `cursor`, `limit`     | opaque `next` link → `nextCursor` |
| `/v1/buildings` (catalog)  | offset/page    | `page`, `pageSize`    | `total` count for page-index UIs  |

- **Keyset**: unbounded append-only feed → stable, gap-free pages. Use `CursorPageParams` /
  `CursorPage<T>`; `cursorFromNextLink()` extracts the opaque cursor from a `next` URL.
- **Offset**: small bounded catalogs → friendlier page index. Use `OffsetPageParams` /
  `OffsetPage<T>`. Defaults: `DEFAULT_PAGE_SIZE` 50, backend max 200 (`MAX_PAGE_SIZE`).

Full infinite-query wiring lands with the catalog/map features in later phases; these types just
ensure both patterns are expressible now.

## TanStack Query

The shared client + provider live in `@/lib/query-client.ts` and `@/lib/query-provider.tsx`
(mounted in `main.tsx` alongside Chakra's `UiProvider`). Defaults: `staleTime` 30s, no
`refetchOnWindowFocus`, retry up to 2× with backoff but **never retry 4xx** `ProblemError`s.
Devtools are dev-only and tree-shaken from production. Example hooks: `usePublicBuildings`,
`usePublicProperties` in `public/hooks.ts`.

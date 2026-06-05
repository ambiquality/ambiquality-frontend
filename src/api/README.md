# `src/api/` — typed API clients (Phase 2)

Generated, typed clients — one per backend service — plus shared fetch middleware.

Planned layout:

```
api/
  auth/       # openapi-typescript types + openapi-fetch client for Auth.Api
  evidence/   # ... for Evidence.Api
  public/     # ... for Public.Api
  middleware/ # auth header injection, single-flight refresh, RFC 9457 ProblemDetails parsing
```

Generated via `npm run gen:api` (currently a no-op stub, see `scripts/gen-api.mjs`).

Keep the **two read sources** rule: operator paths use Evidence.Api (ownership, precise
coords, `asOf` history); visitor paths use Public.Api (masked coords, paginated, cacheable).

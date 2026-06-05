# `openapi/` — vendored backend specs (Phase 2)

Vendored copies of the three backend OpenAPI specs (Auth, Evidence, Public), fetched
from each service's `/openapi/v1.json`. `npm run gen:api` (see `scripts/gen-api.mjs`)
will generate typed clients into `src/api/` from these. Empty until Phase 2.

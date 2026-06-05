// Placeholder for the OpenAPI codegen step (real implementation lands in Phase 2).
//
// Phase 2 plan: vendor the three backend specs into `openapi/` and generate one typed
// client per service with openapi-typescript (types) + openapi-fetch (runtime), e.g.
//
//   npx openapi-typescript openapi/auth.v1.json     -o src/api/auth/schema.generated.ts
//   npx openapi-typescript openapi/evidence.v1.json -o src/api/evidence/schema.generated.ts
//   npx openapi-typescript openapi/public.v1.json   -o src/api/public/schema.generated.ts
//
// For now this is an intentional no-op so `npm run gen:api` exists and is wired up.

console.log(
  '[gen:api] No-op placeholder. OpenAPI client codegen is implemented in Phase 2.\n' +
    '          See scripts/gen-api.mjs for the intended commands.',
);

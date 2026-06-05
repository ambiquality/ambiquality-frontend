/**
 * Public surface of the API layer.
 *
 * - Per-service typed clients: {@link authClient}, {@link evidenceClient}, {@link publicClient}.
 * - Shared middleware + the Phase 4 token-store seam (re-exported from `./middleware`).
 * - Pagination vocabulary for the heterogeneous keyset/offset paging (pitfall #6).
 *
 * Example query hooks live under each service (e.g. `@/api/public/hooks`); import those directly.
 */

export { authClient } from './auth/client';
export { evidenceClient } from './evidence/client';
export { publicClient } from './public/client';

export * from './middleware';
export * from './pagination';

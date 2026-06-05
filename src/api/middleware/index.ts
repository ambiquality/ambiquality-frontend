/**
 * Shared fetch middleware for the typed API clients.
 *
 * - {@link authHeaderMiddleware} / {@link refreshMiddleware} — Bearer injection + single-flight
 *   silent refresh on 401 (secured clients only).
 * - {@link problemDetailsMiddleware} + {@link parseProblemDetails} / {@link ProblemError} —
 *   RFC 9457 error handling (all clients).
 * - {@link TokenStore} / {@link setTokenStore} / {@link InMemoryTokenStore} — the Phase 4 seam.
 */

export { authHeaderMiddleware, refreshMiddleware } from './auth';
export { problemDetailsMiddleware } from './problem-details-middleware';
export {
  ProblemError,
  parseProblemDetails,
  problemErrorFromResponse,
  AMBIQUALITY_PROBLEM_URN_PREFIX,
} from './problem-details';
export type { ProblemDetailsBody, FieldErrors } from './problem-details';
export { getTokenStore, setTokenStore, InMemoryTokenStore } from './token-store';
export type { TokenStore, RefreshResult } from './token-store';

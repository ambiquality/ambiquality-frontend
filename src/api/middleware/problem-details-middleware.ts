/**
 * openapi-fetch middleware that turns any non-ok response into a thrown {@link ProblemError}.
 *
 * Applied to ALL three clients (Auth, Evidence, Public) — every service returns RFC 9457
 * `application/problem+json` on error, so this is where a failed `Response` becomes a typed,
 * catchable error. With this installed, `client.GET(...)` rejects on error and resolves with
 * `{ data }` on success, which is the shape React Query's `queryFn` expects.
 *
 * Ordering note: this runs AFTER the refresh middleware (which may have already replayed a
 * 401), so by the time we throw, a refreshable 401 has had its chance to recover.
 */

import type { Middleware } from 'openapi-fetch';
import { problemErrorFromResponse } from './problem-details';

export const problemDetailsMiddleware: Middleware = {
  async onResponse({ response }) {
    if (response.ok) return response;
    throw await problemErrorFromResponse(response);
  },
};

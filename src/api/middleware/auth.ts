/**
 * Auth middleware for the secured clients (Auth.Api account endpoints + Evidence.Api mutations).
 *
 * Two responsibilities, both implemented as openapi-fetch `Middleware`:
 *  1. **Bearer injection** ({@link authHeaderMiddleware}) — attach `Authorization: Bearer <token>`
 *     from the active {@link TokenStore} when an access token is present.
 *  2. **Single-flight silent refresh on 401** ({@link refreshMiddleware}) — pitfall #8. When a
 *     secured request comes back 401, run ONE `TokenStore.refresh()` even if many requests 401
 *     concurrently; queue the rest behind that single refresh, then replay each original request
 *     with the new token. If refresh fails, invoke the hard-logout hook and surface the 401.
 *
 * Public.Api is anonymous (CORS-open) and gets NEITHER of these — only the ProblemDetails
 * middleware. See `client.ts` factories.
 */

import type { Middleware } from 'openapi-fetch';
import { getTokenStore } from './token-store';

/** Attaches `Authorization: Bearer <accessToken>` when the token store has one. */
export const authHeaderMiddleware: Middleware = {
  onRequest({ request }) {
    const token = getTokenStore().getAccessToken();
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
};

/**
 * Single-flight refresh coordinator. The first 401 triggers `TokenStore.refresh()`; concurrent
 * 401s await the SAME promise instead of each firing their own refresh. Module-scoped so every
 * secured client shares one in-flight refresh.
 */
let inFlightRefresh: Promise<string> | null = null;

function runSingleFlightRefresh(): Promise<string> {
  if (inFlightRefresh) return inFlightRefresh;
  const store = getTokenStore();
  inFlightRefresh = store
    .refresh()
    .then((result) => result.accessToken)
    .finally(() => {
      // Release the latch once settled so the next genuine 401 can refresh again.
      inFlightRefresh = null;
    });
  return inFlightRefresh;
}

/** Marker so a replayed request doesn't recurse into another refresh on a second 401. */
const RETRY_HEADER = 'x-amq-retry';

/**
 * On 401: refresh once (single-flight), then replay the original request with the new token.
 * On refresh failure: hard-logout via the token store and return the original 401 response so
 * callers still get a ProblemError downstream.
 */
export const refreshMiddleware: Middleware = {
  async onResponse({ request, response }) {
    if (response.status !== 401) return response;
    // Already retried once — give up to avoid an infinite refresh/replay loop.
    if (request.headers.get(RETRY_HEADER)) return response;

    const store = getTokenStore();
    // Nothing to refresh with → straight to hard logout.
    if (!store.getRefreshToken()) {
      store.onAuthFailure();
      return response;
    }

    let newAccessToken: string;
    try {
      newAccessToken = await runSingleFlightRefresh();
    } catch {
      store.onAuthFailure();
      return response;
    }

    // Replay the original request with the fresh token and a retry marker.
    const retried = request.clone();
    retried.headers.set('Authorization', `Bearer ${newAccessToken}`);
    retried.headers.set(RETRY_HEADER, '1');
    return fetch(retried);
  },
};

/** Test-only: reset the shared single-flight latch between cases. */
export function __resetRefreshStateForTests(): void {
  inFlightRefresh = null;
}

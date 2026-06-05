/**
 * Shared TanStack Query client.
 *
 * Defaults tuned for the Ambiquality read-heavy UI:
 *  - `staleTime` 30s — catalog/observation data changes slowly; avoid refetch storms while
 *    navigating between map/detail views.
 *  - `retry` 2 with a capped exponential backoff, but **never retry 4xx** — a `ProblemError`
 *    with a client status (incl. an unrecoverable 401 after refresh, 404, 429, validation) is
 *    deterministic, so retrying just wastes requests. 5xx / network errors still retry.
 *  - `refetchOnWindowFocus` off — the visitor map shouldn't refetch every focus change.
 *
 * The QueryClient is created via a factory so tests can spin up an isolated client.
 */

import { QueryClient } from '@tanstack/react-query';
import { ProblemError } from '@/api/middleware';

/** True when an error is a deterministic client-side (4xx) failure not worth retrying. */
function isNonRetryable(error: unknown): boolean {
  return error instanceof ProblemError && error.httpStatus >= 400 && error.httpStatus < 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isNonRetryable(error)) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      },
      mutations: {
        // Mutations are intent-driven; let the caller decide on retry per-mutation.
        retry: false,
      },
    },
  });
}

/** App-wide singleton used by the provider (tests create their own via the factory). */
export const queryClient = createQueryClient();

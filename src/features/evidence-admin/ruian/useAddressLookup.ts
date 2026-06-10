/**
 * RÚIAN address autocomplete hooks for the building-registration form (F05). They call
 * Evidence.Api's operator-only `address-lookup` endpoints — which proxy ČÚZK's RÚIAN geocoder
 * (open data, CC BY 4.0) — so the registrar picks an address instead of hand-copying the ~18 OFN
 * `Adresy` fields. Reads go through the typed {@link evidenceClient} like every other evidence
 * hook (rejects non-2xx with `ProblemError`); the backend stays authoritative and re-validates a
 * picked address on submit.
 *
 * To stay polite to ČÚZK: `suggest` only fires for ≥ 2 chars (debounce the input upstream) and the
 * in-flight request is aborted via the query `signal`; the heavier `resolve` runs once, on pick.
 */

import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { evidenceClient } from '@/api/evidence/client';
import type { components } from '@/api/evidence/schema';

type Schemas = components['schemas'];
export type AddressSuggestion = Schemas['AddressSuggestion'];
export type ResolvedAddress = Schemas['ResolvedAddress'];

/** Shortest query that triggers a suggest call (mirrors the backend's own guard). */
export const MIN_SUGGEST_LENGTH = 2;

/** Debounced/guarded autocomplete suggestions for the (already-debounced) `query`. */
export function useAddressSuggest(query: string): UseQueryResult<AddressSuggestion[]> {
  const q = query.trim();
  return useQuery({
    queryKey: ['ruian', 'suggest', q],
    enabled: q.length >= MIN_SUGGEST_LENGTH,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const { data } = await evidenceClient.GET('/v1/address-lookup/suggest', {
        params: { query: { q, limit: 8 } },
        signal,
      });
      return data?.suggestions ?? [];
    },
  });
}

/**
 * Returns a resolver that expands a suggestion `key` to the full OFN address. Cached forever (a
 * RÚIAN address point is immutable for the session), so re-picking the same address is free.
 * Rejects with `ProblemError` on a `404`/`502`, which the caller surfaces as the degradation path.
 */
export function useResolveAddress(): (key: string) => Promise<ResolvedAddress> {
  const queryClient = useQueryClient();
  return (key: string) =>
    queryClient.fetchQuery({
      queryKey: ['ruian', 'resolve', key],
      staleTime: Infinity,
      queryFn: async ({ signal }) => {
        const { data } = await evidenceClient.GET('/v1/address-lookup/resolve', {
          params: { query: { key } },
          signal,
        });
        return data!;
      },
    });
}

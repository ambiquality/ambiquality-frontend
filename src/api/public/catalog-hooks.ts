/**
 * TanStack Query hook for the DCAT-AP catalog (`GET /v1/catalog`), shared by the visitor Archive
 * tab and the future human-readable Catalogue page. Mirrors `./map-hooks.ts`: a stable query key,
 * RFC 9457 error flow (the typed client carries the ProblemDetails middleware), and parsing done in
 * `select` so the cached raw document is localized to the active UI language without a refetch.
 *
 * Two endpoint quirks are handled here:
 *  - `/v1/catalog` defaults to `application/ld+json`, which openapi-fetch won't auto-parse. We send
 *    `Accept: application/json` (the backend returns the same structure as plain JSON) and force
 *    `parseAs: 'json'`.
 *  - the path is prose-only in the spec, so the client types the body `unknown`; we cast to the
 *    hand-written {@link RawCatalog} before parsing.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { publicClient } from './client';
import {
  parseCatalog,
  type ArchiveDistribution,
  type ParsedCatalog,
  type RawCatalog,
} from './catalog-types';

export const catalogQueryKeys = {
  /** The raw catalog document is language-independent; parsing happens per-language in `select`. */
  catalog: () => ['public', 'catalog'] as const,
};

/** The backend sends `Cache-Control: public, max-age=300`; match that as the client stale window. */
const CATALOG_STALE_MS = 5 * 60 * 1000;

async function fetchCatalog(): Promise<RawCatalog> {
  const { data, error, response } = await publicClient.GET('/v1/catalog', {
    headers: { Accept: 'application/json' },
    parseAs: 'json',
  });
  // The ProblemDetails middleware rethrows a `ProblemError` for non-2xx, so `error` mirrors it; be
  // defensive in case a transport-level failure surfaced here without a parsed body.
  if (error || !response.ok) {
    throw error ?? new Error(`Catalog request failed (${response.status})`);
  }
  return (data ?? {}) as RawCatalog;
}

/**
 * Load + parse the DCAT-AP catalog, localized to the active UI language. The raw document is cached
 * language-independently; `select` re-runs {@link parseCatalog} with the current language, so a
 * language switch re-localizes titles/keywords without a network round-trip.
 */
export function useCatalog(): UseQueryResult<ParsedCatalog> {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;

  return useQuery({
    queryKey: catalogQueryKeys.catalog(),
    staleTime: CATALOG_STALE_MS,
    queryFn: fetchCatalog,
    select: (raw) => parseCatalog(raw, lang),
  });
}

/** Thin selector over {@link useCatalog} for callers that only need the downloadable archives. */
export function useArchives(): UseQueryResult<ArchiveDistribution[]> {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;

  return useQuery({
    queryKey: catalogQueryKeys.catalog(),
    staleTime: CATALOG_STALE_MS,
    queryFn: fetchCatalog,
    select: (raw) => parseCatalog(raw, lang).archives,
  });
}

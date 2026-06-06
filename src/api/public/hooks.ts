/**
 * Example typed query hooks for Public.Api — minimal, to prove the end-to-end wiring
 * (client + middleware + TanStack Query). Full feature hooks come in later phases (catalog
 * browse, map, entity detail).
 *
 * Because the Public.Api spec declares no response schemas (pitfall: inline/prose-only specs),
 * the response shapes here are HAND-WRITTEN best-effort types. Treat them as provisional: when
 * the backend publishes richer schemas, regenerate and tighten these. Query params are passed
 * through `params.query` even though the generated `paths` type them as `never`, so we cast at
 * the call site and keep the hand-typed params on the hook's public surface.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { publicClient } from './client';
import { DEFAULT_PAGE_SIZE, type OffsetPageParams } from '@/api/pagination';
import type { CodelistScheme, CodelistConcept } from '@/i18n/codelist-labels';

/** Provisional shape of a building list item (open-data, masked coords). */
export interface PublicBuilding {
  id: string;
  slug?: string;
  name?: string;
  buildingType?: string;
  [key: string]: unknown;
}

/** Provisional shape of an observable property (`/v1/properties`). */
export interface PublicProperty {
  code: string;
  label?: string;
  applicableUnit?: string;
  [key: string]: unknown;
}

/** Filters accepted by `/v1/buildings` (offset/page; see spec prose). */
export interface PublicBuildingsParams extends OffsetPageParams {
  buildingType?: string;
  /** `minLon,minLat,maxLon,maxLat`. */
  bbox?: string;
}

export const publicQueryKeys = {
  buildings: (params: PublicBuildingsParams) => ['public', 'buildings', params] as const,
  properties: () => ['public', 'properties'] as const,
  codelist: (scheme: string) => ['public', 'codelist', scheme] as const,
};

/** Raw member of a `/v1/codelists/{scheme}` response (Public.Api SKOS; cs+en prefLabels). */
interface CodelistMember {
  code: string;
  labelEn?: string;
  labelCs?: string;
  [key: string]: unknown;
}

/**
 * List public buildings (offset/page paginated). Example hook — returns the raw response array;
 * later phases add proper `OffsetPage` envelope handling once the response shape is pinned down.
 */
export function usePublicBuildings(
  params: PublicBuildingsParams = {},
): UseQueryResult<PublicBuilding[]> {
  const query = { pageSize: DEFAULT_PAGE_SIZE, ...params };
  return useQuery({
    queryKey: publicQueryKeys.buildings(query),
    queryFn: async ({ signal }) => {
      const { data } = await publicClient.GET('/v1/buildings', {
        // Spec types query as `never`; pass through with a cast (documented limitation).
        params: { query } as never,
        signal,
      });
      return (data ?? []) as PublicBuilding[];
    },
  });
}

/** List the observable properties catalogue (`/v1/properties`). Example hook. */
export function usePublicProperties(): UseQueryResult<PublicProperty[]> {
  return useQuery({
    queryKey: publicQueryKeys.properties(),
    queryFn: async ({ signal }) => {
      const { data } = await publicClient.GET('/v1/properties', { signal });
      // Public.Api returns `{ items: [...], license }` — the members live under `items`,
      // not a bare array. (The `label` is English-only; there are no cs/en prefLabels here.)
      return ((data ?? {}) as { items?: PublicProperty[] }).items ?? [];
    },
  });
}

/**
 * Fetch a SKOS codelist scheme from Public.Api (`/v1/codelists/{scheme}`) and shape it into a
 * `CodelistScheme` (`{ [code]: { code, prefLabel } }`) for `useCodelistLabel` and code pickers.
 *
 * Codelists are open reference data (anonymous, CORS-open). Fetching them on the operator side
 * does NOT violate the "two read sources" rule — that governs entity/catalog data (precise vs.
 * masked coords, `asOf`), not the shared controlled vocabulary, which has a single public home.
 * Cached for an hour: codelists change rarely.
 */
export function useCodelistScheme(scheme: string): UseQueryResult<CodelistScheme> {
  return useQuery({
    queryKey: publicQueryKeys.codelist(scheme),
    staleTime: 60 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const { data } = await publicClient.GET('/v1/codelists/{scheme}', {
        params: { path: { scheme } },
        signal,
      });
      // Public.Api returns `{ scheme, iri, concepts: [...], license }` (SKOS ConceptScheme),
      // not a bare array — the members live under `concepts`.
      const body = (data ?? {}) as { concepts?: CodelistMember[] };
      const members = body.concepts ?? [];
      const result: CodelistScheme = {};
      for (const member of members) {
        const concept: CodelistConcept = {
          code: member.code,
          prefLabel: { en: member.labelEn, cs: member.labelCs },
        };
        result[member.code] = concept;
      }
      return result;
    },
  });
}

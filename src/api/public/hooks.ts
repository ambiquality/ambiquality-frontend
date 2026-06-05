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
};

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
      return (data ?? []) as PublicProperty[];
    },
  });
}

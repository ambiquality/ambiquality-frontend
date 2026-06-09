/**
 * TanStack Query hooks for the public map's two read endpoints. They bypass the generated
 * `openapi-fetch` client because these paths aren't in the (prose-only) Public.Api schema yet —
 * a thin `publicGet` does the fetch and reuses the shared RFC 9457 `ProblemError` handling, so the
 * map's errors flow through the same path as the rest of the app.
 *
 * Data-loading contract (the "no lag" goal): the map loads only {@link useMapSnapshot} — one
 * cached call for the selected quantity. {@link useObservationAggregate} runs only after a building
 * is picked, once per time range, and TanStack Query caches each range so revisiting is instant.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { problemErrorFromResponse } from '@/api/middleware';
import type { MapProperty, MapSnapshot, ObservationAggregate, TimeRange } from './map-types';

async function publicGet<T>(
  path: string,
  query: Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }
  // Public.Api bases are absolute and may carry a path prefix (e.g. .../public), so concatenate
  // rather than `new URL(path, base)` (a leading-slash path would drop the prefix).
  const url = `${env.publicApiBase}${path}${qs.size ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw await problemErrorFromResponse(res);
  return (await res.json()) as T;
}

/** Milliseconds in each selectable look-back window. */
const RANGE_MS: Record<TimeRange, number> = {
  day: 24 * 3_600_000,
  week: 7 * 24 * 3_600_000,
  month: 30 * 24 * 3_600_000,
  year: 365 * 24 * 3_600_000,
};

export const mapQueryKeys = {
  properties: () => ['public', 'map', 'properties'] as const,
  snapshot: (parameterCode: string, bbox?: string) =>
    ['public', 'map', 'snapshot', parameterCode, bbox ?? null] as const,
  aggregate: (
    target: { buildingId?: string | null; sensorId?: string | null },
    parameterCode: string,
    range: TimeRange,
  ) =>
    [
      'public',
      'observations',
      'aggregate',
      target.buildingId ?? null,
      target.sensorId ?? null,
      parameterCode,
      range,
    ] as const,
};

/**
 * The map's quantity catalogue (`/v1/properties`), used to populate the filter. Uses the same
 * late-bound `publicGet` as the other map queries (rather than the shared openapi-fetch client) so
 * one consistent fetch path serves the whole feature. Cached for an hour: the catalogue is stable.
 */
export function useMapProperties(): UseQueryResult<MapProperty[]> {
  return useQuery({
    queryKey: mapQueryKeys.properties(),
    staleTime: 60 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const body = await publicGet<{ items?: MapProperty[] }>('/v1/properties', {}, signal);
      return body.items ?? [];
    },
  });
}

/**
 * The cached latest-value snapshot for one quantity — the only thing the map loads up front.
 * Disabled until a quantity is selected. `staleTime` matches the backend's short Redis TTL.
 */
export function useMapSnapshot(
  parameterCode: string | null,
  bbox?: string,
): UseQueryResult<MapSnapshot> {
  return useQuery({
    queryKey: mapQueryKeys.snapshot(parameterCode ?? '', bbox),
    enabled: !!parameterCode,
    staleTime: 60_000,
    queryFn: ({ signal }) =>
      publicGet<MapSnapshot>('/v1/map/snapshot', { parameterCode: parameterCode!, bbox }, signal),
  });
}

export interface ObservationAggregateParams {
  /** Aggregate across a building's sensors. Mutually exclusive with {@link sensorId}. */
  buildingId?: string | null;
  /** Aggregate a single sensor (operator sensor-detail charts). Mutually exclusive with `buildingId`. */
  sensorId?: string | null;
  parameterCode: string | null;
  range: TimeRange;
}

/**
 * Bucketed series + distribution stats for one quantity over a time range, scoped to either a
 * building (the map dialog's trend line + boxplot) or a single sensor (the operator sensor-detail
 * charts). Fetched only once a target + quantity are known; each `(target, quantity, range)` is
 * cached, so switching ranges back and forth doesn't refetch.
 */
export function useObservationAggregate({
  buildingId,
  sensorId,
  parameterCode,
  range,
}: ObservationAggregateParams): UseQueryResult<ObservationAggregate> {
  return useQuery({
    queryKey: mapQueryKeys.aggregate({ buildingId, sensorId }, parameterCode ?? '', range),
    enabled: !!(buildingId || sensorId) && !!parameterCode,
    staleTime: 5 * 60_000,
    queryFn: ({ signal }) => {
      const to = Date.now();
      const from = to - RANGE_MS[range];
      return publicGet<ObservationAggregate>(
        '/v1/observations/aggregate',
        {
          buildingId: buildingId ?? undefined,
          sensorId: sensorId ?? undefined,
          parameterCode: parameterCode!,
          from: new Date(from).toISOString(),
          to: new Date(to).toISOString(),
          bucket: 'auto',
        },
        signal,
      );
    },
  });
}

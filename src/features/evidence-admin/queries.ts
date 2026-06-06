/**
 * TanStack Query hooks + query-key registry for the operator evidence admin (F05–F09).
 *
 * All reads/writes go through the typed {@link evidenceClient} (Evidence.Api ONLY — never
 * Public.Api; see the "two read sources" rule). The client resolves `{ data }` on success and
 * REJECTS with a `ProblemError` on any non-2xx (problem-details middleware), so query/mutation
 * error handling is a plain `catch`/`onError` of `ProblemError`.
 *
 * Temporal model (pitfall: per-attribute PUT + `validFrom`): there is NO "save object" endpoint.
 * Each building/room/sensor attribute has its own `PUT .../{attr}` carrying a `validFrom`; the
 * server closes the open history row and opens a new one (204). Reads accept an `asOf` query
 * param to project a past state. The generated `paths` type the GET query as `never` (the
 * vendored spec doesn't declare `asOf`), so — exactly as the Public.Api hooks do — we pass it
 * through `params.query` with a documented cast at the call site.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { evidenceClient } from '@/api/evidence/client';
import type { components } from '@/api/evidence/schema';

type Schemas = components['schemas'];
export type BuildingSnapshot = Schemas['BuildingSnapshotResponse'];
export type RoomSnapshot = Schemas['RoomSnapshotResponse'];
export type SensorSnapshot = Schemas['SensorSnapshotResponse'];
export type SensorRegistered = Schemas['SensorRegisteredResponse'];
export type RegisterBuildingResult = Schemas['RegisterBuildingResult'];

/** A past-state read selector. `null`/omitted = latest. */
export type AsOf = string | null | undefined;

/** Stable query keys; `asOf` is part of the key so latest vs. projected states cache apart. */
export const evidenceKeys = {
  all: ['evidence'] as const,
  buildings: () => [...evidenceKeys.all, 'buildings'] as const,
  building: (buildingId: string, asOf: AsOf = null) =>
    [...evidenceKeys.all, 'building', buildingId, asOf ?? 'latest'] as const,
  rooms: (buildingId: string) => [...evidenceKeys.all, 'rooms', buildingId] as const,
  room: (buildingId: string, roomId: string, asOf: AsOf = null) =>
    [...evidenceKeys.all, 'room', buildingId, roomId, asOf ?? 'latest'] as const,
  sensors: (buildingId: string, roomId: string) =>
    [...evidenceKeys.all, 'sensors', buildingId, roomId] as const,
  sensor: (buildingId: string, roomId: string, sensorId: string, asOf: AsOf = null) =>
    [...evidenceKeys.all, 'sensor', buildingId, roomId, sensorId, asOf ?? 'latest'] as const,
};

/** Build the `asOf` query object, or `undefined` to request the latest state. */
function asOfQuery(asOf: AsOf): { query: { asOf: string } } | undefined {
  return asOf ? { query: { asOf } } : undefined;
}

// --- Buildings -------------------------------------------------------------------------------

export function useBuildings(): UseQueryResult<BuildingSnapshot[]> {
  return useQuery({
    queryKey: evidenceKeys.buildings(),
    queryFn: async ({ signal }) => {
      const { data } = await evidenceClient.GET('/v1/buildings', { signal });
      return data ?? [];
    },
  });
}

export function useBuilding(buildingId: string, asOf: AsOf = null): UseQueryResult<BuildingSnapshot> {
  return useQuery({
    queryKey: evidenceKeys.building(buildingId, asOf),
    enabled: Boolean(buildingId),
    queryFn: async ({ signal }) => {
      const { data } = await evidenceClient.GET('/v1/buildings/{buildingId}', {
        params: { path: { buildingId }, ...asOfQuery(asOf) } as never,
        signal,
      });
      return data!;
    },
  });
}

export function useRegisterBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['RegisterBuildingRequest']) => {
      const { data } = await evidenceClient.POST('/v1/buildings', { body });
      return data!;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: evidenceKeys.buildings() });
    },
  });
}

// --- Rooms -----------------------------------------------------------------------------------

export function useRooms(buildingId: string): UseQueryResult<RoomSnapshot[]> {
  return useQuery({
    queryKey: evidenceKeys.rooms(buildingId),
    enabled: Boolean(buildingId),
    queryFn: async ({ signal }) => {
      const { data } = await evidenceClient.GET('/v1/buildings/{buildingId}/rooms', {
        params: { path: { buildingId } },
        signal,
      });
      return data ?? [];
    },
  });
}

export function useRoom(
  buildingId: string,
  roomId: string,
  asOf: AsOf = null,
): UseQueryResult<RoomSnapshot> {
  return useQuery({
    queryKey: evidenceKeys.room(buildingId, roomId, asOf),
    enabled: Boolean(buildingId && roomId),
    queryFn: async ({ signal }) => {
      const { data } = await evidenceClient.GET('/v1/buildings/{buildingId}/rooms/{roomId}', {
        params: { path: { buildingId, roomId }, ...asOfQuery(asOf) } as never,
        signal,
      });
      return data!;
    },
  });
}

export function useRegisterRoom(buildingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['RegisterRoomRequest']) => {
      const { data } = await evidenceClient.POST('/v1/buildings/{buildingId}/rooms', {
        params: { path: { buildingId } },
        body,
      });
      return data!;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: evidenceKeys.rooms(buildingId) });
    },
  });
}

// --- Sensors ---------------------------------------------------------------------------------

export function useSensors(buildingId: string, roomId: string): UseQueryResult<SensorSnapshot[]> {
  return useQuery({
    queryKey: evidenceKeys.sensors(buildingId, roomId),
    enabled: Boolean(buildingId && roomId),
    queryFn: async ({ signal }) => {
      const { data } = await evidenceClient.GET(
        '/v1/buildings/{buildingId}/rooms/{roomId}/sensors',
        { params: { path: { buildingId, roomId } }, signal },
      );
      return data ?? [];
    },
  });
}

export function useSensor(
  buildingId: string,
  roomId: string,
  sensorId: string,
  asOf: AsOf = null,
): UseQueryResult<SensorSnapshot> {
  return useQuery({
    queryKey: evidenceKeys.sensor(buildingId, roomId, sensorId, asOf),
    enabled: Boolean(buildingId && roomId && sensorId),
    queryFn: async ({ signal }) => {
      const { data } = await evidenceClient.GET(
        '/v1/buildings/{buildingId}/rooms/{roomId}/sensors/{sensorId}',
        {
          params: { path: { buildingId, roomId, sensorId }, ...asOfQuery(asOf) } as never,
          signal,
        },
      );
      return data!;
    },
  });
}

export function useRegisterSensor(buildingId: string, roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['RegisterSensorRequest']) => {
      const { data } = await evidenceClient.POST(
        '/v1/buildings/{buildingId}/rooms/{roomId}/sensors',
        { params: { path: { buildingId, roomId } }, body },
      );
      // SensorRegisteredResponse — carries the one-time apiKey.
      return data!;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: evidenceKeys.sensors(buildingId, roomId) });
    },
  });
}

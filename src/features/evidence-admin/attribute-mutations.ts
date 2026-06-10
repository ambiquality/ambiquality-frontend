/**
 * Per-attribute temporal-edit mutations (F07, the hardest screen).
 *
 * Every building/room/sensor attribute is changed by its OWN `PUT .../{attr}` carrying a
 * `validFrom`; the server closes the open history row and opens a new one and answers `204`.
 * There is deliberately no "save the whole object" form. Each hook below wraps one such PUT,
 * resolves to `void`, REJECTS with a `ProblemError` on failure (so the caller can surface
 * `409 overlapping-validity-range` on the offending field), and invalidates the entity's
 * latest snapshot on success.
 *
 * Collections (room pollution sources, sensor measured parameters) are NOT temporal attributes:
 * they are added via `POST` and "removed" via a `PUT .../{code}` soft-close carrying `validTo`
 * (NOT a DELETE verb). Those mutations live here too for colocation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evidenceClient } from '@/api/evidence/client';
import type { components } from '@/api/evidence/schema';
import { evidenceKeys } from './queries';

type Schemas = components['schemas'];

/** Invalidate every cached `asOf` projection of one building (latest + any history reads). */
function buildingInvalidator(qc: ReturnType<typeof useQueryClient>, buildingId: string) {
  return () =>
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'evidence' &&
        q.queryKey[1] === 'building' &&
        q.queryKey[2] === buildingId,
    });
}

function roomInvalidator(
  qc: ReturnType<typeof useQueryClient>,
  buildingId: string,
  roomId: string,
) {
  return () =>
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'evidence' &&
        q.queryKey[1] === 'room' &&
        q.queryKey[2] === buildingId &&
        q.queryKey[3] === roomId,
    });
}

function sensorInvalidator(
  qc: ReturnType<typeof useQueryClient>,
  buildingId: string,
  roomId: string,
  sensorId: string,
) {
  return () =>
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'evidence' &&
        q.queryKey[1] === 'sensor' &&
        q.queryKey[2] === buildingId &&
        q.queryKey[3] === roomId &&
        q.queryKey[4] === sensorId,
    });
}

// --- Building attribute PUTs -----------------------------------------------------------------

export function useChangeBuildingName(buildingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeBuildingNameRequest']) => {
      await evidenceClient.PUT('/v1/buildings/{buildingId}/name', {
        params: { path: { buildingId } },
        body,
      });
    },
    onSuccess: buildingInvalidator(qc, buildingId),
  });
}

export function useChangeBuildingAddress(buildingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeBuildingAddressRequest']) => {
      await evidenceClient.PUT('/v1/buildings/{buildingId}/address', {
        params: { path: { buildingId } },
        body,
      });
    },
    onSuccess: buildingInvalidator(qc, buildingId),
  });
}

export function useChangeBuildingType(buildingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeBuildingTypeRequest']) => {
      await evidenceClient.PUT('/v1/buildings/{buildingId}/type', {
        params: { path: { buildingId } },
        body,
      });
    },
    onSuccess: buildingInvalidator(qc, buildingId),
  });
}

export function useChangeBuildingLocation(buildingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeBuildingLocationRequest']) => {
      await evidenceClient.PUT('/v1/buildings/{buildingId}/location', {
        params: { path: { buildingId } },
        body,
      });
    },
    onSuccess: buildingInvalidator(qc, buildingId),
  });
}

export function useChangeBuildingYears(buildingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeBuildingYearsRequest']) => {
      await evidenceClient.PUT('/v1/buildings/{buildingId}/years', {
        params: { path: { buildingId } },
        body,
      });
    },
    onSuccess: buildingInvalidator(qc, buildingId),
  });
}

// --- Room attribute PUTs ---------------------------------------------------------------------

function roomAttrPath(attr: 'name' | 'function' | 'exposure' | 'ventilation') {
  return `/v1/buildings/{buildingId}/rooms/{roomId}/${attr}` as const;
}

/** Name/function/exposure/ventilation all share the `{ newValue, validFrom }` request shape. */
export function useChangeRoomTextAttribute(
  buildingId: string,
  roomId: string,
  attr: 'name' | 'function' | 'exposure' | 'ventilation',
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeRoomAttributeRequest']) => {
      await evidenceClient.PUT(roomAttrPath(attr), {
        params: { path: { buildingId, roomId } },
        body,
      });
    },
    onSuccess: roomInvalidator(qc, buildingId, roomId),
  });
}

export function useChangeRoomFloor(buildingId: string, roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeRoomFloorRequest']) => {
      await evidenceClient.PUT('/v1/buildings/{buildingId}/rooms/{roomId}/floor', {
        params: { path: { buildingId, roomId } },
        body,
      });
    },
    onSuccess: roomInvalidator(qc, buildingId, roomId),
  });
}

export function useChangeRoomGeometry(buildingId: string, roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeRoomGeometryRequest']) => {
      await evidenceClient.PUT('/v1/buildings/{buildingId}/rooms/{roomId}/geometry', {
        params: { path: { buildingId, roomId } },
        body,
      });
    },
    onSuccess: roomInvalidator(qc, buildingId, roomId),
  });
}

export function useAddPollutionSource(buildingId: string, roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['AddPollutionSourceRequest']) => {
      await evidenceClient.POST('/v1/buildings/{buildingId}/rooms/{roomId}/pollution-sources', {
        params: { path: { buildingId, roomId } },
        body,
      });
    },
    onSuccess: roomInvalidator(qc, buildingId, roomId),
  });
}

/** Soft-close a pollution source via PUT (NOT DELETE), carrying `validTo`. */
export function useRemovePollutionSource(buildingId: string, roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sourceCode,
      body,
    }: {
      sourceCode: string;
      body: Schemas['RemovePollutionSourceRequest'];
    }) => {
      await evidenceClient.PUT(
        '/v1/buildings/{buildingId}/rooms/{roomId}/pollution-sources/{sourceCode}',
        { params: { path: { buildingId, roomId, sourceCode } }, body },
      );
    },
    onSuccess: roomInvalidator(qc, buildingId, roomId),
  });
}

// --- Sensor attribute PUTs (F08/F09) ---------------------------------------------------------

export function useChangeSensorIdentity(buildingId: string, roomId: string, sensorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeSensorIdentityRequest']) => {
      await evidenceClient.PUT(
        '/v1/buildings/{buildingId}/rooms/{roomId}/sensors/{sensorId}/identity',
        { params: { path: { buildingId, roomId, sensorId } }, body },
      );
    },
    onSuccess: sensorInvalidator(qc, buildingId, roomId, sensorId),
  });
}

/** F09: lifecycle status (active / maintenance / decommissioned). */
export function useChangeSensorStatus(buildingId: string, roomId: string, sensorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeSensorStatusRequest']) => {
      await evidenceClient.PUT(
        '/v1/buildings/{buildingId}/rooms/{roomId}/sensors/{sensorId}/status',
        { params: { path: { buildingId, roomId, sensorId } }, body },
      );
    },
    onSuccess: sensorInvalidator(qc, buildingId, roomId, sensorId),
  });
}

/** F09: relocate the sensor to another room (PUT placement with `newRoomId`). */
export function useChangeSensorPlacement(buildingId: string, roomId: string, sensorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeSensorPlacementRequest']) => {
      await evidenceClient.PUT(
        '/v1/buildings/{buildingId}/rooms/{roomId}/sensors/{sensorId}/placement',
        { params: { path: { buildingId, roomId, sensorId } }, body },
      );
    },
    onSuccess: () => {
      // Relocation moves the sensor between rooms: invalidate sensor + both room sensor lists.
      void qc.invalidateQueries({ queryKey: evidenceKeys.sensors(buildingId, roomId) });
      sensorInvalidator(qc, buildingId, roomId, sensorId)();
    },
  });
}

/** F08: supplementary installation details — one composite temporal attribute. */
export function useChangeSensorInstallation(buildingId: string, roomId: string, sensorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['ChangeSensorInstallationRequest']) => {
      await evidenceClient.PUT(
        '/v1/buildings/{buildingId}/rooms/{roomId}/sensors/{sensorId}/installation',
        { params: { path: { buildingId, roomId, sensorId } }, body },
      );
    },
    onSuccess: sensorInvalidator(qc, buildingId, roomId, sensorId),
  });
}

export function useAddMeasuredParameter(buildingId: string, roomId: string, sensorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['AddMeasuredParameterRequest']) => {
      await evidenceClient.POST(
        '/v1/buildings/{buildingId}/rooms/{roomId}/sensors/{sensorId}/measured-parameters',
        { params: { path: { buildingId, roomId, sensorId } }, body },
      );
    },
    onSuccess: sensorInvalidator(qc, buildingId, roomId, sensorId),
  });
}

/** Soft-close a measured parameter via PUT (NOT DELETE), carrying `validTo`. */
export function useRemoveMeasuredParameter(buildingId: string, roomId: string, sensorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      parameterCode,
      body,
    }: {
      parameterCode: string;
      body: Schemas['RemoveMeasuredParameterRequest'];
    }) => {
      await evidenceClient.PUT(
        '/v1/buildings/{buildingId}/rooms/{roomId}/sensors/{sensorId}/measured-parameters/{parameterCode}',
        { params: { path: { buildingId, roomId, sensorId, parameterCode } }, body },
      );
    },
    onSuccess: sensorInvalidator(qc, buildingId, roomId, sensorId),
  });
}

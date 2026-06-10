/**
 * TanStack Query hooks for the public entity catalog (UC11/UC14/UC18): building, room and
 * sensor details plus the building → rooms → sensors drill-down lists. Like the map hooks,
 * they use the late-bound {@link publicGet} because the Public.Api spec documents these
 * paths in prose only; the response shapes below mirror `CatalogContracts.cs`.
 *
 * Catalog lists are offset/page paginated (`CatalogPage` envelope with a `total` and an
 * absolute `next` IRI); observations elsewhere are keyset — the pagination styles are
 * intentionally heterogeneous (see catalog-browse README).
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { publicGet } from './map-hooks';

/** Czech OFN address of a building (current temporal state); fields null when unrecorded. */
export interface PublicAddress {
  addressPointCode?: number | null;
  streetName?: string | null;
  houseNumber?: number | null;
  houseNumberType?: string | null;
  orientationNumber?: number | null;
  orientationNumberLetter?: string | null;
  municipalityName?: string | null;
  municipalityPartName?: string | null;
  psc?: string | null;
  districtName?: string | null;
  regionName?: string | null;
}

export interface PublicBuildingDetail {
  id: string;
  iri: string;
  name?: string | null;
  address: PublicAddress;
  buildingTypeCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  yearBuilt?: number | null;
  yearRenovated?: number | null;
  license: string;
}

export interface PublicRoomDetail {
  id: string;
  iri: string;
  buildingId: string;
  name?: string | null;
  floor: number;
  functionCode?: string | null;
  exposureCode?: string | null;
  areaM2?: number | null;
  ceilingHeightM?: number | null;
  ventilationType?: string | null;
  pollutionSources: string[];
  license: string;
}

export interface PublicMeasuredParameter {
  code: string;
  quantityKindUri?: string | null;
  unitUri?: string | null;
}

export interface PublicSensorDetail {
  id: string;
  iri: string;
  buildingId: string;
  roomId: string;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  statusCode?: string | null;
  measuredParameters: PublicMeasuredParameter[];
  license: string;
}

/** Offset-paged catalog envelope (`next` is an absolute IRI or null on the last page). */
export interface CatalogPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  next: string | null;
  license: string;
}

export interface BuildingListParams {
  page?: number;
  pageSize?: number;
  buildingType?: string;
  /** `minLon,minLat,maxLon,maxLat`. */
  bbox?: string;
}

export const entityQueryKeys = {
  buildings: (params: BuildingListParams) => ['public', 'entity', 'buildings', params] as const,
  building: (id: string) => ['public', 'entity', 'building', id] as const,
  buildingRooms: (buildingId: string, page: number) =>
    ['public', 'entity', 'building', buildingId, 'rooms', page] as const,
  room: (id: string) => ['public', 'entity', 'room', id] as const,
  roomSensors: (roomId: string, page: number) =>
    ['public', 'entity', 'room', roomId, 'sensors', page] as const,
  sensor: (id: string) => ['public', 'entity', 'sensor', id] as const,
};

const CATALOG_STALE_MS = 5 * 60_000;

/** Paged building list with the F14 catalog filters. */
export function useBuildingList(
  params: BuildingListParams = {},
): UseQueryResult<CatalogPage<PublicBuildingDetail>> {
  return useQuery({
    queryKey: entityQueryKeys.buildings(params),
    staleTime: CATALOG_STALE_MS,
    queryFn: ({ signal }) =>
      publicGet<CatalogPage<PublicBuildingDetail>>('/v1/buildings/', { ...params }, signal),
  });
}

export function useBuildingDetail(id: string | undefined): UseQueryResult<PublicBuildingDetail> {
  return useQuery({
    queryKey: entityQueryKeys.building(id ?? ''),
    enabled: !!id,
    staleTime: CATALOG_STALE_MS,
    queryFn: ({ signal }) =>
      publicGet<PublicBuildingDetail>(`/v1/buildings/${id}`, {}, signal),
  });
}

export function useBuildingRooms(
  buildingId: string | undefined,
  page = 1,
): UseQueryResult<CatalogPage<PublicRoomDetail>> {
  return useQuery({
    queryKey: entityQueryKeys.buildingRooms(buildingId ?? '', page),
    enabled: !!buildingId,
    staleTime: CATALOG_STALE_MS,
    queryFn: ({ signal }) =>
      publicGet<CatalogPage<PublicRoomDetail>>(`/v1/buildings/${buildingId}/rooms`, { page }, signal),
  });
}

export function useRoomDetail(id: string | undefined): UseQueryResult<PublicRoomDetail> {
  return useQuery({
    queryKey: entityQueryKeys.room(id ?? ''),
    enabled: !!id,
    staleTime: CATALOG_STALE_MS,
    queryFn: ({ signal }) => publicGet<PublicRoomDetail>(`/v1/rooms/${id}`, {}, signal),
  });
}

export function useRoomSensors(
  roomId: string | undefined,
  page = 1,
): UseQueryResult<CatalogPage<PublicSensorDetail>> {
  return useQuery({
    queryKey: entityQueryKeys.roomSensors(roomId ?? '', page),
    enabled: !!roomId,
    staleTime: CATALOG_STALE_MS,
    queryFn: ({ signal }) =>
      publicGet<CatalogPage<PublicSensorDetail>>(`/v1/rooms/${roomId}/sensors`, { page }, signal),
  });
}

export function useSensorDetail(id: string | undefined): UseQueryResult<PublicSensorDetail> {
  return useQuery({
    queryKey: entityQueryKeys.sensor(id ?? ''),
    enabled: !!id,
    staleTime: CATALOG_STALE_MS,
    queryFn: ({ signal }) => publicGet<PublicSensorDetail>(`/v1/sensors/${id}`, {}, signal),
  });
}

/** Single-line postal address (street + number, municipality), or null when nothing is recorded. */
export function formatPublicAddress(address: PublicAddress | undefined): string | null {
  if (!address) return null;
  const number = [address.houseNumber, address.orientationNumber]
    .filter((part) => part != null)
    .join('/');
  const street = [address.streetName, number].filter(Boolean).join(' ').trim();
  const municipality = [address.psc, address.municipalityName].filter(Boolean).join(' ').trim();
  const line = [street, municipality].filter(Boolean).join(', ');
  return line || null;
}

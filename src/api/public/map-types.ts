/**
 * Response shapes for the two map-serving Public.Api endpoints (see
 * `thoughts/shared/plans/PLAN-public-map-f18.md`). These are **hand-written contract types**:
 * the backend endpoints don't exist yet (an MSW mock stands in), and — like the rest of
 * Public.Api — the spec declares no component schemas. When the real routes ship, regenerate
 * and reconcile against these.
 */

/** One map marker: a building with its masked coordinate and latest value for a quantity. */
export interface MapSnapshotItem {
  buildingId: string;
  /** Public slug (`bld-…`) for click-through to the entity detail route. */
  slug: string;
  name: string;
  /** Masked per the building's anonymization level (street / municipality / precise). */
  lat: number;
  lon: number;
  /** Mean of the building's measuring sensors' latest values; `null` when none/stale. */
  latestValue: number | null;
  /** ISO timestamp of the freshest contributing observation, or `null`. */
  observedAt: string | null;
  /** True when the freshest observation is older than the freshness window (render greyed). */
  stale: boolean;
  sensorCount: number;
}

/** `GET /v1/map/snapshot?parameterCode&bbox` — Redis-cached marker set for one quantity. */
export interface MapSnapshot {
  parameterCode: string;
  /** Canonical unit symbol for the quantity (e.g. `ppm`, `°C`), or `null` if unknown. */
  unit: string | null;
  /** When the snapshot was computed/cached (ISO). */
  asOf: string;
  items: MapSnapshotItem[];
  license: string;
}

/** One time bucket of aggregated observations (drives the trend line). */
export interface AggregateBucket {
  /** Bucket start (ISO). */
  t: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  p25: number;
  p50: number;
  p75: number;
}

/** Distribution stats over the whole window (drives the boxplot). */
export interface AggregateStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p05: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

/** `GET /v1/observations/aggregate?buildingId|sensorId&parameterCode&from&to&bucket`. */
export interface ObservationAggregate {
  parameterCode: string;
  unit: string | null;
  from: string;
  to: string;
  bucket: string;
  buckets: AggregateBucket[];
  /** `null` when the window holds no observations. */
  stats: AggregateStats | null;
  license: string;
}

/** The four selectable look-back windows offered in the building dialog. */
export type TimeRange = 'day' | 'week' | 'month' | 'year';

/** A measurable quantity from `/v1/properties` (the map's filter options). */
export interface MapProperty {
  code: string;
  label?: string;
  applicableUnit?: string;
}

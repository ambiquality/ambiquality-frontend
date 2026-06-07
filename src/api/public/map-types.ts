/**
 * Response shapes for the map-serving Public.Api endpoints, **derived from the generated OpenAPI
 * schema** (`./schema`) so they stay in sync with the backend — `npm run gen:api:fetch` refreshes
 * the source. We re-export curated aliases (rather than reaching into `components['schemas']`
 * everywhere) and normalize two backend-spec quirks:
 *
 *  - **Numeric `number | string`.** The .NET OpenAPI generator types every numeric field as
 *    `number | string` (it permits string-encoded numbers); Public.Api emits plain JSON numbers at
 *    runtime. `Normalize` collapses those unions back to `number`, keeping an explicit `null`.
 *  - **Nested objects/arrays.** `Normalize` is top-level only, so nested members (`items`,
 *    `buckets`, `stats`) are re-composed from their own normalized aliases below.
 */

import type { components } from './schema';

type Schemas = components['schemas'];

/** Drop the spurious `string` alternative from a numeric union, leaving `number` (and any `null`). */
type DropNumericString<T> = [Extract<T, number>] extends [never] ? T : Exclude<T, string>;
/** Collapse the .NET `number | string` numeric hedge to `number` across a record's own fields. */
type Normalize<T> = { [K in keyof T]: DropNumericString<T[K]> };

/**
 * One map marker: a building with its masked coordinate and latest value for a quantity.
 * `name`/`lat`/`lon` are nullable per the schema (a building may lack a public name or coordinate);
 * the map filters out coordinate-less items before placing markers.
 */
export type MapSnapshotItem = Normalize<Schemas['MapSnapshotItem']>;

/** `GET /v1/map/snapshot?parameterCode&bbox` — Redis-cached marker set for one quantity. */
export type MapSnapshot = Omit<Normalize<Schemas['MapSnapshotResponse']>, 'items'> & {
  items: MapSnapshotItem[];
};

/** One time bucket of aggregated observations (drives the trend line). */
export type AggregateBucket = Normalize<Schemas['AggregateBucketDto']>;

/** Distribution stats over the whole window (drives the boxplot). */
export type AggregateStats = Normalize<Schemas['AggregateStatsDto']>;

/** `GET /v1/observations/aggregate?buildingId|sensorId&parameterCode&from&to&bucket`. */
export type ObservationAggregate = Omit<
  Normalize<Schemas['AggregateResponse']>,
  'buckets' | 'stats'
> & {
  buckets: AggregateBucket[];
  /** `null` when the window holds no observations. */
  stats: AggregateStats | null;
};

/**
 * A measurable quantity from `/v1/properties` (the map's filter options). The full property record;
 * the map uses `code` + `label` (and could use `unitUri`, a QUDT IRI — note: there is no
 * `applicableUnit` field).
 */
export type MapProperty = Normalize<Schemas['PropertyResponse']>;

/** The four selectable look-back windows offered in the building dialog (a frontend-only concept). */
export type TimeRange = 'day' | 'week' | 'month' | 'year';

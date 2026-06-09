/**
 * Synthetic data for the map MSW mock (dev + tests). Deterministic: every value is derived from a
 * seeded hash of its keys, so the map looks the same on each load and tests can assert on it.
 *
 * Coordinates sit in central Prague and are precise — Public.Api no longer coarsens them (the
 * anonymization model was dropped backend-side). Values are generated within realistic display
 * ranges that deliberately straddle the good/moderate/poor bands so the map is visibly colourful.
 */

import type {
  AggregateBucket,
  AggregateStats,
  MapSnapshot,
  MapSnapshotItem,
  ObservationAggregate,
} from '@/api/public/map-types';

const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';

/** Canonical unit symbol per quantity (subset the mock exposes), matching the backend. */
export const PARAMETER_UNITS: Record<string, string> = {
  co2: 'ppm',
  temperature: '°C',
  humidity: '%',
  pm2_5: 'µg/m³',
  pm10: 'µg/m³',
  voc: 'ppb',
  pressure: 'Pa',
  illuminance: 'lx',
};

/** English label per quantity (the mock's stand-in for `/v1/properties` labels). */
const PARAMETER_LABELS: Record<string, string> = {
  co2: 'Carbon dioxide',
  temperature: 'Temperature',
  humidity: 'Relative humidity',
  pm2_5: 'Particulate matter (PM2.5)',
  pm10: 'Particulate matter (PM10)',
  voc: 'Volatile organic compounds',
  pressure: 'Atmospheric pressure',
  illuminance: 'Illuminance',
};

/** Plausible display range `[lo, hi]` per quantity, used to spread generated values across bands. */
const VALUE_RANGE: Record<string, [number, number]> = {
  co2: [430, 1800],
  temperature: [17, 28],
  humidity: [25, 75],
  pm2_5: [3, 55],
  pm10: [8, 130],
  voc: [80, 2600],
  pressure: [98_500, 101_500],
  illuminance: [120, 900],
};

interface MockBuilding {
  buildingId: string;
  slug: string;
  name: string;
  lat: number;
  lon: number;
  sensorCount: number;
  parameters: string[];
}

/** A small catalogue of Prague buildings with precise coordinates. */
export const MOCK_BUILDINGS: MockBuilding[] = [
  {
    buildingId: '11111111-1111-1111-1111-111111111111',
    slug: 'bld-rajska-budova',
    name: 'Rajská budova (VŠE)',
    lat: 50.083,
    lon: 14.441,
    sensorCount: 4,
    parameters: ['co2', 'temperature', 'humidity', 'pm2_5', 'pm10', 'voc'],
  },
  {
    buildingId: '22222222-2222-2222-2222-222222222222',
    slug: 'bld-nova-budova',
    name: 'Nová budova (VŠE)',
    lat: 50.0805,
    lon: 14.4438,
    sensorCount: 3,
    parameters: ['co2', 'temperature', 'humidity', 'pressure'],
  },
  {
    buildingId: '33333333-3333-3333-3333-333333333333',
    slug: 'bld-staromestska-radnice',
    name: 'Staroměstská radnice',
    lat: 50.087,
    lon: 14.421,
    sensorCount: 2,
    parameters: ['co2', 'temperature', 'humidity', 'pm2_5', 'illuminance'],
  },
  {
    buildingId: '44444444-4444-4444-4444-444444444444',
    slug: 'bld-narodni-knihovna',
    name: 'Národní knihovna (Klementinum)',
    lat: 50.086,
    lon: 14.4155,
    sensorCount: 5,
    parameters: ['co2', 'temperature', 'humidity', 'pm2_5', 'pm10', 'voc', 'illuminance'],
  },
  {
    buildingId: '55555555-5555-5555-5555-555555555555',
    slug: 'bld-mestska-knihovna',
    name: 'Městská knihovna v Praze',
    lat: 50.0875,
    lon: 14.4185,
    sensorCount: 2,
    parameters: ['co2', 'temperature', 'humidity', 'voc'],
  },
  {
    buildingId: '66666666-6666-6666-6666-666666666666',
    slug: 'bld-kongresove-centrum',
    name: 'Kongresové centrum Praha',
    lat: 50.0625,
    lon: 14.4285,
    sensorCount: 6,
    parameters: ['co2', 'temperature', 'humidity', 'pm2_5', 'pm10'],
  },
];

/** Deterministic 32-bit string hash (FNV-1a) → seed. */
function hashSeed(...parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG: deterministic [0,1) sequence from a seed. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clampUnit = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** A stable "baseline" fraction [0,1] within the value range for a (building, parameter). */
function baselineFraction(buildingId: string, parameterCode: string): number {
  return mulberry32(hashSeed(buildingId, parameterCode))();
}

function valueFromFraction(parameterCode: string, fraction: number): number {
  const [lo, hi] = VALUE_RANGE[parameterCode] ?? [0, 100];
  const raw = lo + clampUnit(fraction) * (hi - lo);
  // Pressure stays integer-ish; everything else to one decimal.
  return parameterCode === 'pressure' || parameterCode === 'illuminance'
    ? Math.round(raw)
    : Math.round(raw * 10) / 10;
}

/** Properties catalogue the mock serves at `/v1/properties`. */
export function mockProperties() {
  return {
    items: Object.keys(PARAMETER_UNITS).map((code) => ({
      code,
      label: PARAMETER_LABELS[code] ?? code,
      applicableUnit: PARAMETER_UNITS[code],
    })),
    license: LICENSE,
  };
}

/** Build a `/v1/map/snapshot` response for one quantity (optionally clipped to a bbox). */
export function mockSnapshot(parameterCode: string, bbox?: [number, number, number, number]): MapSnapshot {
  const now = Date.now();
  const items: MapSnapshotItem[] = MOCK_BUILDINGS.filter((b) => b.parameters.includes(parameterCode))
    .filter((b) =>
      bbox ? b.lon >= bbox[0] && b.lat >= bbox[1] && b.lon <= bbox[2] && b.lat <= bbox[3] : true,
    )
    .map((b) => {
      const fraction = baselineFraction(b.buildingId, parameterCode);
      // ~1 in 6 buildings reports stale (no recent data) so the "unknown" state is exercised.
      const stale = mulberry32(hashSeed(b.buildingId, parameterCode, 'stale'))() < 0.16;
      const ageMinutes = stale ? 45 : Math.floor(mulberry32(hashSeed(b.buildingId, 'age'))() * 12);
      return {
        buildingId: b.buildingId,
        slug: b.slug,
        name: b.name,
        lat: b.lat,
        lon: b.lon,
        latestValue: stale ? null : valueFromFraction(parameterCode, fraction),
        observedAt: new Date(now - ageMinutes * 60_000).toISOString(),
        stale,
        sensorCount: b.sensorCount,
      };
    });

  return {
    parameterCode,
    unit: PARAMETER_UNITS[parameterCode] ?? null,
    asOf: new Date(now).toISOString(),
    items,
    license: LICENSE,
  };
}

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[idx];
};

/** Bucket count + step (ms) for a window, mirroring the planned `bucket=auto` mapping. */
function bucketingFor(fromMs: number, toMs: number): { count: number; label: string } {
  const hours = (toMs - fromMs) / 3_600_000;
  if (hours <= 26) return { count: 24, label: '1h' }; // ~hourly for a day view
  if (hours <= 24 * 8) return { count: 28, label: '6h' };
  if (hours <= 24 * 32) return { count: 30, label: '1d' };
  return { count: 52, label: '1w' };
}

/** Build a `/v1/observations/aggregate` response: a seeded diurnal series + distribution stats. */
export function mockAggregate(
  entityId: string,
  parameterCode: string,
  fromMs: number,
  toMs: number,
): ObservationAggregate {
  const { count, label } = bucketingFor(fromMs, toMs);
  const [lo, hi] = VALUE_RANGE[parameterCode] ?? [0, 100];
  const span = hi - lo;
  const base = lo + baselineFraction(entityId, parameterCode) * span * 0.7 + span * 0.1;
  const rand = mulberry32(hashSeed(entityId, parameterCode, fromMs, toMs));

  const buckets: AggregateBucket[] = [];
  const allValues: number[] = [];
  const step = (toMs - fromMs) / count;

  for (let i = 0; i < count; i++) {
    const t = fromMs + i * step;
    // Diurnal sine (people present during the day) + seeded noise.
    const tod = ((t % 86_400_000) / 86_400_000) * Math.PI * 2;
    const diurnal = Math.sin(tod - Math.PI / 2) * span * 0.18;
    const noise = (rand() - 0.5) * span * 0.12;
    const avg = clampToRange(base + diurnal + noise, lo, hi, parameterCode);
    const spread = span * (0.04 + rand() * 0.06);
    const min = clampToRange(avg - spread * (1 + rand()), lo, hi, parameterCode);
    const max = clampToRange(avg + spread * (1 + rand()), lo, hi, parameterCode);
    const p25 = clampToRange(avg - spread * 0.5, lo, hi, parameterCode);
    const p75 = clampToRange(avg + spread * 0.5, lo, hi, parameterCode);
    buckets.push({ t: new Date(t).toISOString(), count: 12, min, max, avg, p25, p50: avg, p75 });
    allValues.push(min, p25, avg, p75, max);
  }

  const sorted = [...allValues].sort((a, b) => a - b);
  const stats: AggregateStats | null = sorted.length
    ? {
        count: count * 12,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: round1(sorted.reduce((s, v) => s + v, 0) / sorted.length, parameterCode),
        p05: percentile(sorted, 5),
        p25: percentile(sorted, 25),
        p50: percentile(sorted, 50),
        p75: percentile(sorted, 75),
        p95: percentile(sorted, 95),
      }
    : null;

  return {
    parameterCode,
    unit: PARAMETER_UNITS[parameterCode] ?? null,
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    bucket: label,
    buckets,
    stats,
    license: LICENSE,
  };
}

function round1(n: number, parameterCode: string): number {
  return parameterCode === 'pressure' || parameterCode === 'illuminance'
    ? Math.round(n)
    : Math.round(n * 10) / 10;
}

function clampToRange(n: number, lo: number, hi: number, parameterCode: string): number {
  return round1(Math.min(hi, Math.max(lo, n)), parameterCode);
}

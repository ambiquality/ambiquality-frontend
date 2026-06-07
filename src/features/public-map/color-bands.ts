/**
 * IEQ colour bands: classify a measured value for a quantity into a good / moderate / poor
 * status, and resolve that status to a colour for the map markers, legend and charts.
 *
 * The colours are the single source of truth in the theme (`colors.ieq.*`, see
 * `src/theme/system.ts`) — we read them from Chakra's generated CSS custom properties at runtime
 * so the canvas (MapLibre, d3) matches the DOM. The hex constants here are only a fallback for
 * environments where the CSS variables aren't mounted (jsdom under test, very early paint); they
 * intentionally mirror the theme values.
 *
 * Bands are based on widely used indoor-environment guidelines (cited per quantity). They are a
 * presentation aid, not a regulatory claim — only a subset of the 18 tracked quantities has
 * meaningful public thresholds; the rest fall back to a continuous scale.
 */

export type IeqStatus = 'good' | 'moderate' | 'poor' | 'unknown';
export type IeqQualityStatus = Exclude<IeqStatus, 'unknown'>;

/** A half-open value range `[min, max)` mapped to a quality status. */
interface Band {
  min: number;
  max: number;
  status: IeqQualityStatus;
}

const POS_INF = Number.POSITIVE_INFINITY;
const NEG_INF = Number.NEGATIVE_INFINITY;

/**
 * Per-parameter bands, ordered and fully covering the real line. Two-sided comfort quantities
 * (temperature, humidity) are penalised at both extremes; one-sided pollutants rise monotonically.
 * Keyed by the backend `parameterCode` (lowercase).
 */
const BANDS: Record<string, Band[]> = {
  // CO₂ (ppm) — REHVA/ASHRAE indoor air categories: <800 high IAQ, 800–1400 moderate, >1400 poor.
  co2: [
    { min: NEG_INF, max: 800, status: 'good' },
    { min: 800, max: 1400, status: 'moderate' },
    { min: 1400, max: POS_INF, status: 'poor' },
  ],
  // eCO₂ (ppm) — treated like CO₂ (estimated equivalent).
  eco2: [
    { min: NEG_INF, max: 800, status: 'good' },
    { min: 800, max: 1400, status: 'moderate' },
    { min: 1400, max: POS_INF, status: 'poor' },
  ],
  // Temperature (°C) — thermal comfort: 20–24 comfortable, 18–26 acceptable, outside uncomfortable.
  temperature: [
    { min: NEG_INF, max: 18, status: 'poor' },
    { min: 18, max: 20, status: 'moderate' },
    { min: 20, max: 24, status: 'good' },
    { min: 24, max: 26, status: 'moderate' },
    { min: 26, max: POS_INF, status: 'poor' },
  ],
  // Relative humidity (%) — 40–60 ideal, 30–70 acceptable, outside poor (mould / dryness).
  humidity: [
    { min: NEG_INF, max: 30, status: 'poor' },
    { min: 30, max: 40, status: 'moderate' },
    { min: 40, max: 60, status: 'good' },
    { min: 60, max: 70, status: 'moderate' },
    { min: 70, max: POS_INF, status: 'poor' },
  ],
  // PM2.5 (µg/m³) — WHO 2021 24-h guideline 15; interim/elevated above 35.
  pm2_5: [
    { min: NEG_INF, max: 15, status: 'good' },
    { min: 15, max: 35, status: 'moderate' },
    { min: 35, max: POS_INF, status: 'poor' },
  ],
  // PM10 (µg/m³) — WHO 2021 24-h guideline 45; elevated above 100.
  pm10: [
    { min: NEG_INF, max: 45, status: 'good' },
    { min: 45, max: 100, status: 'moderate' },
    { min: 100, max: POS_INF, status: 'poor' },
  ],
  // TVOC (ppb) — common indoor comfort tiers: <250 good, 250–2000 moderate, >2000 poor.
  voc: [
    { min: NEG_INF, max: 250, status: 'good' },
    { min: 250, max: 2000, status: 'moderate' },
    { min: 2000, max: POS_INF, status: 'poor' },
  ],
};

/**
 * Fallback hex per status, mirroring `colors.ieq.*` in the theme. Used only when the matching CSS
 * custom property isn't readable (jsdom / pre-mount). Keep in sync with `src/theme/system.ts`.
 */
const IEQ_STATUS_FALLBACK_HEX: Record<IeqStatus, string> = {
  good: '#2e7d32',
  moderate: '#b26a00',
  poor: '#c62828',
  unknown: '#5f6368',
};

/** The Chakra v3 CSS custom property that holds a given IEQ status colour. */
const cssVarForStatus = (status: IeqStatus) => `--chakra-colors-ieq-${status}`;

/** Whether the quantity has public quality thresholds (vs. needing a continuous scale). */
export function hasBands(parameterCode: string): boolean {
  return parameterCode in BANDS;
}

/**
 * Classify a value for a quantity into an IEQ status. Returns `'unknown'` when the value is
 * missing/non-finite or the quantity has no defined bands.
 */
export function classify(parameterCode: string, value: number | null | undefined): IeqStatus {
  if (value == null || !Number.isFinite(value)) return 'unknown';
  const bands = BANDS[parameterCode];
  if (!bands) return 'unknown';
  const band = bands.find((b) => value >= b.min && value < b.max);
  return band?.status ?? 'unknown';
}

/**
 * Resolve an IEQ status to a concrete colour string usable on the canvas (MapLibre / d3). Reads
 * the theme's CSS custom property when a `document` is available, falling back to the mirrored hex.
 */
export function resolveStatusColor(status: IeqStatus): string {
  if (typeof document !== 'undefined') {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVarForStatus(status))
      .trim();
    if (value) return value;
  }
  return IEQ_STATUS_FALLBACK_HEX[status];
}

/** The ordered statuses shown in the map legend for a banded quantity. */
export const LEGEND_STATUSES: IeqStatus[] = ['good', 'moderate', 'poor', 'unknown'];

/**
 * Display-unit conversion engine (PER, display-only).
 *
 * The API and archives always speak **canonical** units; this module converts a canonical value
 * into a user-preferred *display* unit purely for presentation. It never mutates the fetched data
 * — callers transform a copy at render time (see `UnitValue` and the d3 charts).
 *
 * Only **dimensionally-clean** conversions live here: affine/linear maps that are exact and depend
 * on nothing but the number itself (temperature, pressure). Conversions that depend on substance
 * properties or reference conditions are intentionally absent:
 *
 *   - **ppm ⇄ mg·m⁻³ is NOT implemented.** A volume-mixing-ratio (ppm) ↔ mass-concentration
 *     (mg/m³) conversion needs the gas's molar mass *and* a reference temperature/pressure
 *     (mg/m³ = ppm · M / Vm, with Vm ≈ 24.45 L/mol only at 25 °C, 1 atm). That is a substance- and
 *     condition-dependent calculation, not a pure unit factor, so encoding a single factor would be
 *     misleading. CO₂/VOC stay in their canonical ppm/ppb. If added later it must carry the gas +
 *     reference conditions explicitly in the UI.
 *
 * QUDT unit IRIs are cited per family for thesis traceability.
 */

/** A selectable display unit for a canonical unit, with the canonical→display transform. */
export interface DisplayUnitOption {
  /** Display unit symbol (e.g. `°F`, `hPa`). Equals the canonical symbol for the identity option. */
  unit: string;
  /** Convert a canonical value into this display unit. Identity for the canonical option. */
  toDisplay: (canonical: number) => number;
}

/** A conversion family: one canonical unit and the display units it can be shown as. */
interface UnitFamily {
  /** Canonical unit symbol, exactly as the API returns it. */
  canonical: string;
  /** Options offered to the user; the canonical (identity) option is always first. */
  options: DisplayUnitOption[];
}

const identity = (canonical: string): DisplayUnitOption => ({ unit: canonical, toDisplay: (v) => v });

/**
 * Conversion families. Keyed by canonical unit symbol (matching `/v1/properties applicableUnit`).
 * Each lists the canonical (identity) option first, then alternative display units.
 */
const FAMILIES: UnitFamily[] = [
  {
    // Temperature — QUDT unit:DEG_C → unit:DEG_F. °F = °C · 9/5 + 32 (affine, exact).
    canonical: '°C',
    options: [identity('°C'), { unit: '°F', toDisplay: (c) => (c * 9) / 5 + 32 }],
  },
  {
    // Pressure — QUDT unit:PA → unit:HectoPA / unit:KiloPA. Decimal SI prefixes (exact).
    // hPa is the meteorological standard for atmospheric pressure (1013.25 hPa ≈ 1 atm).
    canonical: 'Pa',
    options: [
      identity('Pa'),
      { unit: 'hPa', toDisplay: (pa) => pa / 100 },
      { unit: 'kPa', toDisplay: (pa) => pa / 1000 },
    ],
  },
];

const familyByCanonical = new Map(FAMILIES.map((f) => [f.canonical, f]));

/**
 * The display-unit options for a canonical unit: always at least the canonical unit itself, plus
 * any alternatives. Order is stable (canonical first) for rendering a chooser.
 */
export function displayUnitOptions(canonicalUnit: string): string[] {
  const family = familyByCanonical.get(canonicalUnit);
  return family ? family.options.map((o) => o.unit) : [canonicalUnit];
}

/** True when a canonical unit has at least one alternative display unit (i.e. a chooser is useful). */
export function isConvertible(canonicalUnit: string): boolean {
  const family = familyByCanonical.get(canonicalUnit);
  return !!family && family.options.length > 1;
}

/**
 * Convert a canonical value from `fromUnit` (canonical) to `toUnit` (a display option).
 * Returns the converted number, or `null` when the pair isn't a known display conversion (the
 * caller then keeps the canonical value/unit). Same-unit conversions return the value unchanged.
 */
export function convert(value: number, fromUnit: string, toUnit: string): number | null {
  if (fromUnit === toUnit) return value;
  const option = familyByCanonical.get(fromUnit)?.options.find((o) => o.unit === toUnit);
  return option ? option.toDisplay(value) : null;
}

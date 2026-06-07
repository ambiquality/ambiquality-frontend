# `src/units/` — display-unit preference + conversion (PER)

Users can choose preferred display units (e.g. °C/°F, Pa/hPa/kPa). Conversion is **display-only** —
fetched canonical values are never mutated; the API and archives stay canonical. The chosen unit
persists in `localStorage` and applies wherever `UnitValue` (and the map's d3 charts) render that
unit.

## Module map

- `conversions.ts` — the pure engine. `convert(value, fromUnit, toUnit)`, `displayUnitOptions`,
  `isConvertible`. Only **dimensionally-clean** maps live here (affine/linear, exact, value-only):
  temperature `°C↔°F` and pressure `Pa↔hPa↔kPa`, with QUDT IRIs cited per family.
- `unit-preference-context.ts` — React context + the `amq.unit-prefs` storage key + safe default
  (reports canonical units, ignores writes) so consumers work even with no provider mounted.
- `UnitPreferenceProvider.tsx` — holds the per-canonical-unit choices, persisted to `localStorage`
  like the language choice; honours a stored unit only while it's still a valid option.
- `useUnitPreference.ts` — `displayUnitFor(canonicalUnit)` / `setDisplayUnit(canonicalUnit, unit)`.
- `DisplayUnitControl.tsx` — segmented chooser; renders only when the unit has alternatives.

## How callers convert

`UnitValue` is the seam: it reads the user's preference (or an explicit `displayUnit` override),
converts the canonical value for display, and falls back to canonical when no conversion exists.

```tsx
<UnitValue value={canonicalValue} unit={canonicalUnit} />            // follows the preference
<UnitValue value={canonicalValue} unit="°C" displayUnit="°F" />      // pinned override
```

The d3 charts (`TimeSeriesChart`, `BoxPlot`) take a `displayUnit` prop and map values through
`convert` for the scales/labels only — their `buckets`/`stats` data is never mutated.

## Deliberately NOT converted: ppm ⇄ mg·m⁻³

A volume-mixing-ratio (ppm) ↔ mass-concentration (mg/m³) conversion is **not a pure unit factor** —
it needs the gas's molar mass *and* a reference temperature/pressure (`mg/m³ = ppm · M / Vm`, with
`Vm ≈ 24.45 L/mol` only at 25 °C, 1 atm). Encoding a single factor would be misleading, so CO₂/VOC
stay in canonical ppm/ppb. If added later it must carry the gas + reference conditions explicitly in
the UI. See the header comment in `conversions.ts`.

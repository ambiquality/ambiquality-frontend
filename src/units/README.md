# `src/units/` — display-unit preference + conversion (Phase 8 / PER)

Logged-in users can choose preferred display units (e.g. °C/°F, ppm/mg·m⁻³). Conversion
is **display-only** — never mutate fetched canonical values; the API and archives keep
canonical units. Conversion factors derive from `/v1/properties` `applicableUnit` (+ QUDT).

## Phase-3 seam (already in place)

The presentation primitive `src/components/UnitValue.tsx` formats a **canonical** value+unit
with locale-aware `Intl.NumberFormat` (cs comma / en dot decimal) and exposes a Phase-8 seam:

```tsx
<UnitValue value={canonicalValue} unit={canonicalUnit} displayUnit={preferredUnit} />
```

- `value` + `unit` — canonical, as returned by the API (never mutated).
- `displayUnit` — the user's preferred unit. **Currently a no-op** (Phase 3 does not convert).

**Phase 8 implements:** read the logged-in user's preferred unit, convert
`value` (canonical) → `displayUnit` via a QUDT factor table sourced from `/v1/properties`
`applicableUnit`, and render the converted number with `displayUnit`. Call sites written
against `UnitValue` today stay source-compatible.

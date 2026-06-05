# `src/units/` — display-unit preference + conversion (Phase 8 / PER)

Logged-in users can choose preferred display units (e.g. °C/°F, ppm/mg·m⁻³). Conversion
is **display-only** — never mutate fetched canonical values; the API and archives keep
canonical units. Conversion factors derive from `/v1/properties` `applicableUnit` (+ QUDT).

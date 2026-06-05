# `src/i18n/` — internationalization (Phase 3)

react-i18next setup with **cs + en** resources. Language is always switchable and the
preference is persisted in `localStorage` (POU requirement).

Terminology rule (KON): use the thesis glossary's single canonical term per concept
(budova/building, místnost/room, senzor/sensor, pozorování/observation, subjekt
zájmu/feature of interest, veličina/quantity, jednotka/unit) — no synonyms. Codelist
labels come from the backend SKOS `prefLabel`s (cs+en), not re-translated here.

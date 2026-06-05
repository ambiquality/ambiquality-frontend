# `src/i18n/` — internationalization (Phase 3)

react-i18next + i18next + browser language detector, with **cs + en** resources bundled
inline (small dictionary, no async backend). The language switch is always available
(`src/components/LanguageSwitch.tsx`) and the user's explicit choice is persisted in
`localStorage` under the key **`amq.lang`** (POU: preference persisted across sessions).
Default detection order: persisted choice → browser `navigator` → `htmlTag`, fallback `en`.

## Files

| File | Purpose |
| --- | --- |
| `config.ts` | `i18n.init(...)` (detector + react-i18next), `LANGUAGE_STORAGE_KEY`, fallback. Importing it runs init as a side effect. |
| `I18nProvider.tsx` | `I18nextProvider` wrapper; mounted in `src/main.tsx` (and `src/test/render.tsx`). |
| `resources/en.ts` | English bundle, `as const` (drives the typed key shape). |
| `resources/cs.ts` | Czech bundle, structurally locked to `en`'s keys (leaf values widened to `string`). |
| `resources/index.ts` | `SUPPORTED_LANGUAGES`, `NAMESPACES`, `resources`, `Language`. |
| `i18next.d.ts` | Type augmentation so `t('common:nav.map')` is type-checked. |
| `codelist-labels.ts` | **Runtime seam** for backend SKOS codelist labels (see below). |

## Namespace layout

Resources are organized by namespace (`defaultNS = common`):

| Namespace | Contents |
| --- | --- |
| `common` | UI chrome: app name, nav, language switch, color-mode, generic actions. |
| `glossary` | The thesis glossary's **single canonical term per concept** (KON, no synonyms): `building`, `room`, `sensor`, `observation`, `featureOfInterest`, `quantity`, `unit`, `measurement`. Czech counterparts live under the same keys. |
| `forms` | Uniform form strings: `required`, `requiredMarker` (`*`), `optional`, `validation.*`. Used by `FormField`. |
| `errors` | RFC 9457 problem `type` URN → localized message map (flat keys, e.g. `urn:ambiquality:auth:invalid-credentials`) plus `title` / `generic` / `fieldErrorsLabel`. Used by the `ProblemError` component. |

> **errors namespace + URN keys:** a problem `type` URN contains `:` and `.`, which i18next
> treats as namespace/key separators. The URN map is therefore stored as **flat top-level
> keys** in the `errors` namespace, and `ProblemError` looks them up with
> `{ ns: 'errors', nsSeparator: false, keySeparator: false }`.

## Codelist / enumeration labels — NOT translated here (pitfall #10)

Codelist labels (building types, sensor lifecycle states, ventilation kinds, room functions,
…) are **SKOS concepts** whose `prefLabel`s already exist in **cs + en on the backend**. They
are fetched at runtime from:

```
GET /v1/codelists/{scheme}    (Public.Api, SKOS, cs+en prefLabels)
```

They must **never** be re-translated in this frontend dictionary. The runtime seam lives in
**`src/i18n/codelist-labels.ts`**:

- `CodelistConcept` / `CodelistScheme` — the shape of a fetched scheme.
- `resolveCodelistLabel(scheme, code, language)` — pure resolver with cs↔en→`code` fallback.
- `useCodelistLabel(scheme)` — hook bound to the current UI language.

**For later phases:** add a `useCodelistScheme(scheme)` query (TanStack Query, cached) that
fetches `/v1/codelists/{scheme}` and feed its result into `useCodelistLabel`. UI written
against `useCodelistLabel` today keeps working unchanged once the fetch is wired.

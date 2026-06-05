import { useTranslation } from 'react-i18next';
import type { Language } from './resources';

/**
 * Runtime seam for **codelist / enumeration labels** (pitfall #10).
 *
 * Codelist labels (building types, sensor lifecycle states, ventilation kinds, …) are NOT
 * part of the frontend i18n dictionary. They are SKOS concepts whose `prefLabel`s exist in
 * cs + en on the backend and are fetched at runtime from:
 *
 *     GET /v1/codelists/{scheme}   (Public.Api, SKOS, cs+en labels)
 *
 * This module defines the *shape* of that data and a label-resolution hook so later phases
 * (catalog/admin) can fetch + cache schemes (via TanStack Query) and feed them in, while UI
 * code already written against `useCodelistLabel` keeps working unchanged.
 *
 * Phase-3 scope: types + a pure resolver + a hook that resolves the *current UI language*.
 * The actual fetch/cache (`useCodelistScheme(scheme)`) is deliberately left for the phase
 * that needs it — wire it to the resolver here; do not translate these strings in the bundle.
 */

/** A single SKOS concept from a codelist scheme, with multilingual prefLabels. */
export interface CodelistConcept {
  /** Stable code/notation, e.g. `office`, `decommissioned`. This is what the API persists. */
  code: string;
  /** SKOS `prefLabel`s keyed by language tag (at minimum `cs` and `en`). */
  prefLabel: Partial<Record<Language, string>>;
}

/** A fetched scheme: `{ [code]: concept }`. Populate from `/v1/codelists/{scheme}`. */
export type CodelistScheme = Record<string, CodelistConcept>;

/**
 * Pure resolver: pick the `prefLabel` for `language`, falling back to the other language and
 * finally to the raw `code` (so the UI never renders blank for an unmapped/loading code).
 */
export function resolveCodelistLabel(
  scheme: CodelistScheme | undefined,
  code: string | null | undefined,
  language: Language,
): string {
  if (!code) return '';
  const concept = scheme?.[code];
  if (!concept) return code;
  return concept.prefLabel[language] ?? concept.prefLabel.en ?? concept.prefLabel.cs ?? code;
}

/**
 * Hook returning a resolver bound to the **current UI language**. Pass the already-fetched
 * scheme (later phases supply it from a cached query); resolution itself stays synchronous.
 *
 * @example
 *   const label = useCodelistLabel(buildingTypeScheme);
 *   <span>{label(building.buildingTypeCode)}</span>
 */
export function useCodelistLabel(scheme: CodelistScheme | undefined) {
  const { i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? i18n.language) as Language;
  return (code: string | null | undefined) => resolveCodelistLabel(scheme, code, language);
}

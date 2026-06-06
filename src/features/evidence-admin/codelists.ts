import { useMemo } from 'react';
import { useCodelistScheme, usePublicProperties } from '@/api/public/hooks';
import { useCodelistLabel } from '@/i18n/codelist-labels';
import type { SelectOption } from './components';

/**
 * DRY adapters that turn Public.Api reference vocabularies into `SelectField`-ready options +
 * a localized label resolver, so the evidence-admin forms (building/room/sensor) pick valid
 * codes instead of typing raw strings. Fetching these open codelists on the operator side does
 * NOT violate the "two read sources" rule — controlled vocabularies have a single public home
 * (see {@link useCodelistScheme}).
 */

export interface CodelistOptions {
  /** `{ value: code, label: localizedPrefLabel }`, sorted by the localized label. */
  options: SelectOption[];
  /** Resolve a code to its current-language label (falls back to the raw code). */
  label: (code: string) => string;
  /** True while the underlying query is in flight (disable the control + show a placeholder). */
  isLoading: boolean;
}

/**
 * Options + label resolver for a SKOS codelist scheme (`building-type`, `room-function`,
 * `exposure`, `ventilation-type`, `pollution-source`, `sensor-status`). Mirrors the inline
 * wiring originally written in `BuildingNewPage`.
 */
export function useCodelistOptions(scheme: string): CodelistOptions {
  const query = useCodelistScheme(scheme);
  const label = useCodelistLabel(query.data);
  const options = useMemo(
    () =>
      Object.keys(query.data ?? {})
        .map((code) => ({ value: code, label: label(code) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [query.data, label],
  );
  return { options, label, isLoading: query.isLoading };
}

/**
 * Options + label resolver for the observable-properties catalogue (`/v1/properties`). Unlike
 * SKOS codelists these carry an English-only `label`, so the resolver just maps code → label
 * (falling back to the code). Used for a sensor's measured-quantities collection.
 */
export function usePropertyOptions(): CodelistOptions {
  const query = usePublicProperties();
  const byCode = useMemo(() => {
    const map: Record<string, string> = {};
    for (const property of query.data ?? []) {
      map[property.code] = property.label || property.code;
    }
    return map;
  }, [query.data]);
  const label = (code: string) => byCode[code] ?? code;
  const options = useMemo(
    () =>
      Object.entries(byCode)
        .map(([value, lbl]) => ({ value, label: lbl }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [byCode],
  );
  return { options, label, isLoading: query.isLoading };
}

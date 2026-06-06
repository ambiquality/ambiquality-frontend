import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SelectOption } from './components';

/**
 * Coordinate-precision levels — the fixed backend `AnonymizationLevel` enum (NOT a SKOS codelist,
 * so labels live in the frontend dictionary). Non-owners only ever see coordinates coarsened to
 * the chosen level; see `anonymizationLevels.*` / `fields.anonymizationLevelHint` in i18n.
 */
export const ANONYMIZATION_LEVELS = ['precise', 'street', 'municipality'] as const;

export type AnonymizationLevel = (typeof ANONYMIZATION_LEVELS)[number];

/**
 * `SelectField`-ready, localized options for the coordinate-precision dropdown. Shared by the
 * building registration (F05) and temporal-edit (F07) forms so both offer the identical, valid
 * choice set instead of free-typing an enum value.
 */
export function useAnonymizationOptions(): SelectOption[] {
  const { t } = useTranslation('evidence');
  return useMemo(
    () => ANONYMIZATION_LEVELS.map((value) => ({ value, label: t(`anonymizationLevels.${value}`) })),
    [t],
  );
}

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SelectOption } from './components';

/**
 * Czech house-number type — the fixed backend enum carried by the OFN Adresy address model
 * (NOT a SKOS codelist, so its labels live in the frontend dictionary). `č.p.` is *číslo
 * popisné* (a permanent building number), `č.ev.` is *číslo evidenční* (a temporary/registry
 * number for structures without a č.p.). Exactly one applies to a building; the registrar picks
 * it on the registration (F05) and address-edit (F07) forms instead of free-typing the value,
 * and Evidence.Api rejects anything outside this set with `400`.
 */
export const HOUSE_NUMBER_TYPES = ['č.p.', 'č.ev.'] as const;

export type HouseNumberType = (typeof HOUSE_NUMBER_TYPES)[number];

/** i18n key suffix per value (dotted enum values can't be i18n keys themselves). */
const LABEL_SUFFIX: Record<HouseNumberType, 'cp' | 'cev'> = {
  'č.p.': 'cp',
  'č.ev.': 'cev',
};

/** `SelectField`-ready, localized options for the house-number-type dropdown (shared F05/F07). */
export function useHouseNumberTypeOptions(): SelectOption[] {
  const { t } = useTranslation('evidence');
  return useMemo(
    () =>
      HOUSE_NUMBER_TYPES.map((value) => ({
        value,
        label: t(`houseNumberTypes.${LABEL_SUFFIX[value]}`),
      })),
    [t],
  );
}

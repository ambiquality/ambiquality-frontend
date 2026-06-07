import { useContext } from 'react';
import { UnitPreferenceContext, type UnitPreferenceContextValue } from './unit-preference-context';

/** Access the user's display-unit preferences. Safe without a provider (reports canonical units). */
export function useUnitPreference(): UnitPreferenceContextValue {
  return useContext(UnitPreferenceContext);
}

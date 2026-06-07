import { createContext } from 'react';

/** localStorage key the per-canonical-unit display preferences persist under (POU: across sessions). */
export const UNIT_PREFERENCE_STORAGE_KEY = 'amq.unit-prefs';

export interface UnitPreferenceContextValue {
  /** The chosen display unit for a canonical unit, or the canonical unit itself when unset/invalid. */
  displayUnitFor: (canonicalUnit: string) => string;
  /** Persist a display-unit choice for a canonical unit (pass the canonical unit to reset to default). */
  setDisplayUnit: (canonicalUnit: string, displayUnit: string) => void;
}

/**
 * Default value lets `UnitValue` (and anything else) work even when no provider is mounted — it
 * simply reports the canonical unit and ignores writes, so canonical values render unconverted.
 */
export const defaultUnitPreference: UnitPreferenceContextValue = {
  displayUnitFor: (canonicalUnit) => canonicalUnit,
  setDisplayUnit: () => {},
};

export const UnitPreferenceContext =
  createContext<UnitPreferenceContextValue>(defaultUnitPreference);

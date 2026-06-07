import { useCallback, useMemo, useState, type PropsWithChildren } from 'react';
import { displayUnitOptions } from './conversions';
import {
  UnitPreferenceContext,
  UNIT_PREFERENCE_STORAGE_KEY,
  type UnitPreferenceContextValue,
} from './unit-preference-context';

/** Map of canonical unit symbol → chosen display unit symbol (e.g. `{ "°C": "°F" }`). */
type UnitPreferences = Record<string, string>;

function readPersisted(): UnitPreferences {
  try {
    const raw = globalThis.localStorage?.getItem(UNIT_PREFERENCE_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    // Keep only string→string entries (defensive against tampered/old storage).
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        ([, v]) => typeof v === 'string',
      ) as Array<[string, string]>,
    );
  } catch {
    return {};
  }
}

function persist(prefs: UnitPreferences): void {
  try {
    globalThis.localStorage?.setItem(UNIT_PREFERENCE_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage may be unavailable/full; preferences just won't survive a reload.
  }
}

/**
 * Holds the user's display-unit preferences (display-only PER), persisted to `localStorage` like the
 * language choice. A stored unit is honoured only while it's still a valid display option for that
 * canonical unit (guards against stale/tampered storage), otherwise the canonical unit is reported.
 */
export function UnitPreferenceProvider({ children }: PropsWithChildren) {
  const [prefs, setPrefs] = useState<UnitPreferences>(readPersisted);

  const displayUnitFor = useCallback(
    (canonicalUnit: string): string => {
      const chosen = prefs[canonicalUnit];
      if (chosen && displayUnitOptions(canonicalUnit).includes(chosen)) return chosen;
      return canonicalUnit;
    },
    [prefs],
  );

  const setDisplayUnit = useCallback((canonicalUnit: string, displayUnit: string): void => {
    setPrefs((prev) => {
      const next = { ...prev };
      // Choosing the canonical unit clears the override; otherwise store the alternative.
      if (displayUnit === canonicalUnit) delete next[canonicalUnit];
      else next[canonicalUnit] = displayUnit;
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo<UnitPreferenceContextValue>(
    () => ({ displayUnitFor, setDisplayUnit }),
    [displayUnitFor, setDisplayUnit],
  );

  return <UnitPreferenceContext.Provider value={value}>{children}</UnitPreferenceContext.Provider>;
}

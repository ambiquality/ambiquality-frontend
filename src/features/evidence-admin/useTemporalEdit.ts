/**
 * The shared state machine behind every per-attribute temporal edit form (F07).
 *
 * Each attribute form holds its own value field(s) plus a `validFrom`. On submit it:
 *   1. converts the `datetime-local` value to an ISO instant,
 *   2. fires the attribute's `PUT` mutation (carrying `validFrom`),
 *   3. on `204` → marks the form "saved" and runs an optional reset,
 *   4. on `ProblemError` → routes `409 overlapping-validity-range` to a `validFrom`-field error
 *      (the offending field), and any other problem to a general `ProblemError` banner.
 *
 * This keeps the 409 handling and the validFrom plumbing in ONE place so every attribute form
 * (building name/address/type/location/years, room name/floor/…, sensor identity/status/…)
 * behaves identically.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ProblemError } from '@/api/middleware/problem-details';
import { datetimeLocalToIso, isoToDatetimeLocal, nowIso } from './validation';

/** The stable URN the server returns when a `validFrom` overlaps an existing version. */
export const OVERLAP_URN = 'urn:ambiquality:evidence:overlapping-validity-range';

/**
 * Generic domain-rule fallback (400). On a per-attribute PUT this is what the server returns
 * when the chosen `validFrom` is not strictly after the current version's start (the app layer
 * enforces forward monotonicity *before* the DB-level overlap constraint can fire, so the 409
 * overlap is effectively unreachable on this path). We only treat it as a `validFrom` problem
 * when the server `detail` is actually about valid-from — other domain violations on the same
 * endpoint (e.g. year ordering) still surface in the general banner.
 */
export const DOMAIN_RULE_URN = 'urn:ambiquality:evidence:domain-rule-violation';
const VALID_FROM_DETAIL = /valid[\s-]?from/i;

export interface UseTemporalEditResult {
  /** Controlled `datetime-local` value for the `validFrom` control. */
  validFrom: string;
  setValidFrom: (value: string) => void;
  /** Field-level error to render on the `validFrom` control (the 409 lands here). */
  validFromError: string | null;
  /** General problem banner (non-409 problems). */
  problem: ProblemError | null;
  /** True between submit start and resolution. */
  submitting: boolean;
  /** True after a successful 204. */
  saved: boolean;
  /**
   * Submit handler. `buildBody(validFromIso)` produces the attribute-specific request body
   * (the caller folds its own value field(s) + the resolved ISO `validFrom` into it), and
   * `mutate` performs the PUT (rejecting with a `ProblemError` on failure).
   */
  submit: (
    buildBody: (validFromIso: string) => unknown,
    mutate: (body: never) => Promise<unknown>,
    onSaved?: () => void,
  ) => Promise<void>;
}

export function useTemporalEdit(initialValidFromIso?: string): UseTemporalEditResult {
  const { t } = useTranslation('evidence');
  const [validFrom, setValidFromState] = useState(
    isoToDatetimeLocal(initialValidFromIso ?? nowIso()),
  );
  const [validFromError, setValidFromError] = useState<string | null>(null);
  const [problem, setProblem] = useState<ProblemError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const setValidFrom = useCallback((value: string) => {
    setValidFromState(value);
    setValidFromError(null);
    setSaved(false);
  }, []);

  const submit = useCallback<UseTemporalEditResult['submit']>(
    async (buildBody, mutate, onSaved) => {
      setProblem(null);
      setValidFromError(null);
      setSaved(false);

      const iso = datetimeLocalToIso(validFrom);
      if (!iso) {
        setValidFromError(t('validFrom.label'));
        return;
      }

      setSubmitting(true);
      try {
        await mutate(buildBody(iso) as never);
        setSaved(true);
        onSaved?.();
      } catch (error) {
        if (error instanceof ProblemError && error.problem.type === OVERLAP_URN) {
          // Surface the overlap on the offending field (the validFrom date).
          setValidFromError(
            t('urn:ambiquality:evidence:overlapping-validity-range', {
              ns: 'errors',
              nsSeparator: false,
              keySeparator: false,
            }),
          );
        } else if (
          error instanceof ProblemError &&
          error.problem.type === DOMAIN_RULE_URN &&
          VALID_FROM_DETAIL.test(error.problem.detail ?? '')
        ) {
          // The real-world "validFrom too early" case: the app layer rejects a non-forward
          // validFrom with a 400 domain-rule-violation (not the DB-level 409 overlap). Route it
          // to the validFrom field with a clear, localized message.
          setValidFromError(t('validFrom.tooEarly'));
        } else if (error instanceof ProblemError) {
          setProblem(error);
        } else {
          throw error;
        }
      } finally {
        setSubmitting(false);
      }
    },
    [validFrom, t],
  );

  return {
    validFrom,
    setValidFrom,
    validFromError,
    problem,
    submitting,
    saved,
    submit,
  };
}

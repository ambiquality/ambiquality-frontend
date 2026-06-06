/**
 * Pure, synchronous field validators for the evidence-admin forms — mirrors the account
 * feature's `validation.ts` contract (return an already-localized error MESSAGE or `null`,
 * validate on blur). These are lenient client-side checks; Evidence.Api is authoritative
 * (it owns codelist validity, overlapping-validity-range, etc.).
 */

import type { FieldValidator } from '@/components';

/** Required (non-blank) string. */
export function requiredValidator(message: string): FieldValidator {
  return (value) => (value.trim() === '' ? message : null);
}

/** Optional integer within an inclusive range; blank is allowed (returns valid). */
export function optionalIntInRange(
  min: number,
  max: number,
  messages: { invalid: string; range: string },
): FieldValidator {
  return (value) => {
    const v = value.trim();
    if (v === '') return null;
    if (!/^-?\d+$/.test(v)) return messages.invalid;
    const n = Number(v);
    if (n < min || n > max) return messages.range;
    return null;
  };
}

/** Optional finite number (decimals allowed); blank is allowed. */
export function optionalNumber(message: string): FieldValidator {
  return (value) => {
    const v = value.trim();
    if (v === '') return null;
    return Number.isFinite(Number(v)) ? null : message;
  };
}

/** Required finite number. */
export function requiredNumber(messages: { required: string; invalid: string }): FieldValidator {
  return (value) => {
    const v = value.trim();
    if (v === '') return messages.required;
    return Number.isFinite(Number(v)) ? null : messages.invalid;
  };
}

/**
 * A current-instant ISO timestamp suitable as a default `validFrom`. The temporal edit forms
 * default `validFrom` to "now" (the common case: the change takes effect immediately); the
 * operator can override it to schedule/backdate. Kept as a function (not a constant) so each
 * form opens with a fresh value.
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Coerce a `datetime-local` input value (`YYYY-MM-DDTHH:mm`, local time, no zone) into a full
 * ISO-8601 instant the API accepts. Returns `null` for an unparseable/blank value.
 */
export function datetimeLocalToIso(value: string): string | null {
  const v = value.trim();
  if (v === '') return null;
  const ms = Date.parse(v);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

/**
 * Format an ISO instant back into the `datetime-local` control value (`YYYY-MM-DDTHH:mm`) in
 * the browser's local time. Returns `''` for blank/invalid input.
 */
export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

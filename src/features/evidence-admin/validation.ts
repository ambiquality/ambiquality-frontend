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

/**
 * Optional finite **decimal** within an inclusive `[min, max]` range; blank is allowed. Used for
 * latitude (−90…90) and longitude (−180…180), where the value is a decimal degree, not an integer
 * (cf. {@link optionalIntInRange}). Lenient client check — Evidence.Api stays authoritative.
 */
export function optionalNumberInRange(
  min: number,
  max: number,
  messages: { invalid: string; range: string },
): FieldValidator {
  return (value) => {
    const v = value.trim();
    if (v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return messages.invalid;
    if (n < min || n > max) return messages.range;
    return null;
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
 * Required positive integer (`> 0`). Used by the OFN address fields the backend requires to be
 * positive — the RÚIAN address-point code (kód adresního místa) and the house number. Lenient
 * client check; Evidence.Api stays authoritative (a non-existent code is rejected server-side).
 */
export function requiredPositiveInt(messages: {
  required: string;
  invalid: string;
}): FieldValidator {
  return (value) => {
    const v = value.trim();
    if (v === '') return messages.required;
    if (!/^\d+$/.test(v) || Number(v) <= 0) return messages.invalid;
    return null;
  };
}

/**
 * Optional positive finite number (`> 0`, decimals allowed); blank is allowed. Used for the
 * F08 installation distances, which the backend rejects when non-positive.
 */
export function optionalPositiveNumber(message: string): FieldValidator {
  return (value) => {
    const v = value.trim();
    if (v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? null : message;
  };
}

/** Optional positive integer (`> 0`); blank is allowed (e.g. číslo orientační). */
export function optionalPositiveInt(message: string): FieldValidator {
  return (value) => {
    const v = value.trim();
    if (v === '') return null;
    return /^\d+$/.test(v) && Number(v) > 0 ? null : message;
  };
}

/**
 * Required Czech PSČ — five digits, an optional single space accepted (`130 67`). Mirrors the
 * backend's structural check (space stripped before validation); CUZK existence is not verified.
 */
export function pscValidator(messages: { required: string; invalid: string }): FieldValidator {
  return (value) => {
    const v = value.trim();
    if (v === '') return messages.required;
    return /^\d{3}\s?\d{2}$/.test(v) ? null : messages.invalid;
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

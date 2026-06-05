/**
 * Small, pure, synchronous field validators for the account forms. They return a localized
 * error MESSAGE (already translated by the caller) or `null` when valid, matching
 * `FormField`'s `FieldValidator` contract (KON: validate on blur).
 *
 * These are intentionally lenient client-side checks — the backend is authoritative (it owns
 * the real password policy and email uniqueness). Their job is fast feedback, not enforcement.
 */
import type { FieldValidator } from '@/components';

/** A loose email shape check: non-empty, single `@`, a dot in the domain. */
export function isEmailish(value: string): boolean {
  const v = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Required + email-shaped. `messages` carries the already-localized strings. */
export function emailValidator(messages: { required: string; invalid: string }): FieldValidator {
  return (value) => {
    if (value.trim() === '') return messages.required;
    if (!isEmailish(value)) return messages.invalid;
    return null;
  };
}

/** Required + a minimum length (8, a sane lower bound; the backend owns the real policy). */
export function passwordValidator(messages: {
  required: string;
  tooShort: string;
}): FieldValidator {
  return (value) => {
    if (value === '') return messages.required;
    if (value.length < 8) return messages.tooShort;
    return null;
  };
}

/** Required only (for current-password / confirm fields validated against another value). */
export function requiredValidator(message: string): FieldValidator {
  return (value) => (value.trim() === '' ? message : null);
}

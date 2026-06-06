import { describe, expect, it } from 'vitest';
import {
  requiredValidator,
  optionalIntInRange,
  optionalNumber,
  requiredNumber,
  datetimeLocalToIso,
  isoToDatetimeLocal,
} from './validation';

describe('evidence-admin validation', () => {
  it('requiredValidator rejects blank, accepts non-blank', () => {
    const v = requiredValidator('req');
    expect(v('')).toBe('req');
    expect(v('   ')).toBe('req');
    expect(v('x')).toBeNull();
  });

  it('optionalIntInRange allows blank, rejects non-integers and out-of-range', () => {
    const v = optionalIntInRange(1800, 2100, { invalid: 'inv', range: 'rng' });
    expect(v('')).toBeNull();
    expect(v('1.5')).toBe('inv');
    expect(v('abc')).toBe('inv');
    expect(v('1700')).toBe('rng');
    expect(v('2200')).toBe('rng');
    expect(v('1990')).toBeNull();
  });

  it('optionalNumber allows blank, rejects NaN, accepts decimals', () => {
    const v = optionalNumber('inv');
    expect(v('')).toBeNull();
    expect(v('12.5')).toBeNull();
    expect(v('-3')).toBeNull();
    expect(v('nope')).toBe('inv');
  });

  it('requiredNumber rejects blank and NaN', () => {
    const v = requiredNumber({ required: 'req', invalid: 'inv' });
    expect(v('')).toBe('req');
    expect(v('x')).toBe('inv');
    expect(v('2')).toBeNull();
  });

  it('round-trips datetime-local <-> ISO', () => {
    const iso = datetimeLocalToIso('2026-06-06T10:30');
    expect(iso).not.toBeNull();
    // The local control value reconstructed from that ISO must match the original input.
    expect(isoToDatetimeLocal(iso)).toBe('2026-06-06T10:30');
  });

  it('datetimeLocalToIso returns null for blank/invalid', () => {
    expect(datetimeLocalToIso('')).toBeNull();
    expect(datetimeLocalToIso('not-a-date')).toBeNull();
  });

  it('isoToDatetimeLocal returns empty for blank/invalid', () => {
    expect(isoToDatetimeLocal(null)).toBe('');
    expect(isoToDatetimeLocal('garbage')).toBe('');
  });
});

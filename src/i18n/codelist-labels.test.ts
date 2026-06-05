import { describe, expect, it } from 'vitest';
import { resolveCodelistLabel, type CodelistScheme } from './codelist-labels';

const scheme: CodelistScheme = {
  office: { code: 'office', prefLabel: { cs: 'kancelář', en: 'office' } },
  classroom: { code: 'classroom', prefLabel: { cs: 'učebna' } }, // en missing on purpose
};

describe('resolveCodelistLabel (codelist runtime seam, pitfall #10)', () => {
  it('returns the prefLabel for the requested language', () => {
    expect(resolveCodelistLabel(scheme, 'office', 'cs')).toBe('kancelář');
    expect(resolveCodelistLabel(scheme, 'office', 'en')).toBe('office');
  });

  it('falls back to the other language when the requested one is missing', () => {
    expect(resolveCodelistLabel(scheme, 'classroom', 'en')).toBe('učebna');
  });

  it('falls back to the raw code for unknown codes or an unloaded scheme', () => {
    expect(resolveCodelistLabel(scheme, 'unknown', 'cs')).toBe('unknown');
    expect(resolveCodelistLabel(undefined, 'office', 'cs')).toBe('office');
  });

  it('returns an empty string for nullish codes', () => {
    expect(resolveCodelistLabel(scheme, null, 'cs')).toBe('');
    expect(resolveCodelistLabel(scheme, undefined, 'en')).toBe('');
  });
});

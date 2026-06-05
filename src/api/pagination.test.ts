import { describe, expect, it } from 'vitest';
import { cursorFromNextLink } from './pagination';

describe('cursorFromNextLink', () => {
  it('extracts the opaque cursor from an absolute next link', () => {
    expect(cursorFromNextLink('https://api.test/v1/observations?limit=50&cursor=opaque-abc')).toBe(
      'opaque-abc',
    );
  });

  it('extracts the cursor from a relative next link', () => {
    expect(cursorFromNextLink('/v1/observations?cursor=xyz')).toBe('xyz');
  });

  it('returns null when there is no next link or no cursor', () => {
    expect(cursorFromNextLink(null)).toBeNull();
    expect(cursorFromNextLink(undefined)).toBeNull();
    expect(cursorFromNextLink('/v1/observations?limit=50')).toBeNull();
  });
});

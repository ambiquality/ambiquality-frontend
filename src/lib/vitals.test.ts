import { describe, expect, it } from 'vitest';
import { deriveRouteBucket } from './vitals';

describe('deriveRouteBucket', () => {
  it('maps the index route to the map bucket', () => {
    expect(deriveRouteBucket('/')).toBe('map');
    expect(deriveRouteBucket('')).toBe('map');
  });

  it('maps browse/catalog to the catalog bucket', () => {
    expect(deriveRouteBucket('/browse')).toBe('catalog');
    expect(deriveRouteBucket('/browse?page=2')).toBe('catalog');
    expect(deriveRouteBucket('/catalog')).toBe('catalog');
  });

  it('maps public entity detail routes to the detail bucket', () => {
    expect(deriveRouteBucket('/buildings/bld-123')).toBe('detail');
    expect(deriveRouteBucket('/rooms/rm-45')).toBe('detail');
    expect(deriveRouteBucket('/sensors/sns-9')).toBe('detail');
  });

  it('maps archive, account and operator routes', () => {
    expect(deriveRouteBucket('/archive')).toBe('archive');
    expect(deriveRouteBucket('/login')).toBe('account');
    expect(deriveRouteBucket('/register')).toBe('account');
    expect(deriveRouteBucket('/confirm-email')).toBe('account');
    expect(deriveRouteBucket('/confirm-email-change')).toBe('account');
    expect(deriveRouteBucket('/operator')).toBe('admin');
    expect(deriveRouteBucket('/operator/buildings/abc123/edit')).toBe('admin');
  });

  it('falls back to other for unknown top-level segments', () => {
    expect(deriveRouteBucket('/about')).toBe('other');
    expect(deriveRouteBucket('/privacy')).toBe('other');
    expect(deriveRouteBucket('/no-such-page')).toBe('other');
  });
});

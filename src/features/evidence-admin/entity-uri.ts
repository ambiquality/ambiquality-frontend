/** The visitor-side route segment for each catalog entity kind. */
export type PublicEntitySegment = 'buildings' | 'rooms' | 'sensors';

/**
 * The shareable, absolute public URL for an entity, addressed by its stable `uriSlug`
 * (`bld-…` / `rm-…` / `sns-…`). These point at the visitor-side detail routes
 * (`/buildings/:slug`, `/rooms/:slug`, `/sensors/:slug`) — the canonical, stable URLs — so an
 * operator can copy a link straight from the admin card. Falls back to a root-relative path when
 * there is no `window` (SSR/tests without an origin).
 */
export function publicEntityUri(segment: PublicEntitySegment, slug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/${segment}/${slug}`;
}

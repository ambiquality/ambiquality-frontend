/**
 * Pagination shapes — pitfall #6.
 *
 * Public.Api uses TWO pagination styles and the query layer must express both:
 *  - **Keyset / cursor** (`/v1/observations`): an opaque `cursor` + `limit`; the response
 *    carries a `next` link (or opaque cursor) to fetch the following page. Append-only,
 *    unbounded feed → stable, gap-free pages.
 *  - **Offset / page** (catalog lists like `/v1/buildings`): `page` + `pageSize` with a total
 *    count; small bounded collections where a page index is friendlier.
 *
 * These types are the vocabulary the feature query hooks (this and later phases) build on.
 * They are deliberately transport-agnostic: the actual response bodies are untyped in the
 * Public.Api spec, so hooks supply their own item types via the generics below.
 */

/** Offset/page request params for bounded catalog lists. */
export interface OffsetPageParams {
  page?: number;
  pageSize?: number;
}

/** A page of offset-paginated results plus the total count for page-index UIs. */
export interface OffsetPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Keyset/cursor request params for the unbounded observations feed. */
export interface CursorPageParams {
  /** Opaque cursor from a previous page's `next`; omit for the first page. */
  cursor?: string;
  limit?: number;
}

/**
 * A page of cursor-paginated results. `nextCursor` is the opaque cursor to pass back as
 * {@link CursorPageParams.cursor} for the next page, or `null` when the feed is exhausted.
 */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

/** Default page size for catalog lists (backend default is 50, max 200). */
export const DEFAULT_PAGE_SIZE = 50;
/** Hard cap the backend enforces on `pageSize` / `limit`. */
export const MAX_PAGE_SIZE = 200;

/**
 * Extract an opaque cursor from a `next` link/URL. The observations feed returns a `next`
 * hyperlink whose `cursor` query param is the opaque token; this pulls it out so cursor state
 * stays a plain string the query layer can pass around. Returns `null` for missing/invalid input.
 */
export function cursorFromNextLink(next: string | null | undefined): string | null {
  if (!next) return null;
  try {
    // `next` may be absolute or relative; a base only matters for parsing.
    const url = new URL(next, 'http://_');
    return url.searchParams.get('cursor');
  } catch {
    return null;
  }
}

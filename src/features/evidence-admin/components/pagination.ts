/** Default rows per page for the client-side paginated lists (rooms, sensors). */
export const PAGE_SIZE = 10;

/** Slice `items` to the given 1-based `page`. Pure — used by the list sections. */
export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** Total page count for `total` items (at least 1, so an empty list still reads "Page 1 of 1"). */
export function pageCountOf(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

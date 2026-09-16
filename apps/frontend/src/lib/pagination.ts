/**
 * Shared page-by-page list pagination. Every list page fetches `pageSize + 1` rows starting
 * at `(page - 1) * pageSize` — one extra row is enough to know whether a next page exists,
 * without a separate count query (ERPNext's `frappe.client.get_count` would be a second
 * round trip per page load, which the FRONTEND_GUIDE.md performance rules say to avoid).
 *
 * Row count is user-selectable (matches ERPNext Desk's 20/100/500/2500 chips), carried in
 * the `page_size` query param — deliberately still page-by-page (Prev/Next), not an
 * accumulating "Load More": an unbounded append-more-rows button would quietly recreate the
 * original "render everything, scroll forever" problem this pagination work replaced.
 */
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [20, 100, 500, 2500] as const;

export function parsePage(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function parsePageSize(value: string | undefined): number {
  const n = Number(value);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

export function paginate<T>(rowsPlusOne: T[], pageSize: number = DEFAULT_PAGE_SIZE): { rows: T[]; hasNextPage: boolean } {
  const hasNextPage = rowsPlusOne.length > pageSize;
  return { rows: hasNextPage ? rowsPlusOne.slice(0, pageSize) : rowsPlusOne, hasNextPage };
}

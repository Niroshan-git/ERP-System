import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination";

/**
 * Row-count chips (20/100/500/2500, matching ERPNext Desk's own list view) + Prev/Next
 * pager for list pages. Matches ListFilterBar's plain-link/GET-form pattern (no client JS
 * needed) — every control navigates to the same URL with `page`/`page_size` swapped,
 * preserving every other filter/sort query param already on it. Changing the row count
 * always resets back to page 1.
 */
function buildHref(
  searchParams: Record<string, string | undefined>,
  overrides: { page?: number; pageSize?: number },
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || key === "page_size" || !value) continue;
    params.set(key, value);
  }
  const page = overrides.page ?? 1;
  if (page > 1) params.set("page", String(page));
  if (overrides.pageSize && overrides.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("page_size", String(overrides.pageSize));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

export function PaginationControls({
  page,
  pageSize,
  hasNextPage,
  searchParams,
  rowCount,
  totalCount,
}: {
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  searchParams: Record<string, string | undefined>;
  /** Rows actually rendered on this page (`paginate()`'s `rows.length`) — the last page is
   * usually shorter than `pageSize`, so this (not `pageSize`) is what the range end uses. */
  rowCount: number;
  /** Total matching rows across every page, from `getCount()`. Optional — pages that skip
   * the count request (or hit an error fetching it) just fall back to "Page N". */
  totalCount?: number;
}) {
  const linkClass =
    "rounded-md border border-border px-3 py-1.5 text-sm font-medium text-graphite-900 hover:bg-surface";
  const disabledClass = "rounded-md border border-border px-3 py-1.5 text-sm font-medium text-graphite-300";
  const chipBase = "rounded-full border px-2.5 py-1 text-xs font-medium";

  const startIndex = (page - 1) * pageSize;
  const rangeLabel =
    totalCount !== undefined
      ? rowCount > 0
        ? `Showing ${startIndex + 1}–${startIndex + rowCount} of ${totalCount}`
        : totalCount > 0
          ? `${totalCount} total`
          : "No records"
      : `Page ${page}`;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="mr-0.5 text-xs text-graphite-500">Rows</span>
        {PAGE_SIZE_OPTIONS.map((size) => {
          const active = size === pageSize;
          return (
            <a
              key={size}
              href={buildHref(searchParams, { pageSize: size })}
              aria-current={active ? "true" : undefined}
              className={
                active
                  ? `${chipBase} border-signal bg-signal text-white`
                  : `${chipBase} border-border text-graphite-500 hover:bg-surface`
              }
            >
              {size}
            </a>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-graphite-500">{rangeLabel}</span>
        {page > 1 ? (
          <a href={buildHref(searchParams, { page: page - 1, pageSize })} className={linkClass}>
            ← Previous
          </a>
        ) : (
          <span className={disabledClass}>← Previous</span>
        )}
        {hasNextPage ? (
          <a href={buildHref(searchParams, { page: page + 1, pageSize })} className={linkClass}>
            Next →
          </a>
        ) : (
          <span className={disabledClass}>Next →</span>
        )}
      </div>
    </div>
  );
}

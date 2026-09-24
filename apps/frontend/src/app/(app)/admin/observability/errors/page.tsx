import { Breadcrumb } from "@/components/Breadcrumb";
import { ErrorExplorerTable } from "@/components/ErrorExplorerTable";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { getObservabilityProvider } from "@/lib/observabilityCenter/provider";
import type { EventStatus, ObservabilityFilters, Severity } from "@/lib/observabilityCenter/types";

const SEVERITY_OPTIONS: Severity[] = ["INFO", "WARNING", "ERROR", "CRITICAL"];
const STATUS_OPTIONS: EventStatus[] = ["Open", "Investigating", "Resolved"];
const SORT_OPTIONS = [{ value: "recent", label: "Most recent" }];

type SearchParams = {
  search?: string;
  severity?: string;
  status?: string;
  user?: string;
  doctype?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  page_size?: string;
};

/**
 * Error Explorer (package O-7, converted to LIVE in O-10C) — the primary support-
 * investigation table, reading exclusively through `getObservabilityProvider()`, which as
 * of O-10C routes `getErrors()` to the real `ServerObservabilityProvider` (native `Error
 * Log`, scoped to Ceylon Stack's own correlated rows — see `serverProvider.ts`). See
 * `docs/observability-frontend-architecture.md`'s O-10C section for the full LIVE/DEMO
 * breakdown.
 *
 * **Module/Source filters removed in O-10C** (not disabled/hidden — removed): neither has
 * a native backend column, both are display-only derivations from `reference_doctype`/the
 * URL path at normalization time. Silently accepting them without server-side filtering
 * would make the field appear to filter while actually doing nothing — the exact
 * misleading behavior the O-10C mission's §6 forbids. `Module`/`Source` still render as
 * table columns; they're just not filterable yet. **Status filter kept** — real
 * `ErrorEvent.status` is honestly `"Open"` today (see `serverProvider.ts`), so selecting
 * Investigating/Resolved correctly (not silently) returns zero results rather than
 * ignoring the filter.
 *
 * Follows this app's established list-page convention (`ListFilterBar` + a table +
 * `PaginationControls`, GET-form/`searchParams`-driven, no client state) — see e.g.
 * `app/(app)/buying/purchase-orders/page.tsx` — rather than inventing a parallel pattern.
 */
export default async function ErrorExplorerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);

  const filters: ObservabilityFilters = {
    search: params.search || undefined,
    severity: isSeverity(params.severity) ? params.severity : undefined,
    status: isStatus(params.status) ? params.status : undefined,
    actorEmail: params.user || undefined,
    doctype: params.doctype || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
  };

  let result: Awaited<ReturnType<ReturnType<typeof getObservabilityProvider>["getErrors"]>> | null = null;
  let loadError = false;
  try {
    result = await getObservabilityProvider().getErrors(filters, page, pageSize);
  } catch {
    loadError = true;
  }

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "search", label: "Search" },
    { type: "select", name: "severity", label: "Severity", options: SEVERITY_OPTIONS },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
    { type: "text", name: "user", label: "User" },
    { type: "text", name: "doctype", label: "DocType" },
    { type: "date", name: "dateFrom", label: "From" },
    { type: "date", name: "dateTo", label: "To" },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin/observability" }, { label: "Observability", href: "/admin/observability" }, { label: "Errors" }]} />

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-graphite-900">Error Explorer</h1>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Live
          </span>
        </div>
        <p className="mt-1 text-sm text-graphite-500">
          Investigate application and ERPNext failures using trace references and operational context.
        </p>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      {loadError || !result ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-graphite-900">Observability data could not be loaded.</p>
          <p className="mt-1 text-sm text-graphite-500">Try again shortly.</p>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-graphite-500">
            {result.pagination.total} {result.pagination.total === 1 ? "result" : "results"}
          </p>
          <ErrorExplorerTable rows={result.items} />
          <PaginationControls
            page={page}
            pageSize={pageSize}
            hasNextPage={page * pageSize < result.pagination.total}
            searchParams={params}
            rowCount={result.items.length}
            totalCount={result.pagination.total}
          />
        </>
      )}
    </div>
  );
}

function isSeverity(value: string | undefined): value is Severity {
  return !!value && (SEVERITY_OPTIONS as string[]).includes(value);
}
function isStatus(value: string | undefined): value is EventStatus {
  return !!value && (STATUS_OPTIONS as string[]).includes(value);
}

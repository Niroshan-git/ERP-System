import { Breadcrumb } from "@/components/Breadcrumb";
import { ErrorExplorerTable } from "@/components/ErrorExplorerTable";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { getObservabilityProvider } from "@/lib/observabilityCenter/provider";
import type { EventSource, EventStatus, ObservabilityFilters, Severity } from "@/lib/observabilityCenter/types";

const SEVERITY_OPTIONS: Severity[] = ["INFO", "WARNING", "ERROR", "CRITICAL"];
const MODULE_OPTIONS = ["Manufacturing", "Sales", "Buying", "Stock", "Master Data", "System"];
const SOURCE_OPTIONS: EventSource[] = ["FRONTEND", "SERVER", "ERPNEXT", "INTEGRATION", "WORKFLOW", "SYSTEM"];
const STATUS_OPTIONS: EventStatus[] = ["Open", "Investigating", "Resolved"];
const SORT_OPTIONS = [{ value: "recent", label: "Most recent" }];

type SearchParams = {
  search?: string;
  severity?: string;
  module?: string;
  source?: string;
  status?: string;
  user?: string;
  doctype?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  page_size?: string;
};

/**
 * Error Explorer (package O-7) — the primary support-investigation table, reading
 * exclusively through `getObservabilityProvider()` (still the DEMO adapter; see
 * `docs/observability-frontend-architecture.md`). Authorization is inherited from
 * `app/(app)/admin/observability/layout.tsx` — this route needs no auth logic of its own.
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
    module: params.module || undefined,
    source: isSource(params.source) ? params.source : undefined,
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
    { type: "select", name: "module", label: "Module", options: MODULE_OPTIONS },
    { type: "select", name: "source", label: "Source", options: SOURCE_OPTIONS },
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
        <h1 className="text-xl font-semibold text-graphite-900">Error Explorer</h1>
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
function isSource(value: string | undefined): value is EventSource {
  return !!value && (SOURCE_OPTIONS as string[]).includes(value);
}
function isStatus(value: string | undefined): value is EventStatus {
  return !!value && (STATUS_OPTIONS as string[]).includes(value);
}

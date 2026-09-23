import { Breadcrumb } from "@/components/Breadcrumb";
import { AuditExplorerTable } from "@/components/AuditExplorerTable";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { getObservabilityProvider } from "@/lib/observabilityCenter/provider";
import type { ObservabilityFilters } from "@/lib/observabilityCenter/types";

const MODULE_OPTIONS = ["Manufacturing", "Sales", "Buying", "Stock", "Master Data", "System"];
/** Curated suggestions only, same rationale as Activity's `ACTION_OPTIONS` — `AuditRecord
 * .action` is free text, not a closed union. */
const ACTION_OPTIONS = ["Created", "Updated", "Submitted", "Cancelled", "Amended"];
const SORT_OPTIONS = [{ value: "recent", label: "Most recent" }];

type SearchParams = {
  search?: string;
  user?: string;
  module?: string;
  doctype?: string;
  document?: string;
  action?: string;
  trace?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  page_size?: string;
};

/**
 * Audit Trail (package O-8) — "what exactly changed?" Reads exclusively through
 * `getObservabilityProvider()` (still the DEMO adapter; see
 * `docs/observability-frontend-architecture.md`). Authorization is inherited from
 * `app/(app)/admin/observability/layout.tsx`.
 *
 * Modeled around native `Version` (mission §19) — this page never renders raw `Version`
 * JSON, only the already-transformed `AuditRecord.changes: AuditChange[]` shape
 * `AuditExplorerTable`/`AuditChangesList` present.
 *
 * **Document History mode** (mission §27): when both `doctype` and `document` are set —
 * the exact URL shape Activity's "View Audit" action and Trace Detail's "View Audit"
 * action both navigate to (`?doctype=Work%20Order&document=WO-00042`) — this becomes one
 * document's full change timeline, oldest-first, rather than the general newest-first
 * Audit Explorer. Same provider call, same `AuditExplorerTable`, just a different sort
 * order and heading; no second provider method needed since every field either
 * presentation needs already lives on `AuditRecord`.
 */
export default async function AuditTrailPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);

  const filters: ObservabilityFilters = {
    search: params.search || undefined,
    actorEmail: params.user || undefined,
    module: params.module || undefined,
    doctype: params.doctype || undefined,
    docname: params.document || undefined,
    action: params.action || undefined,
    correlationId: params.trace || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
  };

  const isDocumentHistory = Boolean(filters.doctype && filters.docname);

  let result: Awaited<ReturnType<ReturnType<typeof getObservabilityProvider>["getAuditRecords"]>> | null = null;
  let loadError = false;
  try {
    result = await getObservabilityProvider().getAuditRecords(filters, page, pageSize);
  } catch {
    loadError = true;
  }

  const rows = result ? (isDocumentHistory ? [...result.items].reverse() : result.items) : [];

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "search", label: "Search" },
    { type: "text", name: "user", label: "Actor" },
    { type: "select", name: "module", label: "Module", options: MODULE_OPTIONS },
    { type: "text", name: "doctype", label: "DocType" },
    { type: "text", name: "document", label: "Document" },
    { type: "select", name: "action", label: "Action", options: ACTION_OPTIONS },
    { type: "text", name: "trace", label: "Trace ID" },
    { type: "date", name: "dateFrom", label: "From" },
    { type: "date", name: "dateTo", label: "To" },
  ];

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Admin", href: "/admin/observability" },
          { label: "Observability", href: "/admin/observability" },
          { label: "Audit Trail" },
        ]}
      />

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-graphite-900">Audit Trail</h1>
          <span className="rounded-full bg-graphite-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-graphite-500">
            Demo data
          </span>
        </div>
        <p className="mt-1 text-sm text-graphite-500">
          Review document changes and identify who changed what and when.
        </p>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      {loadError || !result ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-graphite-900">Audit data could not be loaded.</p>
          <p className="mt-1 text-sm text-graphite-500">Try again shortly.</p>
        </div>
      ) : (
        <>
          {isDocumentHistory ? (
            <p className="mb-2 text-sm font-medium text-graphite-900">
              Document History — <span className="font-mono text-xs">{filters.docname}</span>{" "}
              <span className="font-normal text-graphite-500">({filters.doctype}, oldest first)</span>
            </p>
          ) : (
            <p className="mb-2 text-xs text-graphite-500">
              {result.pagination.total} {result.pagination.total === 1 ? "result" : "results"}
            </p>
          )}
          <AuditExplorerTable rows={rows} />
          <PaginationControls
            page={page}
            pageSize={pageSize}
            hasNextPage={page * pageSize < result.pagination.total}
            searchParams={params}
            rowCount={result.items.length}
            totalCount={result.pagination.total}
          />
          {isDocumentHistory && result.pagination.total > pageSize && (
            <p className="mt-1.5 text-xs text-graphite-500">
              This document has more history than fits on one page — oldest-first order applies within each page;
              use Rows/Next to see earlier entries.
            </p>
          )}
        </>
      )}
    </div>
  );
}

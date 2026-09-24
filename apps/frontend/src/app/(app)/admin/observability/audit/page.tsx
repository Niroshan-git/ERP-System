import { Breadcrumb } from "@/components/Breadcrumb";
import { AuditExplorerTable } from "@/components/AuditExplorerTable";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { getObservabilityProvider } from "@/lib/observabilityCenter/provider";
import type { ObservabilityFilters } from "@/lib/observabilityCenter/types";

const SORT_OPTIONS = [{ value: "recent", label: "Most recent" }];

type SearchParams = {
  doctype?: string;
  document?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  page_size?: string;
};

/**
 * Audit Trail (package O-8, converted to LIVE in O-10D) — "what exactly changed?" Reads
 * exclusively through `getObservabilityProvider()`, which as of O-10D routes
 * `getAuditRecords()` to the real `ServerObservabilityProvider` (native `Version` — see
 * `serverProvider.ts`). Authorization is inherited from
 * `app/(app)/admin/observability/layout.tsx`.
 *
 * Modeled around native `Version` (mission §19) — this page never renders raw `Version`
 * JSON, only the already-transformed `AuditRecord.changes: AuditChange[]` shape
 * `AuditExplorerTable`/`AuditChangesList` present.
 *
 * **Search/Actor/Module/Action/Trace filters removed in O-10D**: `list_audit` (the real
 * backing query, see `observability.py`) only accepts `reference_doctype`/`reference_name`/
 * `date_from`/`date_to` — there is no native full-text search over `Version`, `module`/
 * `action` are display-only derivations from `Version.data` (not native columns, and
 * filtering by them would mean fetching every row before paginating), and the actor join
 * (`_join_actors_for_document`) deliberately only runs once a single document is selected
 * (mission §37's N+1 guard), so actor is genuinely unpopulated outside Document History
 * mode — offering these as filters would silently do nothing against live data (mission
 * §24). DocType/Document/From/To are real native-column filters and stay.
 *
 * **Document History mode** (mission §27): when both `doctype` and `document` are set —
 * the exact URL shape Activity's "View Audit" action and Trace Detail's "View Audit"
 * action both navigate to (`?doctype=Work%20Order&document=WO-00042`) — this becomes one
 * document's full change timeline. `serverProvider.ts`'s `getAuditRecords()` requests a
 * real database-level `order: "asc"` from the backend for this mode (mission §23's "global
 * oldest-first, not a per-page reversal") — this page trusts that ordering as-is rather
 * than re-sorting the page it receives.
 */
export default async function AuditTrailPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);

  const filters: ObservabilityFilters = {
    doctype: params.doctype || undefined,
    docname: params.document || undefined,
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

  const rows = result ? result.items : [];

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "doctype", label: "DocType" },
    { type: "text", name: "document", label: "Document" },
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
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Live
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
              This document has more history than fits on one page — oldest-first order applies across the full
              history, not just this page; use Rows/Next to see later entries.
            </p>
          )}
        </>
      )}
    </div>
  );
}

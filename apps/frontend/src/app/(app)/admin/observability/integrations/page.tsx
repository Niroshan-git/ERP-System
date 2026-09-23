import { Activity, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { IntegrationExplorerTable } from "@/components/IntegrationExplorerTable";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { ObservabilityHealthCard } from "@/components/ObservabilityHealthCard";
import { PaginationControls } from "@/components/PaginationControls";
import { formatDuration } from "@/lib/observabilityCenter/format";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { getObservabilityProvider } from "@/lib/observabilityCenter/provider";
import type { IntegrationStatus, ObservabilityFilters } from "@/lib/observabilityCenter/types";

const STATUS_OPTIONS: IntegrationStatus[] = ["SUCCESS", "FAILED", "PENDING", "TIMEOUT", "WARNING"];
/** Curated suggestions only (same precedent as Activity's `ACTION_OPTIONS`, mission §7:
 * "do not hard-code UI logic around only those names") — `integrationType` is free text on
 * the type itself; a fixture with any other category still renders correctly. */
const INTEGRATION_TYPE_OPTIONS = ["ERPNext", "Email", "AI Service", "Automation", "External API"];
const SORT_OPTIONS = [{ value: "recent", label: "Most recent" }];

type SearchParams = {
  search?: string;
  integration?: string;
  integrationType?: string;
  operation?: string;
  status?: string;
  user?: string;
  doctype?: string;
  document?: string;
  trace?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  page_size?: string;
};

/**
 * Integration Monitoring (package O-9) — "what external or cross-system operation ran,
 * did it succeed, and how do I investigate it?" Reads exclusively through
 * `getObservabilityProvider()` (still the DEMO adapter; see
 * `docs/observability-frontend-architecture.md`). Authorization is inherited from
 * `app/(app)/admin/observability/layout.tsx` — this route needs no auth logic of its own.
 *
 * Follows the exact same `ListFilterBar` + table + `PaginationControls` GET-form
 * convention O-7/O-8 already established, plus a compact health-summary row (mission §6)
 * built from the same `ObservabilityHealthCard` Overview already uses.
 */
export default async function IntegrationMonitoringPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);

  const filters: ObservabilityFilters = {
    search: params.search || undefined,
    integration: params.integration || undefined,
    integrationType: params.integrationType || undefined,
    operation: params.operation || undefined,
    status: isStatus(params.status) ? params.status : undefined,
    actorEmail: params.user || undefined,
    doctype: params.doctype || undefined,
    docname: params.document || undefined,
    correlationId: params.trace || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
  };

  const provider = getObservabilityProvider();

  let result: Awaited<ReturnType<typeof provider.getIntegrationEvents>> | null = null;
  let summary: Awaited<ReturnType<typeof provider.getIntegrationSummary>> | null = null;
  let loadError = false;
  try {
    [result, summary] = await Promise.all([
      provider.getIntegrationEvents(filters, page, pageSize),
      provider.getIntegrationSummary(),
    ]);
  } catch {
    loadError = true;
  }

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "search", label: "Search" },
    { type: "text", name: "integration", label: "Integration" },
    { type: "select", name: "integrationType", label: "Integration Type", options: INTEGRATION_TYPE_OPTIONS },
    { type: "text", name: "operation", label: "Operation" },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
    { type: "text", name: "user", label: "Actor" },
    { type: "text", name: "doctype", label: "DocType" },
    { type: "text", name: "document", label: "Document" },
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
          { label: "Integrations" },
        ]}
      />

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-graphite-900">Integration Monitoring</h1>
          <span className="rounded-full bg-graphite-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-graphite-500">
            Demo data
          </span>
        </div>
        <p className="mt-1 text-sm text-graphite-500">
          Monitor ERPNext and external service operations, investigate failures and trace related business
          transactions.
        </p>
      </div>

      {loadError || !summary ? null : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ObservabilityHealthCard label="Total Operations" value={summary.totalOperations} icon={Activity} tone="neutral" />
          <ObservabilityHealthCard
            label="Successful"
            value={summary.successful}
            icon={CheckCircle2}
            tone={summary.successful > 0 ? "signal" : "neutral"}
          />
          <ObservabilityHealthCard
            label="Failed"
            value={summary.failed}
            icon={XCircle}
            tone={summary.failed > 0 ? "alert" : "neutral"}
          />
          <ObservabilityHealthCard label="Average Duration" value={formatDuration(summary.averageDurationMs)} icon={Clock3} tone="neutral" />
        </div>
      )}

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      {loadError || !result ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-graphite-900">Integration data could not be loaded.</p>
          <p className="mt-1 text-sm text-graphite-500">Try again shortly.</p>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-graphite-500">
            {result.pagination.total} {result.pagination.total === 1 ? "result" : "results"}
          </p>
          <IntegrationExplorerTable rows={result.items} />
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

function isStatus(value: string | undefined): value is IntegrationStatus {
  return !!value && (STATUS_OPTIONS as string[]).includes(value);
}

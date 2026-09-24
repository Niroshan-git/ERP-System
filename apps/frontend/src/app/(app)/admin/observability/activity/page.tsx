import { Breadcrumb } from "@/components/Breadcrumb";
import { ActivityExplorerTable } from "@/components/ActivityExplorerTable";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { getObservabilityProvider } from "@/lib/observabilityCenter/provider";
import type { ObservabilityFilters } from "@/lib/observabilityCenter/types";

/** Curated suggestions only (mission §7: "Do not hard-code the UI so tightly that only
 * these values can ever exist") — `UserActivityEvent.action` is free text; a real row with
 * any other verb still renders correctly, it just won't match this select's options. */
const ACTION_OPTIONS = [
  "Login",
  "Logout",
  "Created",
  "Updated",
  "Submitted",
  "Cancelled",
  "Amended",
  "Approved",
  "Rejected",
  "Deleted",
  "Material Transfer",
  "Workflow Action",
  "Integration Action",
];
const SORT_OPTIONS = [{ value: "recent", label: "Most recent" }];

type SearchParams = {
  search?: string;
  user?: string;
  action?: string;
  doctype?: string;
  document?: string;
  trace?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  page_size?: string;
};

/**
 * User Activity (package O-8, converted to LIVE in O-10D) — "what did this person do?"
 * Reads exclusively through `getObservabilityProvider()`, which as of O-10D routes
 * `getActivity()` to the real `ServerObservabilityProvider` (native `Activity Log` — see
 * `serverProvider.ts`). Authorization is inherited from
 * `app/(app)/admin/observability/layout.tsx` — this route needs no auth logic of its own.
 *
 * **Module/Status filters removed in O-10D**, same rationale as O-10C's Error Explorer
 * Module/Source removal: `module` has no native `Activity Log` column (it's a display-only
 * derivation from `reference_doctype` — see `serverProvider.ts`'s `deriveModule()`), and
 * `status`, while a real native column, is not yet forwarded by `serverProvider.ts`'s
 * `getActivity()`. Offering either filter here would silently do nothing when live — the
 * exact misleading behavior mission §10 forbids. Both still render as table columns.
 *
 * Follows the exact same `ListFilterBar` + table + `PaginationControls` GET-form
 * convention O-7's Error Explorer established — filters live entirely in the URL, so a
 * filtered investigation ("everything Niroshan did today") is shareable/bookmarkable.
 */
export default async function UserActivityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);

  const filters: ObservabilityFilters = {
    search: params.search || undefined,
    actorEmail: params.user || undefined,
    action: params.action || undefined,
    doctype: params.doctype || undefined,
    docname: params.document || undefined,
    correlationId: params.trace || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
  };

  let result: Awaited<ReturnType<ReturnType<typeof getObservabilityProvider>["getActivity"]>> | null = null;
  let loadError = false;
  try {
    result = await getObservabilityProvider().getActivity(filters, page, pageSize);
  } catch {
    loadError = true;
  }

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "search", label: "Search" },
    { type: "text", name: "user", label: "User" },
    { type: "select", name: "action", label: "Action", options: ACTION_OPTIONS },
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
          { label: "User Activity" },
        ]}
      />

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-graphite-900">User Activity</h1>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Live
          </span>
        </div>
        <p className="mt-1 text-sm text-graphite-500">
          Review significant user and business operations across Ceylon Stack.
        </p>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      {loadError || !result ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-graphite-900">Activity data could not be loaded.</p>
          <p className="mt-1 text-sm text-graphite-500">Try again shortly.</p>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-graphite-500">
            {result.pagination.total} {result.pagination.total === 1 ? "result" : "results"}
          </p>
          <ActivityExplorerTable rows={result.items} />
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

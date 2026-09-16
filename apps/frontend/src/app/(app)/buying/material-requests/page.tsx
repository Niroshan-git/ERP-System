import Link from "next/link";
import { getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { MaterialRequestsTable, type MaterialRequestRow } from "@/components/MaterialRequestsTable";

// Real-value statuses reachable when `material_request_type` is always "Purchase" (see
// lib/erpStatus.ts's materialRequestStatus) — Draft/Cancelled come from docstatus instead,
// and Issued/Transferred only ever apply to Material Issue/Material Transfer requests,
// which this Purchase-only module never creates, same exclusion approach quotations/page.tsx
// already uses for its own STATUS_OPTIONS.
const STATUS_OPTIONS = ["Stopped", "Pending", "Partially Ordered", "Partially Received", "Ordered", "Received"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "schedule_date asc", label: "Required by (soonest)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  status?: string;
  date?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

export default async function MaterialRequestsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  // Fixed, not user-toggleable — this module is Purchase-only (see actions.ts), so every
  // other material_request_type (Material Transfer/Issue/Manufacture/Subcontracting/
  // Customer Provided) is always excluded here, not just hidden from a filter dropdown.
  const filters: unknown[] = [["material_request_type", "=", "Purchase"]];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.status) filters.push(["status", "=", params.status]);
  if (params.date) filters.push(["transaction_date", "=", params.date]);

  const [requests, companies, totalCount] = await Promise.all([
    listDocs<MaterialRequestRow>("Material Request", {
      fields: ["name", "title", "transaction_date", "schedule_date", "status", "docstatus", "per_ordered", "per_received", "company"],
      filters,
      limit: pageSize + 1,
      start: startIndex,
      orderBy: params.sort || SORT_OPTIONS[0].value,
    }),
    fetchLinkOptions("Company"),
    getCount("Material Request", filters),
  ]);

  const { rows: pagedRequests, hasNextPage } = paginate(requests, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "id", label: "ID" },
    { type: "select", name: "company", label: "Company", options: companies ?? [] },
    { type: "date", name: "date", label: "Date" },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Material Requests</h1>
        <Link
          href="/buying/material-requests/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <MaterialRequestsTable requests={pagedRequests} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedRequests.length}
        totalCount={totalCount}
      />
    </div>
  );
}

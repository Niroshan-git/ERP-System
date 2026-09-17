import Link from "next/link";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { ErpNextError, getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { WorkOrdersTable, type WorkOrderRow } from "@/components/WorkOrdersTable";

// Work Order's `status` DocType enum (live-verified via mcp__ceylon-stack__get_doctype_fields,
// 2026-09-17) — see lib/erpStatus.ts's workOrderStatus for the tone mapping.
const STATUS_OPTIONS = [
  "Draft",
  "Submitted",
  "Not Started",
  "In Process",
  "Stock Reserved",
  "Stock Partially Reserved",
  "Completed",
  "Stopped",
  "Closed",
  "Cancelled",
];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "planned_start_date desc", label: "Planned start (newest)" },
  { value: "planned_start_date asc", label: "Planned start (oldest)" },
];

type SearchParams = {
  id?: string;
  item?: string;
  company?: string;
  status?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

/**
 * "+ New" creates a Draft Work Order only (see ./new/page.tsx and ./actions.ts) — Submit,
 * Cancel, Job Card, BOM, and Workstation pages remain separate, not-yet-built packages. Row
 * IDs link to the read-only detail page (`[name]/page.tsx`).
 */
export default async function WorkOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.item) filters.push(["production_item", "like", `%${params.item}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.status) filters.push(["status", "=", params.status]);

  let workOrders: WorkOrderRow[];
  let companies: string[] | null;
  let totalCount: number;
  try {
    [workOrders, companies, totalCount] = await Promise.all([
      listDocs<WorkOrderRow>("Work Order", {
        fields: [
          "name",
          "status",
          "company",
          "production_item",
          "item_name",
          "qty",
          "produced_qty",
          "bom_no",
          "planned_start_date",
          "planned_end_date",
          "creation",
        ],
        filters: filters.length > 0 ? filters : undefined,
        limit: pageSize + 1,
        start: startIndex,
        orderBy: params.sort || SORT_OPTIONS[0].value,
      }),
      fetchLinkOptions("Company"),
      getCount("Work Order", filters.length > 0 ? filters : undefined),
    ]);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 403) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">Work Orders</h1>
          <AccessDeniedNotice what="Work Orders" />
        </div>
      );
    }
    throw e;
  }

  const { rows: pagedWorkOrders, hasNextPage } = paginate(workOrders, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "id", label: "ID" },
    { type: "text", name: "item", label: "Item" },
    { type: "select", name: "company", label: "Company", options: companies ?? [] },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Work Orders</h1>
        <Link
          href="/manufacturing/work-orders/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New Work Order
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <WorkOrdersTable workOrders={pagedWorkOrders} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedWorkOrders.length}
        totalCount={totalCount}
      />
    </div>
  );
}

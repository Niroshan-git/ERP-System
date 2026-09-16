import Link from "next/link";
import { getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { PurchaseOrdersTable, type PurchaseOrderRow } from "@/components/PurchaseOrdersTable";

// Purchase Order's `status` DocType enum (per the live-verified field list this build was
// scoped against). Draft/Cancelled come from docstatus instead (see erpStatus.ts's
// purchaseOrderStatus), same exclusion approach every other status filter in this app uses.
const STATUS_OPTIONS = [
  "On Hold",
  "To Receive and Bill",
  "To Bill",
  "To Receive",
  "Completed",
  "Closed",
  "Delivered",
];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "transaction_date desc", label: "Date (newest)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  supplier?: string;
  status?: string;
  date?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

/**
 * No bulk close/reopen actions here (PurchaseOrdersTable is a plain, non-selectable table)
 * — the real whitelisted method for Purchase Order's own bulk close/reopen (likely
 * `erpnext.buying.doctype.purchase_order.purchase_order.close_or_unclose_purchase_orders`,
 * mirroring Sales Order's own) hasn't been verified against the live server this session
 * (no network access from this environment — a direct connection attempt failed), so it's
 * skipped rather than guessed. Can be added once verified.
 */
export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.supplier) filters.push(["supplier", "=", params.supplier]);
  if (params.status) filters.push(["status", "=", params.status]);
  if (params.date) filters.push(["transaction_date", "=", params.date]);

  const [orders, companies, suppliers, totalCount] = await Promise.all([
    listDocs<PurchaseOrderRow>("Purchase Order", {
      fields: [
        "name",
        "supplier",
        "supplier_name",
        "status",
        "docstatus",
        "transaction_date",
        "schedule_date",
        "per_billed",
        "per_received",
        "grand_total",
        "company",
        "currency",
      ],
      filters: filters.length > 0 ? filters : undefined,
      limit: pageSize + 1,
      start: startIndex,
      orderBy: params.sort || SORT_OPTIONS[0].value,
    }),
    fetchLinkOptions("Company"),
    fetchLinkOptions("Supplier"),
    getCount("Purchase Order", filters.length > 0 ? filters : undefined),
  ]);

  const { rows: pagedOrders, hasNextPage } = paginate(orders, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "id", label: "ID" },
    { type: "select", name: "company", label: "Company", options: companies ?? [] },
    { type: "select", name: "supplier", label: "Supplier", options: suppliers ?? [] },
    { type: "date", name: "date", label: "Date" },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Purchase Orders</h1>
        <Link
          href="/buying/purchase-orders/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <PurchaseOrdersTable orders={pagedOrders} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedOrders.length}
        totalCount={totalCount}
      />
    </div>
  );
}

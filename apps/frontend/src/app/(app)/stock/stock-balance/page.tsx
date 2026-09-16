import { getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { StockBalanceTable, type StockBalanceRow } from "@/components/StockBalanceTable";

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "item_code asc", label: "Item (A–Z)" },
  { value: "actual_qty desc", label: "Actual qty (highest)" },
];

type SearchParams = {
  item_code?: string;
  warehouse?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

/**
 * Read-only, backed directly by the system-maintained `Bin` doctype — a live "current
 * stock" snapshot, not the same thing as ERPNext's own date-ranged "Stock Balance" Script
 * Report (see StockBalanceTable.tsx's doc comment for why: that report is flagged
 * `prepared_report=1` on the live server, meaning it only runs as a background job Desk
 * itself polls for, not synchronously via `frappe.desk.query_report.run` — confirmed live,
 * not guessed. This page fills the same "what's on hand" need without that background-job
 * machinery this app doesn't have). No `new`/`[name]`/`actions.ts` — Bin rows aren't
 * user-editable.
 */
export default async function StockBalancePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.item_code) filters.push(["item_code", "=", params.item_code]);
  if (params.warehouse) filters.push(["warehouse", "=", params.warehouse]);

  const [rows, items, warehouses, totalCount] = await Promise.all([
    listDocs<StockBalanceRow>("Bin", {
      fields: ["name", "item_code", "warehouse", "actual_qty", "reserved_qty", "projected_qty", "valuation_rate", "stock_uom"],
      filters: filters.length > 0 ? filters : undefined,
      limit: pageSize + 1,
      start: startIndex,
      orderBy: params.sort || SORT_OPTIONS[0].value,
    }),
    fetchLinkOptions("Item"),
    fetchLinkOptions("Warehouse"),
    getCount("Bin", filters.length > 0 ? filters : undefined),
  ]);

  const { rows: pagedRows, hasNextPage } = paginate(rows, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "select", name: "item_code", label: "Item", options: items ?? [] },
    { type: "select", name: "warehouse", label: "Warehouse", options: warehouses ?? [] },
  ];

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-graphite-900">Stock Balance</h1>
        <p className="text-sm text-graphite-500">Live per-warehouse stock levels, straight from ERPNext&apos;s Bin records.</p>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <StockBalanceTable rows={pagedRows} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedRows.length}
        totalCount={totalCount}
      />
    </div>
  );
}

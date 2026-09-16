import { getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { PurchaseReceiptsTable, type PurchaseReceiptRow } from "@/components/PurchaseReceiptsTable";

// Purchase Receipt's `status` DocType enum (per the live-verified field list this build was
// scoped against). Draft/Cancelled come from docstatus instead (see erpStatus.ts's
// purchaseReceiptStatus), same exclusion approach every other status filter in this app uses.
const STATUS_OPTIONS = ["Partly Billed", "To Bill", "Completed", "Return", "Return Issued", "Closed"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "posting_date desc", label: "Posting date (newest)" },
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
 * No "+ New" button here — Purchase Receipt is only ever created from a submitted Purchase
 * Order's own "Create Purchase Receipt" action, same convention as Delivery Note not
 * needing a standalone `new/`.
 */
export default async function PurchaseReceiptsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.supplier) filters.push(["supplier", "=", params.supplier]);
  if (params.status) filters.push(["status", "=", params.status]);
  if (params.date) filters.push(["posting_date", "=", params.date]);

  const [receipts, companies, suppliers, totalCount] = await Promise.all([
    listDocs<PurchaseReceiptRow>("Purchase Receipt", {
      fields: [
        "name",
        "supplier",
        "supplier_name",
        "status",
        "docstatus",
        "posting_date",
        "per_billed",
        "per_returned",
        "is_return",
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
    getCount("Purchase Receipt", filters.length > 0 ? filters : undefined),
  ]);

  const { rows: pagedReceipts, hasNextPage } = paginate(receipts, pageSize);

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
        <h1 className="text-2xl font-medium text-graphite-900">Purchase Receipts</h1>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <PurchaseReceiptsTable receipts={pagedReceipts} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedReceipts.length}
        totalCount={totalCount}
      />
    </div>
  );
}

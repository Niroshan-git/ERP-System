import Link from "next/link";
import { getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { PurchaseInvoicesTable, type PurchaseInvoiceRow } from "@/components/PurchaseInvoicesTable";

// Purchase Invoice's `status` DocType enum (per the live-verified field list this build was
// scoped against).
const STATUS_OPTIONS = [
  "Draft",
  "Return",
  "Debit Note Issued",
  "Submitted",
  "Paid",
  "Partly Paid",
  "Unpaid",
  "Overdue",
  "Cancelled",
  "Internal Transfer",
];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "grand_total desc", label: "Grand total (high-low)" },
  { value: "outstanding_amount desc", label: "Outstanding (high-low)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  supplier?: string;
  date?: string;
  status?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

export default async function PurchaseInvoicesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.supplier) filters.push(["supplier", "=", params.supplier]);
  if (params.date) filters.push(["posting_date", "=", params.date]);
  if (params.status) filters.push(["status", "=", params.status]);

  const [invoices, companies, suppliers, totalCount] = await Promise.all([
    listDocs<PurchaseInvoiceRow>("Purchase Invoice", {
      fields: [
        "name",
        "supplier",
        "supplier_name",
        "status",
        "docstatus",
        "posting_date",
        "due_date",
        "grand_total",
        "outstanding_amount",
        "on_hold",
        "release_date",
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
    getCount("Purchase Invoice", filters.length > 0 ? filters : undefined),
  ]);

  const { rows: pagedInvoices, hasNextPage } = paginate(invoices, pageSize);

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
        <h1 className="text-2xl font-medium text-graphite-900">Purchase Invoices</h1>
        <Link
          href="/buying/purchase-invoices/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <PurchaseInvoicesTable invoices={pagedInvoices} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedInvoices.length}
        totalCount={totalCount}
      />
    </div>
  );
}

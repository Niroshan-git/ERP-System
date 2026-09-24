import Link from "next/link";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { ErpNextError, getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { SalesReturnsTable, type SalesReturnRow } from "@/components/SalesReturnsTable";

// Delivery Note's `status` DocType enum for returns.
const STATUS_OPTIONS = ["Draft", "Return", "Cancelled"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "grand_total desc", label: "Grand total (high-low)" },
  { value: "posting_date desc", label: "Posting date (newest)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  customer?: string;
  date?: string;
  status?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

export default async function SalesReturnsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.customer) filters.push(["customer", "=", params.customer]);
  if (params.date) filters.push(["posting_date", "=", params.date]);
  if (params.status) filters.push(["status", "=", params.status]);
  filters.push(["is_return", "=", 1]);

  let salesReturns: SalesReturnRow[];
  let companies: string[] | null;
  let customers: string[] | null;
  let totalCount: number;
  try {
    [salesReturns, companies, customers, totalCount] = await Promise.all([
      listDocs<SalesReturnRow>("Delivery Note", {
        fields: [
          "name",
          "customer",
          "posting_date",
          "status",
          "docstatus",
          "per_billed",
          "is_return",
          "return_against",
          "grand_total",
          "company",
          "territory",
          "owner",
        ],
        filters: filters.length > 0 ? filters : undefined,
        limit: pageSize + 1,
        start: startIndex,
        orderBy: params.sort || SORT_OPTIONS[0].value,
      }),
      fetchLinkOptions("Company"),
      fetchLinkOptions("Customer"),
      getCount("Delivery Note", filters.length > 0 ? filters : undefined),
    ]);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 403) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">Sales Returns</h1>
          <AccessDeniedNotice what="Sales Returns" />
        </div>
      );
    }
    throw e;
  }

  const { rows: pagedSalesReturns, hasNextPage } = paginate(salesReturns, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "id", label: "ID" },
    { type: "select", name: "company", label: "Company", options: companies ?? [] },
    { type: "select", name: "customer", label: "Customer", options: customers ?? [] },
    { type: "date", name: "date", label: "Date" },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Sales Returns</h1>
        <Link
          href="/sales/returns/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <SalesReturnsTable salesReturns={pagedSalesReturns} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedSalesReturns.length}
        totalCount={totalCount}
      />
    </div>
  );
}

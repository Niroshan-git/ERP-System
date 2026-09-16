import Link from "next/link";
import { getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { QuotationsTable, type QuotationRow } from "@/components/QuotationsTable";

// Quotation's `status` DocType enum (checked against the live DocType JSON) — "Draft" and
// "Cancelled" come from docstatus instead (see lib/erpStatus.ts's quotationStatus), so
// they're left out of this filter's options the same way ERPNext's own Quotation list
// filter would only ever show the submitted-state values here.
const STATUS_OPTIONS = ["Open", "Replied", "Partially Ordered", "Ordered", "Lost", "Expired"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "grand_total desc", label: "Grand total (high-low)" },
  { value: "valid_till asc", label: "Valid till (soonest)" },
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

export default async function QuotationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.customer) filters.push(["party_name", "=", params.customer]);
  if (params.date) filters.push(["transaction_date", "=", params.date]);
  if (params.status) filters.push(["status", "=", params.status]);

  const [quotations, companies, customers, totalCount] = await Promise.all([
    listDocs<QuotationRow>("Quotation", {
      fields: [
        "name",
        "party_name",
        "transaction_date",
        "status",
        "docstatus",
        "grand_total",
        "valid_till",
        "order_type",
        "company",
        "currency",
        "territory",
        "customer_group",
        "owner",
        "modified",
      ],
      filters: filters.length > 0 ? filters : undefined,
      limit: pageSize + 1,
      start: startIndex,
      orderBy: params.sort || SORT_OPTIONS[0].value,
    }),
    fetchLinkOptions("Company"),
    fetchLinkOptions("Customer"),
    getCount("Quotation", filters.length > 0 ? filters : undefined),
  ]);

  const { rows: pagedQuotations, hasNextPage } = paginate(quotations, pageSize);

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
        <h1 className="text-2xl font-medium text-graphite-900">Quotations</h1>
        <Link
          href="/sales/quotations/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <QuotationsTable quotations={pagedQuotations} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedQuotations.length}
        totalCount={totalCount}
      />
    </div>
  );
}

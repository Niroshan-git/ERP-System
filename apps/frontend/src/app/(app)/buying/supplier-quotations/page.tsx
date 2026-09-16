import { getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { SupplierQuotationsTable, type SupplierQuotationRow } from "@/components/SupplierQuotationsTable";

// Supplier Quotation's declared `status` Select enum (confirmed via the live DocType
// JSON) — "Ordered"/"Rejected" are real but undocumented values Frappe can still set via
// server-side db_set (see lib/erpStatus.ts's supplierQuotationStatus doc comment); left out
// of this filter dropdown the same way quotationStatus's Draft/Cancelled are, since neither
// is something a user would deliberately filter for here versus just reading the Status column.
const STATUS_OPTIONS = ["Draft", "Submitted", "Stopped", "Cancelled", "Expired"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "valid_till asc", label: "Valid till (soonest)" },
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
 * No "+ New" button here — Supplier Quotation is only ever created from a submitted RFQ's
 * own "Record Supplier Quotation" action, the same way Request for Quotation has no
 * standalone `new/` either.
 */
export default async function SupplierQuotationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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

  const [quotations, companies, suppliers, totalCount] = await Promise.all([
    listDocs<SupplierQuotationRow>("Supplier Quotation", {
      fields: ["name", "supplier", "supplier_name", "status", "docstatus", "transaction_date", "valid_till", "company", "currency"],
      filters: filters.length > 0 ? filters : undefined,
      limit: pageSize + 1,
      start: startIndex,
      orderBy: params.sort || SORT_OPTIONS[0].value,
    }),
    fetchLinkOptions("Company"),
    fetchLinkOptions("Supplier"),
    getCount("Supplier Quotation", filters.length > 0 ? filters : undefined),
  ]);

  const { rows: pagedQuotations, hasNextPage } = paginate(quotations, pageSize);

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
        <h1 className="text-2xl font-medium text-graphite-900">Supplier Quotations</h1>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <SupplierQuotationsTable quotations={pagedQuotations} startIndex={startIndex} />
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

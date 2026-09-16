import { getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { RequestForQuotationsTable, type RequestForQuotationRow } from "@/components/RequestForQuotationsTable";

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  date?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

/**
 * No "+ New" button here — Request for Quotation is only ever created from a submitted
 * Material Request's own "Create RFQ" action (see
 * buying/material-requests/[name]/create-rfq/page.tsx), the same way Pick List has no
 * standalone `new/` either.
 */
export default async function RequestForQuotationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.date) filters.push(["transaction_date", "=", params.date]);

  const [rfqs, companies, totalCount] = await Promise.all([
    listDocs<RequestForQuotationRow>("Request for Quotation", {
      fields: ["name", "transaction_date", "schedule_date", "docstatus", "company"],
      filters: filters.length > 0 ? filters : undefined,
      limit: pageSize + 1,
      start: startIndex,
      orderBy: params.sort || SORT_OPTIONS[0].value,
    }),
    fetchLinkOptions("Company"),
    getCount("Request for Quotation", filters.length > 0 ? filters : undefined),
  ]);

  const { rows: pagedRfqs, hasNextPage } = paginate(rfqs, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "id", label: "ID" },
    { type: "select", name: "company", label: "Company", options: companies ?? [] },
    { type: "date", name: "date", label: "Date" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Requests for Quotation</h1>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <RequestForQuotationsTable rfqs={pagedRfqs} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedRfqs.length}
        totalCount={totalCount}
      />
    </div>
  );
}

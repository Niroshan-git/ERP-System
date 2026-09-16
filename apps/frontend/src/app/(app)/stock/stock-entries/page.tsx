import Link from "next/link";
import { getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { StockEntriesTable, type StockEntryRow } from "@/components/StockEntriesTable";

// Restricted to the 3 in-scope purposes (see actions.ts) — Manufacture/Repack/Send to
// Subcontractor/etc. are Manufacturing-scope, out of bounds for this build.
const PURPOSE_OPTIONS = ["Material Issue", "Material Receipt", "Material Transfer"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "posting_date desc", label: "Date (newest)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  purpose?: string;
  date?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

export default async function StockEntriesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.purpose) filters.push(["purpose", "=", params.purpose]);
  if (params.date) filters.push(["posting_date", "=", params.date]);

  const [entries, companies, totalCount] = await Promise.all([
    listDocs<StockEntryRow>("Stock Entry", {
      fields: ["name", "posting_date", "purpose", "docstatus", "from_warehouse", "to_warehouse", "company"],
      filters: filters.length > 0 ? filters : undefined,
      limit: pageSize + 1,
      start: startIndex,
      orderBy: params.sort || SORT_OPTIONS[0].value,
    }),
    fetchLinkOptions("Company"),
    getCount("Stock Entry", filters.length > 0 ? filters : undefined),
  ]);

  const { rows: pagedEntries, hasNextPage } = paginate(entries, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "id", label: "ID" },
    { type: "select", name: "company", label: "Company", options: companies ?? [] },
    { type: "select", name: "purpose", label: "Purpose", options: PURPOSE_OPTIONS },
    { type: "date", name: "date", label: "Date" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Stock Entries</h1>
        <Link
          href="/stock/stock-entries/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <StockEntriesTable entries={pagedEntries} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedEntries.length}
        totalCount={totalCount}
      />
    </div>
  );
}

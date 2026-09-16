import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { ErpNextError, getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { PickListsTable, type PickListRow } from "@/components/PickListsTable";

// Pick List's `status` DocType enum (checked against the live DocType JSON).
const STATUS_OPTIONS = ["Draft", "Open", "Partly Delivered", "Partially Transferred", "Completed", "Cancelled"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  customer?: string;
  status?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

export default async function PickListsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.customer) filters.push(["customer", "=", params.customer]);
  if (params.status) filters.push(["status", "=", params.status]);

  let pickLists: PickListRow[];
  let companies: string[] | null;
  let customers: string[] | null;
  let totalCount: number;
  try {
    [pickLists, companies, customers, totalCount] = await Promise.all([
      listDocs<PickListRow>("Pick List", {
        fields: ["name", "customer", "purpose", "status", "docstatus", "per_delivered", "company", "owner"],
        filters: filters.length > 0 ? filters : undefined,
        limit: pageSize + 1,
        start: startIndex,
        orderBy: params.sort || SORT_OPTIONS[0].value,
      }),
      fetchLinkOptions("Company"),
      fetchLinkOptions("Customer"),
      getCount("Pick List", filters.length > 0 ? filters : undefined),
    ]);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 403) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">Pick Lists</h1>
          <AccessDeniedNotice what="Pick Lists" />
        </div>
      );
    }
    throw e;
  }

  const { rows: pagedPickLists, hasNextPage } = paginate(pickLists, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "id", label: "ID" },
    { type: "select", name: "company", label: "Company", options: companies ?? [] },
    { type: "select", name: "customer", label: "Customer", options: customers ?? [] },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Pick Lists</h1>
      </div>
      <p className="mb-4 max-w-2xl text-sm text-graphite-500">
        Release Sales Order lines for picking and confirm what was actually pulled from stock, before creating the
        Delivery Note. Optional — a Delivery Note can still be created directly from a Sales Order without one.
      </p>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <PickListsTable pickLists={pagedPickLists} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedPickLists.length}
        totalCount={totalCount}
      />
    </div>
  );
}

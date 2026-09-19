import Link from "next/link";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BomsTable, type BomRow } from "@/components/BomsTable";
import { ErpNextError, getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "name asc", label: "BOM (A-Z)" },
];

type SearchParams = {
  id?: string;
  item?: string;
  company?: string;
  status?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

const STATUS_OPTIONS = ["Draft", "Submitted", "Cancelled"];

/**
 * BOM list — Master Data / Manufacturing Masters entity index. Package 4A (2026-09-19) built
 * this read-only, deliberately on the plain `DataTable`/`BomsTable` shell rather than
 * `MasterTable` (which always bakes in a "+ New" link) because no create route existed yet.
 * Package 4B (also 2026-09-19) added `/master-data/boms/new`, so the "+ New BOM" link below
 * is now added the same way `WorkOrdersPage` adds its own — a separate, page-level link next
 * to the title, not baked into the table component itself. No bulk actions.
 */
export default async function BomsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.item) filters.push(["item", "like", `%${params.item}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.status === "Draft") filters.push(["docstatus", "=", 0]);
  if (params.status === "Submitted") filters.push(["docstatus", "=", 1]);
  if (params.status === "Cancelled") filters.push(["docstatus", "=", 2]);

  let boms: BomRow[];
  let companies: string[] | null;
  let totalCount: number;
  try {
    [boms, companies, totalCount] = await Promise.all([
      listDocs<BomRow>("BOM", {
        fields: [
          "name",
          "item",
          "item_name",
          "quantity",
          "uom",
          "company",
          "is_active",
          "is_default",
          "docstatus",
          "modified",
        ],
        filters: filters.length > 0 ? filters : undefined,
        limit: pageSize + 1,
        start: startIndex,
        orderBy: params.sort || SORT_OPTIONS[0].value,
      }),
      fetchLinkOptions("Company"),
      getCount("BOM", filters.length > 0 ? filters : undefined),
    ]);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 403) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">Bills of Materials</h1>
          <AccessDeniedNotice what="BOMs" />
        </div>
      );
    }
    throw e;
  }

  const { rows: pagedBoms, hasNextPage } = paginate(boms, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "id", label: "BOM" },
    { type: "text", name: "item", label: "Item" },
    { type: "select", name: "company", label: "Company", options: companies ?? [] },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
  ];

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Master Data", href: "/master-data" },
          { label: "Bills of Materials" },
        ]}
      />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Bills of Materials</h1>
        <Link
          href="/master-data/boms/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New BOM
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <BomsTable boms={pagedBoms} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedBoms.length}
        totalCount={totalCount}
      />
    </div>
  );
}

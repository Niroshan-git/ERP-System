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
 * Minimal read-only BOM list — Master Data / Manufacturing Masters entity index, existing
 * purely for navigation into the canonical BOM detail page (`[name]/page.tsx`). No "+ New"
 * link, no bulk actions: this package (Manufacturing Masters — BOM 4A) is read-only by
 * design, unlike every other `master-data/*` list page's `MasterTable` (which always renders
 * a create action) — so this reuses the plain `DataTable`/`BomsTable` shell instead, the same
 * component `WorkOrdersTable`/`WorkOrdersPage` already use alongside their own separate
 * (not-baked-in) "+ New" link.
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
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">Bills of Materials</h1>

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

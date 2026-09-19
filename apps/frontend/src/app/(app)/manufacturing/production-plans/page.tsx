import Link from "next/link";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ErpNextError, getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { ProductionPlansTable, type ProductionPlanRow } from "@/components/ProductionPlansTable";

// Production Plan's `status` DocType enum (schema-verified via get_doctype_fields, 2026-09-19
// discovery package — see docs/backend/05-manufacturing/production-plan.md). Server-calculated,
// never set directly by a user; exposed here only as a read-only filter, same as Work Order's own
// STATUS_OPTIONS.
const STATUS_OPTIONS = [
  "Draft",
  "Submitted",
  "Not Started",
  "In Process",
  "Completed",
  "Closed",
  "Cancelled",
  "Material Requested",
];

const GET_ITEMS_FROM_OPTIONS = ["Sales Order", "Material Request"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "posting_date desc", label: "Posting date (newest)" },
  { value: "posting_date asc", label: "Posting date (oldest)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  status?: string;
  get_items_from?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

/**
 * Production Plan list — PP-1 (2026-09-19) shipped this read-only. PP-2 (2026-09-20) added
 * "+ New Production Plan" (see ./new/page.tsx, ./actions.ts) — Draft-only create via ERPNext's
 * own native Get Sales Orders/Get Material Request/Get Finished Goods methods. Submit/cancel,
 * Get Sub Assembly Items, raw-material calc, and Make Work Order/Make Material Request remain
 * out of scope for both packages — see docs/backend/05-manufacturing/production-plan.md's
 * "Frontend footprint" section.
 */
export default async function ProductionPlansPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.status) filters.push(["status", "=", params.status]);
  if (params.get_items_from) filters.push(["get_items_from", "=", params.get_items_from]);

  let productionPlans: ProductionPlanRow[];
  let companies: string[] | null;
  let totalCount: number;
  try {
    [productionPlans, companies, totalCount] = await Promise.all([
      listDocs<ProductionPlanRow>("Production Plan", {
        fields: [
          "name",
          "company",
          "posting_date",
          "status",
          "docstatus",
          "get_items_from",
          "combine_items",
          "combine_sub_items",
          "total_planned_qty",
          "creation",
          "modified",
        ],
        filters: filters.length > 0 ? filters : undefined,
        limit: pageSize + 1,
        start: startIndex,
        orderBy: params.sort || SORT_OPTIONS[0].value,
      }),
      fetchLinkOptions("Company"),
      getCount("Production Plan", filters.length > 0 ? filters : undefined),
    ]);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 403) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">Production Plans</h1>
          <AccessDeniedNotice what="Production Plans" />
        </div>
      );
    }
    throw e;
  }

  const { rows: pagedProductionPlans, hasNextPage } = paginate(productionPlans, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "id", label: "Production Plan" },
    { type: "select", name: "company", label: "Company", options: companies ?? [] },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
    { type: "select", name: "get_items_from", label: "Get Items From", options: GET_ITEMS_FROM_OPTIONS },
  ];

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Manufacturing", href: "/manufacturing" },
          { label: "Production Plans" },
        ]}
      />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Production Plans</h1>
        <Link
          href="/manufacturing/production-plans/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New Production Plan
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <ProductionPlansTable productionPlans={pagedProductionPlans} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={pagedProductionPlans.length}
        totalCount={totalCount}
      />
    </div>
  );
}

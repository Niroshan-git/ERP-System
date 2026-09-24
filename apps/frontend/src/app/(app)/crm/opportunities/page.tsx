import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { OpportunitiesTable, type OpportunityRow } from "@/components/OpportunitiesTable";
import { SALES_STAGE_OPTIONS } from "@/lib/salesStageOptions";

// Opportunity's own `status` Select enum (live-verified, `get_doctype_fields`, `CRM-2`
// package). Unlike a manual status-change control, a list filter can safely offer every
// value — including "Lost"/"Converted", which this app only ever sets through its own
// dedicated actions (`markOpportunityLostAction`/the Quotation handoff), same allowlist
// split `crm/leads/page.tsx` already established for Lead's own filter.
const STATUS_OPTIONS = ["Open", "Quotation", "Converted", "Lost", "Replied", "Closed"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "expected_closing asc", label: "Expected close (soonest)" },
  { value: "opportunity_amount desc", label: "Value (highest)" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
];

type SearchParams = {
  title?: string;
  status?: string;
  sales_stage?: string;
  opportunity_owner?: string;
  territory?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.title) filters.push(["title", "like", `%${params.title}%`]);
  if (params.status) filters.push(["status", "=", params.status]);
  if (params.sales_stage) filters.push(["sales_stage", "=", params.sales_stage]);
  if (params.opportunity_owner) filters.push(["opportunity_owner", "=", params.opportunity_owner]);
  if (params.territory) filters.push(["territory", "=", params.territory]);

  const [opportunitiesPlusOne, owners, territories, totalCount] = await Promise.all([
    listDocs<OpportunityRow>("Opportunity", {
      fields: [
        "name",
        "title",
        "opportunity_from",
        "party_name",
        "customer_name",
        "status",
        "sales_stage",
        "opportunity_amount",
        "probability",
        "currency",
        "expected_closing",
        "opportunity_owner",
        "modified",
      ],
      filters: filters.length > 0 ? filters : undefined,
      limit: pageSize + 1,
      start: startIndex,
      orderBy: params.sort || SORT_OPTIONS[0].value,
    }),
    fetchLinkOptions("User"),
    fetchLinkOptions("Territory"),
    getCount("Opportunity", filters.length > 0 ? filters : undefined),
  ]);
  const { rows: opportunities, hasNextPage } = paginate(opportunitiesPlusOne, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "title", label: "Title" },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
    { type: "select", name: "sales_stage", label: "Stage", options: SALES_STAGE_OPTIONS },
    { type: "select", name: "territory", label: "Territory", options: territories ?? [] },
    { type: "select", name: "opportunity_owner", label: "Owner", options: owners ?? [] },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "CRM", href: "/crm" }, { label: "Opportunities" }]} />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Opportunities</h1>
        <Link
          href="/crm/opportunities/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <OpportunitiesTable opportunities={opportunities} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={opportunities.length}
        totalCount={totalCount}
      />
    </div>
  );
}

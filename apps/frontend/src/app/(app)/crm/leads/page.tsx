import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getCount, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { LeadsTable, type LeadRow } from "@/components/LeadsTable";

// Lead's own `status` Select enum (live-verified, CRM-1 package) — the full set, used for
// the list filter. Unlike `MANUAL_LEAD_STATUS_OPTIONS` (crm/leads/actions.ts), a filter is
// read-only, so it's fine to let a user filter down to "Opportunity"/"Converted" leads even
// though those values are only ever set by the conversion actions, never chosen manually.
const STATUS_OPTIONS = [
  "Lead",
  "Open",
  "Replied",
  "Opportunity",
  "Quotation",
  "Lost Quotation",
  "Interested",
  "Converted",
  "Do Not Contact",
];
// Lead has no dedicated "source" field (live-verified, CRM-1 package — no `source`/
// `lead_source` field exists on the live DocType; `utm_source` is a separate marketing-
// attribution Link, POST-V1 per `docs/backend/16-crm/crm-architecture.md` §5.1). `type`
// ("Lead Type": Client/Channel Partner/Consultant) is the closest real, filterable
// classification field, used here in place of the "source" filter the brief's illustrative
// scope named — documented as a deliberate deviation in this package's final report.
const LEAD_TYPE_OPTIONS = ["Client", "Channel Partner", "Consultant"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "lead_name asc", label: "Name (A–Z)" },
];

type SearchParams = {
  lead_name?: string;
  company_name?: string;
  status?: string;
  territory?: string;
  industry?: string;
  type?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const filters: unknown[] = [];
  if (params.lead_name) filters.push(["lead_name", "like", `%${params.lead_name}%`]);
  if (params.company_name) filters.push(["company_name", "like", `%${params.company_name}%`]);
  if (params.status) filters.push(["status", "=", params.status]);
  if (params.territory) filters.push(["territory", "=", params.territory]);
  if (params.industry) filters.push(["industry", "=", params.industry]);
  if (params.type) filters.push(["type", "=", params.type]);

  const [leadsPlusOne, territories, industries, totalCount] = await Promise.all([
    listDocs<LeadRow>("Lead", {
      fields: [
        "name",
        "lead_name",
        "status",
        "company_name",
        "territory",
        "industry",
        "type",
        "email_id",
        "mobile_no",
        "lead_owner",
        "qualification_status",
        "disabled",
      ],
      filters: filters.length > 0 ? filters : undefined,
      limit: pageSize + 1,
      start: startIndex,
      orderBy: params.sort || SORT_OPTIONS[0].value,
    }),
    fetchLinkOptions("Territory"),
    fetchLinkOptions("Industry Type"),
    getCount("Lead", filters.length > 0 ? filters : undefined),
  ]);
  const { rows: leads, hasNextPage } = paginate(leadsPlusOne, pageSize);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "lead_name", label: "Name" },
    { type: "text", name: "company_name", label: "Organization" },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
    { type: "select", name: "territory", label: "Territory", options: territories ?? [] },
    { type: "select", name: "industry", label: "Industry", options: industries ?? [] },
    { type: "select", name: "type", label: "Lead Type", options: LEAD_TYPE_OPTIONS },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "CRM", href: "/crm" }, { label: "Leads" }]} />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Leads</h1>
        <Link
          href="/crm/leads/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <LeadsTable leads={leads} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={leads.length}
        totalCount={totalCount}
      />
    </div>
  );
}

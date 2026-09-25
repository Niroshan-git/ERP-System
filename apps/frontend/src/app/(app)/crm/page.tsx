import Link from "next/link";
import { cookies } from "next/headers";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { PipelineBoard } from "@/components/PipelineBoard";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { formatAmount } from "@/lib/format";
import { SALES_STAGE_OPTIONS } from "@/lib/salesStageOptions";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import {
  getPipelineData,
  CLOSING_SOON_DAYS,
  STALE_THRESHOLD_DAYS,
  type PipelineFilters,
  type PipelineRow,
} from "@/lib/crmPipeline";
import { updateOpportunityStageAction } from "./opportunities/actions";

/**
 * `CRM-4` Pipeline Workspace — `/crm`'s landing page, replacing the minimal `CRM-1`/`CRM-2`-era
 * module home. Sales-management surface over the existing `CRM-2` Opportunity foundation and
 * `CRM-3` follow-up derivation (`lib/crmPipeline.ts`) — no new write path beyond the explicit
 * stage-change action, no new doctype, no Won/Lost analytics (mission brief §6: `CRM-UNV-010`/
 * `011`'s unresolved won/lost-semantics gap is preserved, not silently closed by this package).
 *
 * "CRM Home" in the sidebar already resolves to this route (`Sidebar.tsx`'s per-module
 * `homeHref` dashboard-item pattern, the same convention Sales/Manufacturing/every other module
 * already uses) — no separate "Workspace" nav item was added, to stay consistent with that
 * existing pattern rather than introduce a redundant one.
 */

type SearchParams = {
  stage?: string;
  status?: string;
  territory?: string;
  owner?: string;
  mine?: string;
  from?: string;
  health?: string;
  sort?: string;
};

const STATUS_FILTER_OPTIONS = ["Open", "Quotation", "Replied"];

const HEALTH_FILTER_LABELS: Record<string, NonNullable<PipelineFilters["followupHealth"]>> = {
  Overdue: "overdue",
  "Due Today": "due_today",
  Upcoming: "upcoming",
  // An open Follow-up with no due date at all (`ToDo.date` is optional in ERPNext's own schema,
  // even though this app's own Follow-up form requires one — a Desk-created ToDo could still
  // arrive undated). Added per a QA finding: without this, such a row was reachable in the
  // unfiltered board but couldn't be filtered to directly.
  "No Due Date": "no_due_date",
  "No Next Action": "no_next_action",
};

const SORT_OPTIONS = [
  { value: "expected_closing asc", label: "Expected close (soonest)" },
  { value: "opportunity_amount desc", label: "Value (highest)" },
  { value: "probability desc", label: "Probability (highest)" },
  { value: "modified desc", label: "Last updated" },
];

function currencySuffix(currency: string | null): string {
  return currency ? ` ${currency}` : "";
}

function AttentionSection({
  title,
  rows,
  renderMeta,
  emptyMessage,
}: {
  title: string;
  rows: PipelineRow[];
  renderMeta: (row: PipelineRow) => string;
  emptyMessage: string;
}) {
  const visible = rows.slice(0, 8);
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-graphite-900">{title}</h3>
        <span className="text-xs text-graphite-500">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-graphite-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row) => (
            <li key={row.name} className="flex items-center justify-between gap-2 text-sm">
              <Link
                href={`/crm/opportunities/${encodeURIComponent(row.name)}`}
                className="min-w-0 flex-1 truncate text-signal hover:underline"
                title={row.title || row.name}
              >
                {row.title || row.name}
              </Link>
              <span className="shrink-0 text-xs text-graphite-500">{renderMeta(row)}</span>
            </li>
          ))}
          {rows.length > visible.length && (
            <li className="text-xs text-graphite-500">+{rows.length - visible.length} more</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default async function CrmWorkspacePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const mine = params.mine === "1";

  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  const opportunityOwner = mine ? session?.email : params.owner || undefined;

  const filters: PipelineFilters = {
    salesStage: params.stage || undefined,
    status: params.status || undefined,
    territory: params.territory || undefined,
    opportunityOwner,
    opportunityFrom: params.from === "Lead" || params.from === "Customer" ? params.from : undefined,
    followupHealth: params.health ? HEALTH_FILTER_LABELS[params.health] : undefined,
    sort: params.sort,
  };

  const [{ rows, kpis }, territories, owners] = await Promise.all([
    getPipelineData(filters),
    fetchLinkOptions("Territory"),
    fetchLinkOptions("User"),
  ]);

  const filterFields: FilterFieldConfig[] = [
    { type: "select", name: "stage", label: "Stage", options: SALES_STAGE_OPTIONS },
    { type: "select", name: "status", label: "Status", options: STATUS_FILTER_OPTIONS },
    { type: "select", name: "territory", label: "Territory", options: territories ?? [] },
    { type: "select", name: "owner", label: "Owner", options: owners ?? [] },
    { type: "select", name: "from", label: "Origin", options: ["Lead", "Customer"] },
    { type: "select", name: "health", label: "Follow-up Health", options: Object.keys(HEALTH_FILTER_LABELS) },
  ];

  const anyFilterActive = Boolean(
    params.stage || params.status || params.territory || params.owner || params.from || params.health || mine,
  );

  const closingSoon = rows.filter((r) => r.isClosingSoon);
  const pastExpectedClose = rows.filter((r) => r.isPastExpectedClose);
  const noNextAction = rows.filter((r) => r.followupHealth === "no_next_action");
  const overdueFollowup = rows.filter((r) => r.followupHealth === "overdue");
  const dueToday = rows.filter((r) => r.followupHealth === "due_today");
  const stale = rows.filter((r) => r.isStale);

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "CRM" }]} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-medium text-graphite-900">Pipeline Workspace</h1>
        <div className="flex items-center gap-2">
          {session?.email && (
            <a
              href={mine ? "?mine=0" : "?mine=1"}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                mine ? "border-signal bg-signal/10 text-signal" : "border-border text-graphite-900 hover:bg-surface"
              }`}
            >
              {mine ? "Showing my opportunities" : "Show only my opportunities"}
            </a>
          )}
          <Link
            href="/crm/opportunities/new"
            className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
          >
            + New Opportunity
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-graphite-500">Open Opportunities</p>
          <p className="mt-1 text-2xl font-medium text-graphite-900">{kpis.openCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-graphite-500">Pipeline Value</p>
          <p className="mt-1 text-2xl font-medium text-graphite-900">
            {formatAmount(kpis.pipelineValue)}
            {currencySuffix(kpis.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-graphite-500">Weighted Pipeline</p>
          <p className="mt-1 text-2xl font-medium text-graphite-900">
            {formatAmount(kpis.weightedPipelineValue)}
            {currencySuffix(kpis.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-graphite-500">Expected to Close (30d)</p>
          <p className="mt-1 text-2xl font-medium text-graphite-900">{kpis.expectedToCloseCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-graphite-500">Overdue Follow-ups</p>
          <p className={`mt-1 text-2xl font-medium ${kpis.overdueFollowupCount > 0 ? "text-alert" : "text-graphite-900"}`}>
            {kpis.overdueFollowupCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-graphite-500">No Next Action</p>
          <p className={`mt-1 text-2xl font-medium ${kpis.noNextActionCount > 0 ? "text-signal" : "text-graphite-900"}`}>
            {kpis.noNextActionCount}
          </p>
        </div>
      </div>
      <p className="mb-6 text-xs text-graphite-500">
        Win rate, won/lost revenue, and conversion rate are not shown — Opportunity won/lost transition semantics
        remain unverified against a live instance (see <code>CRM-UNV-010</code>/<code>CRM-UNV-011</code> in{" "}
        <code>docs/backend/99-unverified/unverified-behaviours.md</code>). Pipeline totals reflect the currently
        applied filters below, not the whole module.
      </p>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AttentionSection
          title="Overdue Follow-up"
          rows={overdueFollowup}
          emptyMessage="Nothing overdue — pipeline is on track."
          renderMeta={(r) => (r.nextFollowup?.dueDate ? `Due ${r.nextFollowup.dueDate}` : "")}
        />
        <AttentionSection
          title="Due Today"
          rows={dueToday}
          emptyMessage="No follow-ups due today."
          renderMeta={() => "Today"}
        />
        <AttentionSection
          title="No Next Action"
          rows={noNextAction}
          emptyMessage="Every active opportunity has a scheduled next step."
          renderMeta={(r) => r.opportunity_owner || ""}
        />
        <AttentionSection
          title="Closing Soon"
          rows={closingSoon}
          emptyMessage={`Nothing expected to close in the next ${CLOSING_SOON_DAYS} days.`}
          renderMeta={(r) => r.expected_closing || ""}
        />
        <AttentionSection
          title="Past Expected Close"
          rows={pastExpectedClose}
          emptyMessage="No opportunity has slipped past its expected close date."
          renderMeta={(r) => r.expected_closing || ""}
        />
        <AttentionSection
          title={`Stale (${STALE_THRESHOLD_DAYS}+ days)`}
          rows={stale}
          emptyMessage="No opportunity has gone quiet."
          renderMeta={(r) => (r.staleDays !== null ? `${r.staleDays}d` : "")}
        />
      </div>

      <h2 className="mb-3 text-base font-semibold text-graphite-900">Pipeline Board</h2>
      <PipelineBoard
        rows={rows}
        stages={SALES_STAGE_OPTIONS}
        emptyLabel={
          anyFilterActive
            ? "No opportunities match these filters."
            : "No active opportunities yet — create one to start the pipeline."
        }
        onStageChange={updateOpportunityStageAction}
      />
    </div>
  );
}

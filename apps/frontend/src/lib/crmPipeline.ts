import "server-only";
import { listDocs } from "@/lib/erpnext";
import { followupBucket, todayMidnight, type FollowupBucket } from "@/lib/followupBucket";
import { pickNextFollowup, listOpenFollowupsBulk, type ToDoRow } from "@/lib/crmActivity";
import { stripHtml } from "@/lib/timeline";

/**
 * `CRM-4` Pipeline Workspace — server-side aggregation service for `/crm`. Reuses `CRM-2`'s
 * Opportunity schema and `CRM-3`'s follow-up derivation (`pickNextFollowup`/`followupBucket`)
 * rather than inventing a parallel query layer, per the mission brief's explicit instruction.
 *
 * Terminal vs. active status split follows the Opportunity lifecycle
 * `docs/backend/16-crm/crm-architecture.md` §7 documents (source-verified `declare_enquiry_lost`/
 * `auto_close_opportunity` behavior): `Lost`, `Converted`, and `Closed` are end states an
 * Opportunity does not leave — everything else (`Open`, `Quotation`, `Replied`) is still "in
 * play" and belongs in a pipeline workspace. This is the same three-value exclusion
 * `OpportunityDetailPage`'s own `isResolved` check already uses for hiding pipeline actions,
 * applied here to what counts as "active" for KPIs/board membership instead.
 */
const TERMINAL_STATUSES = ["Lost", "Converted", "Closed"];

/**
 * V1 product defaults, not ERPNext-derived — same class of Ceylon Stack-side UX threshold
 * `createFollowupAction`'s "due date required" rule already established, and explicitly
 * permitted by the mission brief §5/§10/§11 rather than left undocumented. Revisit if a real
 * usage pattern argues for a different window; there is no live signal yet to tune these
 * against (zero live Opportunity/ToDo/Event/Communication records exist on the instance this
 * package was built against — confirmed via `mcp__ceylon-stack__list_documents` this session).
 */
export const CLOSING_SOON_DAYS = 7;
export const EXPECTED_TO_CLOSE_DAYS = 30;
export const STALE_THRESHOLD_DAYS = 14;

export type PipelineOpportunityFrom = "Lead" | "Customer";

export type PipelineFilters = {
  salesStage?: string;
  status?: string;
  territory?: string;
  opportunityOwner?: string;
  opportunityFrom?: PipelineOpportunityFrom;
  followupHealth?: FollowupBucket | "no_next_action";
  sort?: string;
};

export type PipelineRow = {
  name: string;
  title: string | null;
  opportunity_from: string;
  party_name: string;
  customer_name: string | null;
  status: string;
  sales_stage: string | null;
  opportunity_amount: number;
  probability: number;
  weightedValue: number;
  currency: string | null;
  expected_closing: string | null;
  opportunity_owner: string | null;
  territory: string | null;
  modified: string;
  nextFollowup: { dueDate?: string; description: string; bucket: FollowupBucket } | null;
  /** `followupBucket`'s enum plus a distinct "no_next_action" — no open ToDo at all, not merely one not-yet-due. */
  followupHealth: FollowupBucket | "no_next_action";
  isClosingSoon: boolean;
  isPastExpectedClose: boolean;
  /**
   * Last recorded ToDo/Event/Communication activity against this Opportunity (`Comment`/child-
   * table `CRM Note` are excluded — Note has no `reference_type` of its own to bulk-query by,
   * §26.1/§26.5 of the architecture doc, and Comment would need a per-record fetch, reintroducing
   * the N+1 this package explicitly avoids). Falls back to `doc.modified` so a brand-new
   * Opportunity with zero activity isn't misreported as infinitely stale. `null` only if neither
   * is available, which should not happen in practice since `modified` is always present.
   */
  lastActivityAt: string | null;
  staleDays: number | null;
  isStale: boolean;
};

export type PipelineKpis = {
  openCount: number;
  pipelineValue: number;
  weightedPipelineValue: number;
  /** `null` when the active set spans more than one currency — see module doc comment on why this isn't converted. */
  currency: string | null;
  expectedToCloseCount: number;
  expectedToCloseValue: number;
  overdueFollowupCount: number;
  dueTodayFollowupCount: number;
  noNextActionCount: number;
};

type OpportunityRecord = {
  name: string;
  title: string | null;
  opportunity_from: string;
  party_name: string;
  customer_name: string | null;
  status: string;
  sales_stage: string | null;
  opportunity_amount: number | null;
  probability: number | null;
  currency: string | null;
  expected_closing: string | null;
  opportunity_owner: string | null;
  territory: string | null;
  modified: string;
};

const OPPORTUNITY_FIELDS = [
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
  "territory",
  "modified",
];

/**
 * Parses an ERPNext date/datetime string (`"YYYY-MM-DD"` or `"YYYY-MM-DD HH:MM:SS.ffffff"`) and
 * floors it to local midnight — the exact same technique `lib/followupBucket.ts`'s own
 * `followupBucket()` already applies to a ToDo's due date (`new Date(dateStr)` then
 * `setHours(0,0,0,0)`). Sharing this technique (and `todayMidnight()` for "today") is a direct
 * fix for a `CRM-4` code-review finding: this file originally derived "today" via
 * `toISOString().slice(0,10)` (UTC calendar date) while `followupBucket()` used local-timezone
 * midnight, so a single pipeline row could evaluate "today" two different ways depending on
 * which field derived it.
 */
function dateFloor(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

/**
 * Bulk-fetches every open Follow-up (`ToDo`, for next-follow-up/health), every ToDo regardless
 * of status (for the stale-activity signal — see below), and every Meeting/Communication
 * *creation and modified timestamps* against every live Opportunity, then groups in JS by
 * `reference_name`/`reference_docname`. Five requests total regardless of how many Opportunities
 * exist — the same bulk-then-group shape `lib/crmActivity.ts`'s `listCrmActivities` already uses
 * for `/crm/activities`, not a new fetch pattern, and explicitly what mission brief §17 asks for
 * ("prefer bulk retrieval... avoid N+1 API architecture").
 *
 * A separate all-status ToDo fetch (rather than reusing `openFollowups` for both purposes) is a
 * direct fix for a `CRM-4` code-review finding: a Follow-up completed *today* is exactly the kind
 * of "meaningful activity" the stale signal should see, but it had already dropped out of
 * `listOpenFollowupsBulk`'s `status = "Open"` filter by the time this function ran — silently
 * making a just-worked Opportunity look stale. `listOpenFollowupsBulk` itself is left unchanged
 * (its name and existing contract — open follow-ups only — stay intact for any future caller).
 *
 * Each doctype's `modified` timestamp is fetched alongside `creation` and both are fed into the
 * recency signal — a QA finding on the first fix caught that keying on `creation` alone still
 * under-counts activity: completing an old, long-open Follow-up (or Meeting, via `CRM-3`'s
 * `completeMeetingAction`) today updates `modified`, not `creation`, so a stale-for-weeks
 * Opportunity that finally gets worked today would otherwise still read as stale until a brand
 * new activity record is created against it.
 */
async function fetchActivitySignals() {
  const [openFollowups, allFollowups, events, communications] = await Promise.all([
    listOpenFollowupsBulk("Opportunity"),
    listDocs<{ reference_name?: string; creation: string; modified: string }>("ToDo", {
      fields: ["reference_name", "creation", "modified"],
      filters: [["reference_type", "=", "Opportunity"]],
      limit: 1000,
    }),
    listDocs<{ reference_docname?: string; creation: string; modified: string }>("Event", {
      fields: ["reference_docname", "creation", "modified"],
      filters: [["reference_doctype", "=", "Opportunity"]],
      limit: 1000,
    }),
    listDocs<{ reference_name?: string; creation: string; modified: string }>("Communication", {
      fields: ["reference_name", "creation", "modified"],
      filters: [["reference_doctype", "=", "Opportunity"]],
      limit: 1000,
    }),
  ]);

  const followupsByOpportunity = new Map<string, ToDoRow[]>();
  for (const t of openFollowups) {
    if (!t.reference_name) continue;
    const list = followupsByOpportunity.get(t.reference_name) ?? [];
    list.push(t);
    followupsByOpportunity.set(t.reference_name, list);
  }

  const lastActivityByOpportunity = new Map<string, string>();
  const bump = (name: string | undefined, timestamp: string) => {
    if (!name) return;
    const current = lastActivityByOpportunity.get(name);
    if (!current || timestamp > current) lastActivityByOpportunity.set(name, timestamp);
  };
  for (const t of allFollowups) {
    bump(t.reference_name, t.creation);
    bump(t.reference_name, t.modified);
  }
  for (const e of events) {
    bump(e.reference_docname, e.creation);
    bump(e.reference_docname, e.modified);
  }
  for (const c of communications) {
    bump(c.reference_name, c.creation);
    bump(c.reference_name, c.modified);
  }

  return { followupsByOpportunity, lastActivityByOpportunity };
}

export async function getPipelineData(filters: PipelineFilters): Promise<{ rows: PipelineRow[]; kpis: PipelineKpis }> {
  const erpFilters: unknown[] = [["status", "not in", TERMINAL_STATUSES]];
  if (filters.salesStage) erpFilters.push(["sales_stage", "=", filters.salesStage]);
  if (filters.status) erpFilters.push(["status", "=", filters.status]);
  if (filters.territory) erpFilters.push(["territory", "=", filters.territory]);
  if (filters.opportunityOwner) erpFilters.push(["opportunity_owner", "=", filters.opportunityOwner]);
  if (filters.opportunityFrom) erpFilters.push(["opportunity_from", "=", filters.opportunityFrom]);

  const [opportunities, { followupsByOpportunity, lastActivityByOpportunity }] = await Promise.all([
    listDocs<OpportunityRecord>("Opportunity", {
      fields: OPPORTUNITY_FIELDS,
      filters: erpFilters,
      // Soft cap matching `listCrmActivities`'s own precedent (`lib/crmActivity.ts`) — a
      // Kanban board isn't paginated like `/crm/opportunities`'s list view, so this is the
      // effective ceiling for one workspace render. Revisit if a real tenant's active pipeline
      // ever approaches it.
      limit: 500,
      orderBy: filters.sort || "expected_closing asc",
    }),
    fetchActivitySignals(),
  ]);

  const today = todayMidnight();

  let rows: PipelineRow[] = opportunities.map((o) => {
    const openFollowups = followupsByOpportunity.get(o.name) ?? [];
    const next = pickNextFollowup(openFollowups);
    const nextFollowup = next
      ? (() => {
          const description = stripHtml(next.description ?? "");
          return {
            dueDate: next.date,
            description: description.length > 60 ? `${description.slice(0, 60)}…` : description || "Follow-up",
            bucket: followupBucket(next.date, next.status, "Open"),
          };
        })()
      : null;
    const followupHealth: FollowupBucket | "no_next_action" = nextFollowup ? nextFollowup.bucket : "no_next_action";

    const isPastExpectedClose = Boolean(o.expected_closing) && dateFloor(o.expected_closing as string).getTime() < today.getTime();
    const isClosingSoon =
      Boolean(o.expected_closing) &&
      !isPastExpectedClose &&
      daysBetween(today, dateFloor(o.expected_closing as string)) <= CLOSING_SOON_DAYS;

    const lastActivityAt = lastActivityByOpportunity.get(o.name) ?? o.modified;
    const staleDays = lastActivityAt ? daysBetween(dateFloor(lastActivityAt), today) : null;
    const isStale = staleDays !== null && staleDays >= STALE_THRESHOLD_DAYS;

    return {
      name: o.name,
      title: o.title,
      opportunity_from: o.opportunity_from,
      party_name: o.party_name,
      customer_name: o.customer_name,
      status: o.status,
      sales_stage: o.sales_stage,
      opportunity_amount: o.opportunity_amount ?? 0,
      probability: o.probability ?? 0,
      weightedValue: ((o.opportunity_amount ?? 0) * (o.probability ?? 0)) / 100,
      currency: o.currency,
      expected_closing: o.expected_closing,
      opportunity_owner: o.opportunity_owner,
      territory: o.territory,
      modified: o.modified,
      nextFollowup,
      followupHealth,
      isClosingSoon,
      isPastExpectedClose,
      lastActivityAt,
      staleDays,
      isStale,
    };
  });

  if (filters.followupHealth) {
    rows = rows.filter((r) => r.followupHealth === filters.followupHealth);
  }

  const currencies = new Set(rows.map((r) => r.currency).filter(Boolean));
  const kpis: PipelineKpis = {
    openCount: rows.length,
    pipelineValue: rows.reduce((sum, r) => sum + r.opportunity_amount, 0),
    weightedPipelineValue: rows.reduce((sum, r) => sum + r.weightedValue, 0),
    currency: currencies.size === 1 ? ([...currencies][0] as string) : null,
    expectedToCloseCount: 0,
    expectedToCloseValue: 0,
    overdueFollowupCount: rows.filter((r) => r.followupHealth === "overdue").length,
    dueTodayFollowupCount: rows.filter((r) => r.followupHealth === "due_today").length,
    noNextActionCount: rows.filter((r) => r.followupHealth === "no_next_action").length,
  };

  for (const r of rows) {
    if (r.expected_closing && !r.isPastExpectedClose && daysBetween(today, dateFloor(r.expected_closing)) <= EXPECTED_TO_CLOSE_DAYS) {
      kpis.expectedToCloseCount += 1;
      kpis.expectedToCloseValue += r.opportunity_amount;
    }
  }

  return { rows, kpis };
}

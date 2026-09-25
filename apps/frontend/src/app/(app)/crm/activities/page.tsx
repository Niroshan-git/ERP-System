import { cookies } from "next/headers";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { ActivitiesTable } from "@/components/ActivitiesTable";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { listCrmActivities, type CrmDoctype, type WorkspaceActivity } from "@/lib/crmActivity";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * `/crm/activities` — a salesperson follow-up work queue (mission brief §18), not a general
 * activity log: aggregates open Follow-ups (`ToDo`) and Meetings (`Event`) across every Lead/
 * Opportunity, bucketed Overdue/Due Today/Upcoming/Completed the same way each record's own
 * `CrmActivityPanel` derives it (`lib/crmActivity.ts`'s `followupBucket`, one shared
 * definition, not reimplemented here). Call/Note remain visible only on each record's own
 * timeline — see `listCrmActivities`'s doc comment for why they're not aggregated here.
 */

type SearchParams = {
  view?: string;
  mine?: string;
  type?: string;
  related?: string;
  assigned_to?: string;
};

const VIEWS = [
  { id: "open", label: "All Open" },
  { id: "overdue", label: "Overdue" },
  { id: "due_today", label: "Due Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
] as const;

export default async function CrmActivitiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const view = VIEWS.some((v) => v.id === params.view) ? params.view! : "open";
  const mine = params.mine === "1";

  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  const assignedTo = mine ? session?.email : params.assigned_to || undefined;

  const [allActivities, users] = await Promise.all([
    listCrmActivities({
      relatedDoctype: (params.related as CrmDoctype) || undefined,
      assignedTo,
      kind: params.type === "followup" || params.type === "meeting" ? params.type : undefined,
    }),
    fetchLinkOptions("User"),
  ]);

  const activities: WorkspaceActivity[] = allActivities.filter((a) =>
    view === "open" ? a.bucket !== "completed" : a.bucket === view,
  );

  const filterFields: FilterFieldConfig[] = [
    { type: "select", name: "type", label: "Activity Type", options: ["followup", "meeting"] },
    { type: "select", name: "related", label: "Related Type", options: ["Lead", "Opportunity"] },
    { type: "select", name: "assigned_to", label: "Assigned To", options: users ?? [] },
  ];

  function viewHref(v: string) {
    const p = new URLSearchParams();
    p.set("view", v);
    if (mine) p.set("mine", "1");
    if (params.type) p.set("type", params.type);
    if (params.related) p.set("related", params.related);
    if (params.assigned_to) p.set("assigned_to", params.assigned_to);
    return `?${p.toString()}`;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "CRM", href: "/crm" }, { label: "Activities" }]} />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Activities</h1>
        {session?.email && (
          <a
            href={`?view=${view}&mine=${mine ? "0" : "1"}`}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              mine ? "border-signal bg-signal/10 text-signal" : "border-border text-graphite-900 hover:bg-surface"
            }`}
          >
            {mine ? "Showing my activities" : "Show only my activities"}
          </a>
        )}
      </div>

      <div className="mb-4 flex gap-2 border-b border-border">
        {VIEWS.map((v) => (
          <a
            key={v.id}
            href={viewHref(v.id)}
            className={`-mb-px border-b-2 px-1 py-2 text-sm font-medium ${
              view === v.id ? "border-signal text-graphite-900" : "border-transparent text-graphite-500 hover:text-graphite-900"
            }`}
          >
            {v.label}
          </a>
        ))}
      </div>

      <ListFilterBar
        fields={filterFields}
        sortOptions={[{ value: "date asc", label: "Due date (soonest)" }]}
        values={params}
      />

      <ActivitiesTable activities={activities} />
    </div>
  );
}

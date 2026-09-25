import "server-only";
import { listDocs } from "@/lib/erpnext";
import { buildTimeline, stripHtml } from "@/lib/timeline";
import { followupBucket, type FollowupBucket } from "@/lib/followupBucket";

export { followupBucket, BUCKET_DISPLAY } from "@/lib/followupBucket";
export type { FollowupBucket } from "@/lib/followupBucket";

/**
 * CRM-3 activity architecture — native mechanisms only, no parallel activity doctype.
 * Mapping verified live against the real Hetzner instance
 * (`mcp__ceylon-stack__get_doctype_fields`) before this file was written, and documented in
 * `docs/backend/16-crm/crm-architecture.md`'s CRM-3 section:
 *
 * - **Call**      → `Communication` (`communication_medium: "Phone"`) — the same doctype
 *   ERPNext's own Desk "Log a Call" affordance uses; has subject/content/date/status/
 *   sent_or_received, reference_doctype/reference_name.
 * - **Meeting**    → `Event` (`event_category: "Meeting"`) — calendar entity, starts_on/
 *   ends_on, reference_doctype/reference_docname.
 * - **Follow-up**  → `ToDo` — generic Frappe assignment/task, reference_type/reference_name,
 *   `date` (due date), `status` (Open/Closed/Cancelled), `allocated_to`.
 * - **Note**       → `CRM Note` — a real, CRM-specific *child table* already present as the
 *   `notes` field on Lead/Opportunity (not a standalone doctype — no reference_type/
 *   reference_name of its own, always read/written through the parent document).
 * - **Comment / edit history** → the existing `lib/timeline.ts` (`buildTimeline`, `Comment` +
 *   `Version` + created/modified) — unchanged, merged in here rather than duplicated.
 *
 * Three different doctypes, three different reference-field name pairs
 * (`reference_type`/`reference_name` on ToDo, `reference_doctype`/`reference_docname` on
 * Event, `reference_doctype`/`reference_name` on Communication) — not a typo, each is the
 * real live schema.
 */

export type CrmDoctype = "Lead" | "Opportunity";

export type CrmActivityKind = "call" | "meeting" | "followup" | "note" | "system";

export type CrmTimelineEntry = {
  id: string;
  kind: CrmActivityKind;
  timestamp: string;
  subject: string;
  description?: string;
  status?: string;
  dueDate?: string;
  relatedDoctype: CrmDoctype;
  relatedName: string;
  createdBy?: string;
  assignedTo?: string;
  /** Only set for kind "followup" — the real ToDo name, needed by the Complete action. */
  todoName?: string;
};

export type ToDoRow = {
  name: string;
  description: string;
  date?: string;
  status: string;
  priority?: string;
  allocated_to?: string;
  assigned_by?: string;
  reference_type?: string;
  reference_name?: string;
  creation: string;
  owner: string;
};

export type EventRow = {
  name: string;
  subject: string;
  event_category?: string;
  starts_on: string;
  ends_on?: string;
  description?: string;
  status: string;
  reference_doctype?: string;
  reference_docname?: string;
  creation: string;
  owner: string;
};

export type CommunicationRow = {
  name: string;
  subject: string;
  content?: string;
  communication_medium?: string;
  status: string;
  sent_or_received: string;
  communication_date?: string;
  reference_doctype?: string;
  reference_name?: string;
  creation: string;
  owner: string;
};

export type CrmNoteRow = { name?: string; note: string; added_by?: string; added_on?: string };

const TODO_FIELDS = [
  "name",
  "description",
  "date",
  "status",
  "priority",
  "allocated_to",
  "assigned_by",
  "reference_type",
  "reference_name",
  "creation",
  "owner",
];

const EVENT_FIELDS = [
  "name",
  "subject",
  "event_category",
  "starts_on",
  "ends_on",
  "description",
  "status",
  "reference_doctype",
  "reference_docname",
  "creation",
  "owner",
];

const COMMUNICATION_FIELDS = [
  "name",
  "subject",
  "content",
  "communication_medium",
  "status",
  "sent_or_received",
  "communication_date",
  "reference_doctype",
  "reference_name",
  "creation",
  "owner",
];

export async function listOpenFollowups(doctype: CrmDoctype, name: string): Promise<ToDoRow[]> {
  return listDocs<ToDoRow>("ToDo", {
    fields: TODO_FIELDS,
    filters: [
      ["reference_type", "=", doctype],
      ["reference_name", "=", name],
      ["status", "=", "Open"],
    ],
    orderBy: "date asc",
    limit: 100,
  });
}

/**
 * "Next actionable follow-up" — derived from open ToDo records, not stored anywhere. Earliest
 * due date wins; an open follow-up with no due date at all is surfaced only if nothing dated
 * exists, so a real deadline always takes priority over an unscheduled one. Returns null when
 * there is no open follow-up — the caller renders an explicit "No follow-up scheduled" state
 * rather than treating this as an error.
 */
export async function getNextFollowup(doctype: CrmDoctype, name: string): Promise<ToDoRow | null> {
  const open = await listOpenFollowups(doctype, name);
  if (open.length === 0) return null;
  const dated = open.filter((t) => t.date).sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : 0));
  return dated[0] ?? open[0];
}

/**
 * The unified per-record CRM timeline: native ToDo/Event/Communication/CRM-Note activity
 * records merged with the existing generic Comment/Version timeline (`buildTimeline`,
 * unchanged) into one normalized, newest-first feed. This is a read-time aggregation only —
 * nothing here is persisted; each native record remains the sole source of truth for its own
 * data (mission brief §6/§22).
 */
export async function getCrmActivityTimeline(
  doctype: CrmDoctype,
  name: string,
  doc: { creation: string; owner: string; modified: string; modified_by: string; notes?: CrmNoteRow[] },
): Promise<CrmTimelineEntry[]> {
  const [systemEntries, todos, events, communications] = await Promise.all([
    buildTimeline(doctype, name, doc),
    listDocs<ToDoRow>("ToDo", {
      fields: TODO_FIELDS,
      filters: [
        ["reference_type", "=", doctype],
        ["reference_name", "=", name],
      ],
      orderBy: "creation desc",
      limit: 200,
    }),
    listDocs<EventRow>("Event", {
      fields: EVENT_FIELDS,
      filters: [
        ["reference_doctype", "=", doctype],
        ["reference_docname", "=", name],
      ],
      orderBy: "creation desc",
      limit: 200,
    }),
    listDocs<CommunicationRow>("Communication", {
      fields: COMMUNICATION_FIELDS,
      filters: [
        ["reference_doctype", "=", doctype],
        ["reference_name", "=", name],
      ],
      orderBy: "creation desc",
      limit: 200,
    }),
  ]);

  const entries: CrmTimelineEntry[] = [];

  for (const e of systemEntries) {
    entries.push({
      id: e.id,
      kind: "system",
      timestamp: e.creation,
      subject: e.content,
      relatedDoctype: doctype,
      relatedName: name,
    });
  }

  for (const t of todos) {
    const description = stripHtml(t.description ?? "");
    entries.push({
      id: `todo-${t.name}`,
      kind: "followup",
      timestamp: t.creation,
      subject: description.length > 80 ? `${description.slice(0, 80)}…` : description || "Follow-up",
      description,
      status: t.status,
      dueDate: t.date,
      relatedDoctype: doctype,
      relatedName: name,
      createdBy: t.owner,
      assignedTo: t.allocated_to,
      todoName: t.name,
    });
  }

  for (const ev of events) {
    entries.push({
      id: `event-${ev.name}`,
      kind: "meeting",
      timestamp: ev.starts_on || ev.creation,
      subject: ev.subject,
      description: stripHtml(ev.description ?? ""),
      status: ev.status,
      dueDate: ev.starts_on,
      relatedDoctype: doctype,
      relatedName: name,
      createdBy: ev.owner,
    });
  }

  for (const c of communications) {
    entries.push({
      id: `comm-${c.name}`,
      kind: "call",
      timestamp: c.communication_date || c.creation,
      subject: c.subject,
      description: stripHtml(c.content ?? ""),
      status: c.status,
      relatedDoctype: doctype,
      relatedName: name,
      createdBy: c.owner,
    });
  }

  for (const n of doc.notes ?? []) {
    entries.push({
      id: `note-${n.name ?? n.added_on ?? Math.random()}`,
      kind: "note",
      timestamp: n.added_on || doc.creation,
      subject: "Note",
      description: stripHtml(n.note ?? ""),
      relatedDoctype: doctype,
      relatedName: name,
      createdBy: n.added_by,
    });
  }

  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return entries;
}

/**
 * `/crm/activities` workspace data source — a salesperson work queue, not a general activity
 * log. Deliberately limited to Follow-up (ToDo) and Meeting (Event): both carry a real due/
 * scheduled date a bucket can be derived from. Call (Communication) and Note (`CRM Note`) are
 * always already-completed log entries with no due-state of their own (mission brief §7/§12 —
 * Communication is "visible where native records already exist", not itself a follow-up
 * mechanism) and Note has no reference_type/reference_name of its own to query across records
 * by (it's a pure child table, §8) — both remain visible on each record's own timeline, just
 * not aggregated into this cross-record workspace. This keeps the workspace a follow-up
 * execution queue, not a project-management module (mission brief §18).
 */
export type WorkspaceActivity = {
  id: string;
  kind: "followup" | "meeting";
  docName: string;
  subject: string;
  status: string;
  dueDate?: string;
  bucket: FollowupBucket;
  relatedDoctype: CrmDoctype;
  relatedName: string;
  assignedTo?: string;
  createdBy?: string;
};

export async function listCrmActivities(filters: {
  relatedDoctype?: CrmDoctype;
  assignedTo?: string;
  kind?: "followup" | "meeting";
}): Promise<WorkspaceActivity[]> {
  const doctypes: CrmDoctype[] = filters.relatedDoctype ? [filters.relatedDoctype] : ["Lead", "Opportunity"];

  const followupRows =
    filters.kind && filters.kind !== "followup"
      ? []
      : (
          await Promise.all(
            doctypes.map((dt) => {
              const f: unknown[] = [["reference_type", "=", dt]];
              if (filters.assignedTo) f.push(["allocated_to", "=", filters.assignedTo]);
              return listDocs<ToDoRow>("ToDo", { fields: TODO_FIELDS, filters: f, orderBy: "date asc", limit: 500 }).then(
                (rows) => rows.map((r) => ({ row: r, relatedDoctype: dt })),
              );
            }),
          )
        ).flat();

  const meetingRows =
    filters.kind && filters.kind !== "meeting"
      ? []
      : (
          await Promise.all(
            doctypes.map((dt) =>
              listDocs<EventRow>("Event", {
                fields: EVENT_FIELDS,
                filters: [["reference_doctype", "=", dt]],
                orderBy: "starts_on asc",
                limit: 500,
              }).then((rows) => rows.map((r) => ({ row: r, relatedDoctype: dt }))),
            ),
          )
        ).flat();

  const activities: WorkspaceActivity[] = [];

  for (const { row, relatedDoctype } of followupRows) {
    if (!row.reference_name) continue;
    const description = stripHtml(row.description ?? "");
    activities.push({
      id: `todo-${row.name}`,
      kind: "followup",
      docName: row.name,
      subject: description.length > 100 ? `${description.slice(0, 100)}…` : description || "Follow-up",
      status: row.status,
      dueDate: row.date,
      bucket: followupBucket(row.date, row.status, "Open"),
      relatedDoctype,
      relatedName: row.reference_name,
      assignedTo: row.allocated_to,
      createdBy: row.owner,
    });
  }

  for (const { row, relatedDoctype } of meetingRows) {
    if (!row.reference_docname) continue;
    activities.push({
      id: `event-${row.name}`,
      kind: "meeting",
      docName: row.name,
      subject: row.subject,
      status: row.status,
      dueDate: row.starts_on,
      bucket: followupBucket(row.starts_on, row.status, "Open"),
      relatedDoctype,
      relatedName: row.reference_docname,
      createdBy: row.owner,
    });
  }

  activities.sort((a, b) => {
    const ad = a.dueDate ?? "9999";
    const bd = b.dueDate ?? "9999";
    return ad < bd ? -1 : ad > bd ? 1 : 0;
  });
  return activities;
}

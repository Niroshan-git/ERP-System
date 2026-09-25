"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { CompleteActivityButton } from "@/components/CompleteActivityButton";
import { completeFollowupAction, completeMeetingAction } from "@/lib/actions/crmActivity";
import { BUCKET_DISPLAY } from "@/lib/followupBucket";
import type { WorkspaceActivity } from "@/lib/crmActivity";
import type { ColumnDef } from "@/lib/tableColumns";

const boundCompleteFollowup = completeFollowupAction.bind(null, "/crm/activities");
const boundCompleteMeeting = completeMeetingAction.bind(null, "/crm/activities");

const columns: ColumnDef<WorkspaceActivity>[] = [
  {
    key: "kind",
    label: "Type",
    core: true,
    render: (a) => <span className="text-graphite-900">{a.kind === "followup" ? "Follow-up" : "Meeting"}</span>,
  },
  {
    key: "subject",
    label: "Subject",
    core: true,
    render: (a) => <span className="text-graphite-900">{a.subject}</span>,
  },
  {
    key: "related",
    label: "Related To",
    core: true,
    render: (a) => (
      <Link
        href={`/crm/${a.relatedDoctype === "Lead" ? "leads" : "opportunities"}/${encodeURIComponent(a.relatedName)}`}
        className="font-mono text-signal hover:underline"
      >
        {a.relatedName}
      </Link>
    ),
    exportValue: (a) => a.relatedName,
  },
  {
    key: "dueDate",
    label: "Due / Starts",
    core: true,
    render: (a) => <span className="text-graphite-500">{a.dueDate || "—"}</span>,
  },
  {
    key: "bucket",
    label: "Status",
    core: true,
    render: (a) => <StatusPill label={BUCKET_DISPLAY[a.bucket].label} tone={BUCKET_DISPLAY[a.bucket].tone} />,
    exportValue: (a) => BUCKET_DISPLAY[a.bucket].label,
  },
  {
    key: "assignedTo",
    label: "Assigned To",
    defaultVisible: false,
    render: (a) => <span className="text-graphite-500">{a.assignedTo || "—"}</span>,
  },
  {
    key: "action",
    label: "",
    core: true,
    render: (a) =>
      a.bucket !== "completed" ? (
        <CompleteActivityButton
          docName={a.docName}
          action={a.kind === "followup" ? boundCompleteFollowup : boundCompleteMeeting}
        />
      ) : null,
  },
];

export function ActivitiesTable({ activities }: { activities: WorkspaceActivity[] }) {
  return <DataTable tableId="activities" columns={columns} rows={activities} getRowKey={(a) => a.id} emptyLabel="No activities match these filters." />;
}

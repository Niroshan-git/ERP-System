import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { DocField } from "@/components/DocField";
import { StatusPill } from "@/components/StatusPill";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { jobCardStatus } from "@/lib/erpStatus";
import type { DocStatus } from "@/lib/docStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

type JobCardTimeLogRow = {
  employee?: string;
  from_time?: string;
  to_time?: string;
  time_in_mins?: number;
  completed_qty?: number;
};

type JobCardDoc = {
  name: string;
  docstatus: DocStatus;
  status?: string;
  work_order: string;
  operation?: string;
  workstation?: string;
  bom_no?: string;
  production_item?: string;
  for_quantity?: number;
  pending_qty?: number;
  total_completed_qty?: number;
  process_loss_qty?: number;
  is_paused?: 0 | 1;
  is_corrective_job_card?: 0 | 1;
  expected_start_date?: string;
  expected_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  quality_inspection_template?: string;
  quality_inspection?: string;
  time_logs?: JobCardTimeLogRow[];
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
};

const cell = "px-3 py-2";
const plainTableWrap = "overflow-x-auto rounded-xl border border-border bg-surface";
const plainTableHead = "border-b border-border bg-canvas text-graphite-500";

/** Internal document link — same visual treatment as every list table's ID column, reused
 * here for field-level references (Work Order/BOM) rather than a row/column ID. Same local
 * pattern as `manufacturing/work-orders/[name]/page.tsx`'s `DocLink` — not extracted to a
 * shared component, matching this codebase's existing per-file convention. */
function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-mono text-signal hover:underline">
      {children}
    </Link>
  );
}

/**
 * `MFG-JOBCARD-1` — read-only. No Start/Pause/Resume/Complete/Cancel actions; those are
 * `MFG-JOBCARD-2`/`MFG-JOBCARD-LC-1`. `items`/`secondary_items`/`sub_operations`/
 * `scheduled_time_logs` child tables (real, per `docs/backend/05-manufacturing/job-card.md`)
 * are deliberately not fetched/rendered here — on this instance's real data they're
 * consistently empty (no semi-finished-goods tracking or sub-operations configured on either
 * real Operation master), so showing them would be empty noise for the current operator
 * experience; revisit once real data actually populates them.
 */
export default async function JobCardDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: JobCardDoc;
  try {
    doc = await getDoc<JobCardDoc>("Job Card", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [timeline, session] = await Promise.all([
    buildTimeline("Job Card", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
  ]);

  const status = jobCardStatus(doc);

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Manufacturing", href: "/manufacturing" },
        { label: "Job Cards", href: "/manufacturing/job-cards" },
        { label: doc.name },
      ]}
    />
  );

  const header = (
    <div className="mb-4">
      <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
      <div className="mt-1">
        <StatusPill label={status.label} tone={status.tone} />
      </div>
    </div>
  );

  const timeLogs = doc.time_logs ?? [];

  const detailsTab = (
    <div>
      <dl className="mb-6 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <DocField label="Work Order" value={<DocLink href={`/manufacturing/work-orders/${encodeURIComponent(doc.work_order)}`}>{doc.work_order}</DocLink>} />
        <DocField label="Operation" value={doc.operation || "—"} />
        <DocField label="Workstation" value={doc.workstation || "—"} />
        {doc.bom_no && (
          <DocField label="BOM" value={<DocLink href={`/master-data/boms/${encodeURIComponent(doc.bom_no)}`}>{doc.bom_no}</DocLink>} />
        )}
        {doc.production_item && <DocField label="Production Item" value={doc.production_item} mono />}
        <DocField label="For Qty" value={doc.for_quantity ?? "—"} mono />
        <DocField label="Completed Qty" value={doc.total_completed_qty ?? 0} mono />
        <DocField label="Pending Qty" value={doc.pending_qty ?? "—"} mono />
        {(doc.process_loss_qty ?? 0) > 0 && <DocField label="Process Loss Qty" value={doc.process_loss_qty} mono />}
        <DocField label="Expected Start" value={doc.expected_start_date || "—"} mono />
        <DocField label="Expected End" value={doc.expected_end_date || "—"} mono />
        <DocField label="Actual Start" value={doc.actual_start_date || "—"} mono />
        <DocField label="Actual End" value={doc.actual_end_date || "—"} mono />
        {doc.quality_inspection_template && <DocField label="Quality Inspection Template" value={doc.quality_inspection_template} mono />}
        {doc.quality_inspection && <DocField label="Quality Inspection" value={doc.quality_inspection} mono />}
        {doc.is_corrective_job_card === 1 && <DocField label="Corrective Job Card" value="Yes" />}
        {doc.is_paused === 1 && <DocField label="On Hold" value="Yes" />}
      </dl>

      <h2 className="mb-2 text-sm font-semibold text-graphite-900">Time Logs</h2>
      <div className={plainTableWrap}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={plainTableHead}>
              <th className={`${cell} font-semibold`}>Employee</th>
              <th className={`${cell} font-semibold`}>From</th>
              <th className={`${cell} font-semibold`}>To</th>
              <th className={`${cell} text-right font-semibold`}>Minutes</th>
              <th className={`${cell} text-right font-semibold`}>Completed Qty</th>
            </tr>
          </thead>
          <tbody>
            {timeLogs.map((log, idx) => (
              // Time Log child rows have no natural unique id surfaced in this fetch — index
              // key is safe here since this is a static, non-reorderable read-only render.
              <tr key={idx} className="border-b border-border last:border-0">
                <td className={`${cell} text-graphite-900`}>{log.employee || "—"}</td>
                <td className={`${cell} font-mono text-graphite-500`}>{log.from_time || "—"}</td>
                <td className={`${cell} font-mono text-graphite-500`}>{log.to_time || "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{log.time_in_mins ?? "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{log.completed_qty ?? "—"}</td>
              </tr>
            ))}
            {timeLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-graphite-500">
                  No time logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(null, "Job Card", doc.name, `/manufacturing/job-cards/${encodeURIComponent(doc.name)}`)}
    />
  );

  return (
    <div>
      {breadcrumb}
      {header}
      <DocTabs
        tabs={[
          { id: "details", label: "Details", content: detailsTab },
          { id: "comments", label: "Comments", content: commentsTab },
        ]}
      />
    </div>
  );
}

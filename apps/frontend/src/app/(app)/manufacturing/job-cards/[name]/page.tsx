import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { DocActionBar } from "@/components/DocActionBar";
import { DocField } from "@/components/DocField";
import { JobCardExecutionPanel } from "@/components/JobCardExecutionPanel";
import { StatusPill } from "@/components/StatusPill";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import { jobCardExecutionState, jobCardStatus } from "@/lib/erpStatus";
import type { DocStatus } from "@/lib/docStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { cancelJobCardAction, completeJobCardAction, startJobCardAction } from "../actions";

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
 * `MFG-JOBCARD-1` shipped read-only; Cancel (`MFG-JOBCARD-LC-1`) added on top of it — native
 * `cancelDoc("Job Card", name)` via `cancelJobCardAction`, same no-cascade pattern as
 * Work Order/BOM cancel. Start/Complete (`MFG-JC-EXEC-1`, narrow dated Manufacturing-freeze
 * exception resolving E2E-1 finding D7) added on top of that — `jobCardExecutionState()` decides
 * which of `JobCardExecutionPanel`'s two forms to render, calling ERPNext's own `start_timer`/
 * `complete_job_card` whitelisted methods rather than a Ceylon-Stack-invented state machine.
 * Pause/Resume are deliberately not built — out of the mission's own "minimum flow" scope, not a
 * missed case. `items`/`secondary_items`/`sub_operations`/`scheduled_time_logs` child tables
 * (real, per `docs/backend/05-manufacturing/job-card.md`) are deliberately not fetched/rendered
 * here — on this instance's real data they're consistently empty (no semi-finished-goods
 * tracking or sub-operations configured on either real Operation master), so showing them would
 * be empty noise for the current operator experience; revisit once real data actually populates
 * them.
 */
export default async function JobCardDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ cancelled?: string; started?: string; completed?: string }>;
}) {
  const { name } = await params;
  const { cancelled, started, completed } = await searchParams;

  let doc: JobCardDoc;
  try {
    doc = await getDoc<JobCardDoc>("Job Card", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const execState = jobCardExecutionState(doc);

  const [timeline, session, activeEmployees] = await Promise.all([
    buildTimeline("Job Card", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    // Only fetched when actually offering the Start form — same "don't pay for a query the page
    // doesn't need" shape as the Work Order Job Cards tab's Cancel-blocker preview.
    execState === "can-start"
      ? listDocs<{ name: string; employee_name?: string }>("Employee", {
          fields: ["name", "employee_name"],
          filters: [["status", "=", "Active"]],
          limit: 100,
        })
      : Promise.resolve([]),
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
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1">
          <StatusPill label={status.label} tone={status.tone} />
        </div>
      </div>
      {doc.docstatus === 1 && (
        <DocActionBar
          action={cancelJobCardAction.bind(null, doc.name)}
          label="Cancel Job Card"
          pendingLabel="Cancelling…"
          variant="danger"
        />
      )}
    </div>
  );

  const timeLogs = doc.time_logs ?? [];
  const remainingQty = (doc.for_quantity ?? 0) - (doc.total_completed_qty ?? 0);

  const executionSection = execState !== "none" && (
    <div className="mb-6">
      <JobCardExecutionPanel
        mode={execState}
        remainingQty={remainingQty}
        activeEmployees={activeEmployees}
        startAction={startJobCardAction.bind(null, doc.name)}
        completeAction={completeJobCardAction.bind(null, doc.name)}
      />
    </div>
  );

  const detailsTab = (
    <div>
      {executionSection}
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
      {cancelled && (
        <div className="mb-4 rounded-md border border-border bg-canvas px-4 py-2 text-sm font-medium text-graphite-700">
          Job Card cancelled.
        </div>
      )}
      {started && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success">
          Job Card started.
        </div>
      )}
      {completed && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success">
          Job Card completed and submitted.
        </div>
      )}
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

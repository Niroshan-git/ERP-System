import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { DocActionBar } from "@/components/DocActionBar";
import { DocField } from "@/components/DocField";
import { StatusPill } from "@/components/StatusPill";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { ProgressBar } from "@/components/ProgressBar";
import { StockBadge } from "@/components/StockBadge";
import { getConnections, type Connection } from "@/lib/connections";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import {
  canCancelWorkOrder,
  canCompleteProduction,
  canTransferMaterials,
  jobCardStatus,
  workOrderStatus,
} from "@/lib/erpStatus";
import type { DocStatus } from "@/lib/docStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { cancelWorkOrderAction, submitWorkOrderAction } from "../actions";

type WorkOrderItemRow = {
  item_code: string;
  item_name?: string;
  source_warehouse?: string;
  required_qty: number;
  transferred_qty?: number;
  consumed_qty?: number;
  stock_uom?: string;
  is_additional_item?: 0 | 1;
};

type WorkOrderOperationRow = {
  operation: string;
  workstation?: string;
  status?: string;
  completed_qty?: number;
  time_in_mins?: number;
  batch_size?: number;
  planned_start_time?: string;
  planned_end_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
};

type WorkOrderDoc = {
  name: string;
  status: string;
  company: string;
  production_item: string;
  item_name?: string;
  stock_uom?: string;
  bom_no?: string;
  qty: number;
  produced_qty?: number;
  process_loss_qty?: number;
  sales_order?: string;
  project?: string;
  source_warehouse?: string;
  wip_warehouse?: string;
  fg_warehouse?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  required_items?: WorkOrderItemRow[];
  operations?: WorkOrderOperationRow[];
  docstatus: number;
  skip_transfer?: 0 | 1;
  transfer_material_against?: string;
  track_semi_finished_goods?: 0 | 1;
};

/** Material Transfer for Manufacture Stock Entries linked to this Work Order (Package 5) —
 * bounded query, same shape as the Job Card fetch above. */
type MaterialTransferRow = {
  name: string;
  docstatus: number;
  posting_date?: string;
  purpose?: string;
};

/**
 * Job Card fields pulled for the Related Job Cards table AND Quality Readiness (below) —
 * one bounded `listDocs` call covers both, no per-row/extra requests. `quality_inspection`/
 * `quality_inspection_template` are Job Card's own direct fields (confirmed via
 * `get_doctype_fields`), not an inference from the production Item's own template — see the
 * Quality Readiness section's doc comment for why that distinction matters.
 */
type JobCardRow = {
  name: string;
  docstatus: DocStatus;
  status?: string;
  operation?: string;
  workstation?: string;
  for_quantity?: number;
  total_completed_qty?: number;
  expected_start_date?: string;
  expected_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  quality_inspection_template?: string;
  quality_inspection?: string;
};

const cell = "px-3 py-2";
const plainTableWrap = "overflow-x-auto rounded-xl border border-border bg-surface";
const plainTableHead = "border-b border-border bg-canvas text-graphite-500";

/** Internal document link — same visual treatment as every list table's ID column, reused
 * here for field-level references (Item/Warehouse/Sales Order) rather than a row/column ID. */
function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-mono text-signal hover:underline">
      {children}
    </Link>
  );
}

export default async function WorkOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ transferred?: string; produced?: string; cancelled?: string }>;
}) {
  const { name } = await params;
  const { transferred, produced, cancelled } = await searchParams;

  let doc: WorkOrderDoc;
  try {
    doc = await getDoc<WorkOrderDoc>("Work Order", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [jobCards, materialTransfers, manufactureEntries, timeline, session, connections] = await Promise.all([
    listDocs<JobCardRow>("Job Card", {
      fields: [
        "name",
        "docstatus",
        "status",
        "operation",
        "workstation",
        "for_quantity",
        "total_completed_qty",
        "expected_start_date",
        "expected_end_date",
        "actual_start_date",
        "actual_end_date",
        "quality_inspection_template",
        "quality_inspection",
      ],
      filters: [["work_order", "=", doc.name]],
      limit: 50,
      orderBy: "creation asc",
    }),
    listDocs<MaterialTransferRow>("Stock Entry", {
      fields: ["name", "docstatus", "posting_date", "purpose"],
      filters: [
        ["work_order", "=", doc.name],
        ["purpose", "=", "Material Transfer for Manufacture"],
      ],
      limit: 50,
      orderBy: "creation desc",
    }),
    listDocs<MaterialTransferRow>("Stock Entry", {
      fields: ["name", "docstatus", "posting_date", "purpose"],
      filters: [
        ["work_order", "=", doc.name],
        ["purpose", "=", "Manufacture"],
      ],
      limit: 50,
      orderBy: "creation desc",
    }),
    buildTimeline("Work Order", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    // Cancel dependency guard (MFG-WO-LC-1) — only meaningful once Submitted; re-derived
    // server-side again inside `cancelWorkOrderAction` before it actually cancels anything, so
    // this is a UI-only preview, not the enforcement point — same "preview here, real check in
    // the action" pattern `cancelBomAction`/`cancelProductionPlanAction` already established.
    doc.docstatus === 1 ? getConnections("Work Order", doc.name) : Promise.resolve<Connection[]>([]),
  ]);

  const status = workOrderStatus(doc);
  const transferEligibility = canTransferMaterials(doc);
  const productionEligibility = canCompleteProduction(doc);
  const cancelEligibility = canCancelWorkOrder(doc);
  const cancelBlocking = connections.filter((c) => (c.submittedDocs?.length ?? 0) > 0);
  const producedQty = doc.produced_qty ?? 0;
  const remaining = Math.max(doc.qty - producedQty, 0);
  const progressPct = doc.qty > 0 ? (producedQty / doc.qty) * 100 : 0;

  const progressSection = (
    <div className="mb-6 rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-2 text-sm font-semibold text-graphite-900">Production Progress</h2>
      <p className="mb-2 text-sm text-graphite-500">
        <span className="font-mono text-graphite-900">{producedQty}</span> /{" "}
        <span className="font-mono text-graphite-900">{doc.qty}</span> {doc.stock_uom || "units"} produced
      </p>
      <ProgressBar value={progressPct} />
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <DocField label="Required" value={String(doc.qty)} mono />
        <DocField label="Produced" value={String(producedQty)} mono />
        <DocField label="Process loss" value={String(doc.process_loss_qty ?? 0)} mono />
        <DocField label="Remaining" value={String(remaining)} mono />
      </dl>
    </div>
  );

  const itemCell = (
    <DocLink href={`/master-data/items/${encodeURIComponent(doc.production_item)}`}>
      {doc.item_name || doc.production_item}
      {doc.item_name && doc.item_name !== doc.production_item && (
        <span className="ml-1 text-graphite-500">({doc.production_item})</span>
      )}
    </DocLink>
  );

  const productionInfoSection = (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-graphite-900">Production Information</h2>
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <DocField label="Production Item" value={itemCell} />
        <DocField
          label="BOM"
          value={
            doc.bom_no ? (
              <DocLink href={`/master-data/boms/${encodeURIComponent(doc.bom_no)}`}>{doc.bom_no}</DocLink>
            ) : (
              "—"
            )
          }
          mono
        />
        <DocField label="Quantity" value={`${doc.qty} ${doc.stock_uom || ""}`.trim()} mono />
        <DocField label="Company" value={doc.company} />
        {doc.project && <DocField label="Project" value={doc.project} />}
        {doc.sales_order && (
          <DocField label="Sales Order" value={<DocLink href={`/sales/orders/${encodeURIComponent(doc.sales_order)}`}>{doc.sales_order}</DocLink>} />
        )}
        {doc.source_warehouse && (
          <DocField
            label="Source Warehouse"
            value={<DocLink href={`/master-data/warehouses/${encodeURIComponent(doc.source_warehouse)}`}>{doc.source_warehouse}</DocLink>}
          />
        )}
        {doc.wip_warehouse && (
          <DocField
            label="WIP Warehouse"
            value={<DocLink href={`/master-data/warehouses/${encodeURIComponent(doc.wip_warehouse)}`}>{doc.wip_warehouse}</DocLink>}
          />
        )}
        {doc.fg_warehouse && (
          <DocField
            label="Target Warehouse"
            value={<DocLink href={`/master-data/warehouses/${encodeURIComponent(doc.fg_warehouse)}`}>{doc.fg_warehouse}</DocLink>}
          />
        )}
        <DocField label="Planned start" value={doc.planned_start_date || "—"} mono />
        <DocField label="Planned end" value={doc.planned_end_date || "—"} mono />
        <DocField label="Actual start" value={doc.actual_start_date || "—"} mono />
        <DocField label="Actual end" value={doc.actual_end_date || "—"} mono />
      </dl>
    </div>
  );

  const detailsTab = (
    <div>
      {progressSection}
      {productionInfoSection}
    </div>
  );

  /**
   * Required/Transferred/Remaining/Additional/Source/Readiness (Package 5) — Transfer ≠
   * Consumption, kept visually and semantically distinct throughout (the "Consumed" column
   * name is never reused for "Transferred", per the mission's explicit rule); `Readiness`
   * reuses the same `StockBadge` the transfer screen itself uses, not a separate stock
   * calculation. `is_additional_item` is Work Order Item's own real field (set by ERPNext
   * itself when a Material Transfer for Manufacture Stock Entry adds a non-BOM item — see
   * PROGRESS.md's Package 4 investigation), never inferred client-side.
   */
  const materialsTab = (
    <div>
      <div className={plainTableWrap}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={plainTableHead}>
              <th className={`${cell} font-semibold`}>Item</th>
              <th className={`${cell} text-right font-semibold`}>Required</th>
              <th className={`${cell} text-right font-semibold`}>Transferred</th>
              <th className={`${cell} text-right font-semibold`}>Remaining</th>
              <th className={`${cell} text-right font-semibold`}>Consumed</th>
              <th className={`${cell} font-semibold`}>Source</th>
              <th className={`${cell} font-semibold`}>Readiness</th>
            </tr>
          </thead>
          <tbody>
            {(doc.required_items ?? []).map((ri, i) => {
              const transferredQty = ri.transferred_qty ?? 0;
              const remaining = Math.max(ri.required_qty - transferredQty, 0);
              // Keyed by row index, not item_code — Work Order Item duplicates are a
              // live-confirmed real possibility (item substitution leaving two rows with the
              // same item_code, see PROGRESS.md's Package 4 investigation), which would
              // otherwise collide as a React key (governance-closure finding, CX-MFG-006).
              return (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className={cell}>
                    {ri.is_additional_item ? (
                      <span className="mr-2 rounded bg-alert/10 px-1.5 py-0.5 text-xs font-semibold text-alert">
                        ADDITIONAL
                      </span>
                    ) : null}
                    <span className="text-graphite-900">
                      {ri.item_code} — {ri.item_name || ri.item_code}
                    </span>
                  </td>
                  <td className={`${cell} text-right font-mono tabular-nums`}>
                    {ri.required_qty} {ri.stock_uom || ""}
                  </td>
                  <td className={`${cell} text-right font-mono tabular-nums`}>{transferredQty}</td>
                  <td className={`${cell} text-right font-mono tabular-nums`}>{remaining}</td>
                  <td className={`${cell} text-right font-mono tabular-nums`}>{ri.consumed_qty ?? 0}</td>
                  <td className={cell}>
                    {ri.source_warehouse ? (
                      <DocLink href={`/master-data/warehouses/${encodeURIComponent(ri.source_warehouse)}`}>
                        {ri.source_warehouse}
                      </DocLink>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={cell}>
                    {ri.source_warehouse ? (
                      <StockBadge itemCode={ri.item_code} warehouse={ri.source_warehouse} requestedQty={remaining} />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
            {(doc.required_items ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-graphite-500">
                  No required materials on this Work Order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-graphite-900">Material Transfers</h2>
      <div className={plainTableWrap}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={plainTableHead}>
              <th className={`${cell} font-semibold`}>Stock Entry</th>
              <th className={`${cell} font-semibold`}>Status</th>
              <th className={`${cell} font-semibold`}>Date</th>
              <th className={`${cell} font-semibold`}>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {materialTransfers.map((se) => (
              <tr key={se.name} className="border-b border-border last:border-0">
                <td className={cell}>
                  <DocLink href={`/stock/stock-entries/${encodeURIComponent(se.name)}`}>{se.name}</DocLink>
                </td>
                <td className={`${cell} text-graphite-500`}>
                  {se.docstatus === 0 ? "Draft" : se.docstatus === 1 ? "Submitted" : "Cancelled"}
                </td>
                <td className={`${cell} font-mono text-graphite-500`}>{se.posting_date || "—"}</td>
                <td className={`${cell} text-graphite-500`}>{se.purpose || "—"}</td>
              </tr>
            ))}
            {materialTransfers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-graphite-500">
                  No material transfers against this Work Order yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-graphite-900">Production Entries</h2>
      <div className={plainTableWrap}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={plainTableHead}>
              <th className={`${cell} font-semibold`}>Stock Entry</th>
              <th className={`${cell} font-semibold`}>Status</th>
              <th className={`${cell} font-semibold`}>Date</th>
              <th className={`${cell} font-semibold`}>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {manufactureEntries.map((se) => (
              <tr key={se.name} className="border-b border-border last:border-0">
                <td className={cell}>
                  <DocLink href={`/stock/stock-entries/${encodeURIComponent(se.name)}`}>{se.name}</DocLink>
                </td>
                <td className={`${cell} text-graphite-500`}>
                  {se.docstatus === 0 ? "Draft" : se.docstatus === 1 ? "Submitted" : "Cancelled"}
                </td>
                <td className={`${cell} font-mono text-graphite-500`}>{se.posting_date || "—"}</td>
                <td className={`${cell} text-graphite-500`}>{se.purpose || "—"}</td>
              </tr>
            ))}
            {manufactureEntries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-graphite-500">
                  No production entries against this Work Order yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const operations = doc.operations ?? [];
  // Cross-references Work Order Operation rows to Job Cards by operation name (Package 5's
  // already-fetched `jobCards` — no extra query). 1:1 on this instance's real data today (see
  // job-card.md's "Creation contract" — batch-split/corrective Job Cards are the only cases that
  // would produce more than one match), handled generically with `.filter` rather than assuming
  // exactly one match, so a future batch-split scenario shows every Job Card, not just the first.
  const jobCardsByOperation = new Map<string, JobCardRow[]>();
  for (const jc of jobCards) {
    if (!jc.operation) continue;
    const existing = jobCardsByOperation.get(jc.operation) ?? [];
    existing.push(jc);
    jobCardsByOperation.set(jc.operation, existing);
  }
  const operationsTab = (
    <div className={plainTableWrap}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className={plainTableHead}>
            <th className={`${cell} text-right font-semibold`}>#</th>
            <th className={`${cell} font-semibold`}>Operation</th>
            <th className={`${cell} font-semibold`}>Job Card</th>
            <th className={`${cell} font-semibold`}>Workstation</th>
            <th className={`${cell} font-semibold`}>Status</th>
            <th className={`${cell} text-right font-semibold`}>Time (mins)</th>
            <th className={`${cell} text-right font-semibold`}>Completed Qty</th>
            <th className={`${cell} text-right font-semibold`}>Batch Size</th>
            <th className={`${cell} font-semibold`}>Planned Start</th>
            <th className={`${cell} font-semibold`}>Planned End</th>
            <th className={`${cell} font-semibold`}>Actual Start</th>
            <th className={`${cell} font-semibold`}>Actual End</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((op, i) => {
            const relatedJobCards = jobCardsByOperation.get(op.operation) ?? [];
            return (
            <tr key={i} className="border-b border-border last:border-0">
              <td className={`${cell} text-right text-graphite-400`}>{i + 1}</td>
              <td className={`${cell} text-graphite-900`}>{op.operation}</td>
              <td className={cell}>
                {relatedJobCards.length === 0
                  ? "—"
                  : relatedJobCards.map((jc, j) => (
                      <span key={jc.name}>
                        {j > 0 && ", "}
                        <Link
                          href={`/manufacturing/job-cards/${encodeURIComponent(jc.name)}`}
                          className="font-mono text-signal hover:underline"
                        >
                          {jc.name}
                        </Link>
                      </span>
                    ))}
              </td>
              <td className={`${cell} text-graphite-500`}>{op.workstation || "—"}</td>
              <td className={`${cell} text-graphite-500`}>{op.status || "—"}</td>
              <td className={`${cell} text-right font-mono tabular-nums`}>{op.time_in_mins ?? "—"}</td>
              <td className={`${cell} text-right font-mono tabular-nums`}>{op.completed_qty ?? 0}</td>
              <td className={`${cell} text-right font-mono tabular-nums`}>{op.batch_size ?? "—"}</td>
              <td className={`${cell} font-mono text-graphite-500`}>{op.planned_start_time || "—"}</td>
              <td className={`${cell} font-mono text-graphite-500`}>{op.planned_end_time || "—"}</td>
              <td className={`${cell} font-mono text-graphite-500`}>{op.actual_start_time || "—"}</td>
              <td className={`${cell} font-mono text-graphite-500`}>{op.actual_end_time || "—"}</td>
            </tr>
            );
          })}
          {operations.length === 0 && (
            <tr>
              <td colSpan={12} className="px-4 py-6 text-center text-graphite-500">
                No operations on this Work Order.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const jobCardsWithTemplate = jobCards.filter((jc) => jc.quality_inspection_template);
  // Scoped to jobCardsWithTemplate, not all jobCards — a Job Card that recorded an inspection
  // without carrying a template would otherwise inflate the numerator against a denominator
  // that never counted it, producing a readiness ratio above the real population (e.g. "3 of
  // 2") — governance-closure code-review finding, CX-MFG-003.
  const jobCardsWithInspection = jobCardsWithTemplate.filter((jc) => jc.quality_inspection);

  /**
   * Truthful, not inferred: reads each Job Card's own `quality_inspection_template`/
   * `quality_inspection` fields (already fetched above, zero extra requests) — never the
   * production Item's own `quality_inspection_template` (that's a config default, not
   * evidence an inspection actually happened or is required for *this* Work Order's Job
   * Cards). If no Job Cards exist yet, or none carry a template, that's said plainly rather
   * than papered over with the Item-level value.
   */
  const qualitySection = (
    <div className="rounded-xl border border-border bg-surface p-4 text-sm">
      {jobCards.length === 0 ? (
        <p className="text-graphite-500">
          No Job Cards yet for this Work Order — quality inspections are recorded at Job Card level once
          production starts.
        </p>
      ) : jobCardsWithTemplate.length === 0 ? (
        <p className="text-graphite-500">
          No Quality Inspection Template is attached to any related Job Card. Quality inspections, when
          required, are recorded at Job Card level, not on the Work Order itself.
        </p>
      ) : (
        <p className="text-graphite-500">
          <span className="font-mono text-graphite-900">{jobCardsWithInspection.length}</span> of{" "}
          <span className="font-mono text-graphite-900">{jobCardsWithTemplate.length}</span> Job Card(s)
          requiring a Quality Inspection Template have a recorded inspection. Quality inspections are
          tracked per Job Card, not at the Work Order level.
        </p>
      )}
    </div>
  );

  const jobCardsTab = (
    <div>
      <div className={`${plainTableWrap} mb-6`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={plainTableHead}>
              <th className={`${cell} font-semibold`}>Job Card</th>
              <th className={`${cell} font-semibold`}>Status</th>
              <th className={`${cell} font-semibold`}>Operation</th>
              <th className={`${cell} font-semibold`}>Workstation</th>
              <th className={`${cell} text-right font-semibold`}>For Qty</th>
              <th className={`${cell} text-right font-semibold`}>Completed Qty</th>
              <th className={`${cell} font-semibold`}>Expected Start</th>
              <th className={`${cell} font-semibold`}>Expected End</th>
              <th className={`${cell} font-semibold`}>Actual Start</th>
              <th className={`${cell} font-semibold`}>Actual End</th>
            </tr>
          </thead>
          <tbody>
            {jobCards.map((jc) => {
              const jcStatus = jobCardStatus(jc);
              return (
              <tr key={jc.name} className="border-b border-border last:border-0">
                {/* Real link — MFG-JOBCARD-1 shipped the detail route. */}
                <td className={`${cell} font-mono text-graphite-900`}>
                  <Link href={`/manufacturing/job-cards/${encodeURIComponent(jc.name)}`} className="text-signal hover:underline">
                    {jc.name}
                  </Link>
                </td>
                {/* docstatus-first, not raw `status` — see jobCardStatus's doc comment for
                    the stale-status-after-cancel finding this guards against. */}
                <td className={`${cell}`}>
                  <StatusPill label={jcStatus.label} tone={jcStatus.tone} />
                </td>
                <td className={`${cell} text-graphite-500`}>{jc.operation || "—"}</td>
                <td className={`${cell} text-graphite-500`}>{jc.workstation || "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{jc.for_quantity ?? "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{jc.total_completed_qty ?? 0}</td>
                <td className={`${cell} font-mono text-graphite-500`}>{jc.expected_start_date || "—"}</td>
                <td className={`${cell} font-mono text-graphite-500`}>{jc.expected_end_date || "—"}</td>
                <td className={`${cell} font-mono text-graphite-500`}>{jc.actual_start_date || "—"}</td>
                <td className={`${cell} font-mono text-graphite-500`}>{jc.actual_end_date || "—"}</td>
              </tr>
              );
            })}
            {jobCards.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-graphite-500">
                  No Job Cards for this Work Order yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <h2 className="mb-2 text-sm font-semibold text-graphite-900">Quality Readiness</h2>
      {qualitySection}
    </div>
  );

  /**
   * "Created By"/"Modified By" deliberately omitted — every ERPNext write in this app runs
   * under the one shared `frontend-integration` service account (see the frontend's
   * documented auth-model limitation), so those fields would always show that account's
   * email, not the real person, on every document. The Comments tab's activity feed is
   * where a real attributed name actually appears (comments embed the poster's real name in
   * their content), so it isn't duplicated here with a misleading value.
   */
  const moreInfoTab = (
    <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
      <DocField label="Company" value={doc.company} />
      <DocField label="Created" value={doc.creation?.slice(0, 10) || "—"} mono />
      <DocField label="Last modified" value={doc.modified?.slice(0, 10) || "—"} mono />
    </dl>
  );

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(
        null,
        "Work Order",
        doc.name,
        `/manufacturing/work-orders/${encodeURIComponent(doc.name)}`,
      )}
    />
  );

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Manufacturing", href: "/manufacturing" },
          { label: "Work Orders", href: "/manufacturing/work-orders" },
          { label: doc.name },
        ]}
      />
      {transferred && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success">
          Material transfer completed. Stock Entry:{" "}
          <Link
            href={`/stock/stock-entries/${encodeURIComponent(transferred)}`}
            className="underline decoration-success/50 underline-offset-2"
          >
            {transferred}
          </Link>
        </div>
      )}
      {produced && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success">
          Production completed. Stock Entry:{" "}
          <Link
            href={`/stock/stock-entries/${encodeURIComponent(produced)}`}
            className="underline decoration-success/50 underline-offset-2"
          >
            {produced}
          </Link>
        </div>
      )}
      {cancelled && (
        <div className="mb-4 rounded-md border border-border bg-canvas px-4 py-2 text-sm font-medium text-graphite-700">
          Work Order cancelled.
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
          <div className="mt-1">
            <StatusPill label={status.label} tone={status.tone} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {doc.docstatus === 0 && (
            <DocActionBar
              action={submitWorkOrderAction.bind(null, doc.name)}
              label="Submit"
              pendingLabel="Submitting…"
            />
          )}
          {transferEligibility.allowed && (
            <Link
              href={`/manufacturing/work-orders/${encodeURIComponent(doc.name)}/transfer-materials`}
              className="rounded-md border border-signal px-4 py-2 text-sm font-medium text-signal hover:bg-signal/10"
            >
              Transfer Materials
            </Link>
          )}
          {productionEligibility.allowed && (
            <Link
              href={`/manufacturing/work-orders/${encodeURIComponent(doc.name)}/complete-production`}
              className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
            >
              Complete Production
            </Link>
          )}
          {doc.docstatus === 1 &&
            (cancelBlocking.length > 0 ? (
              <p className="text-sm text-alert">
                Cannot cancel — linked with submitted{" "}
                {cancelBlocking.map((c, i) => (
                  <span key={c.label}>
                    {i > 0 && "; "}
                    {c.label}{" "}
                    {/* Every entry in the Work Order connection config carries a real per-document
                        href (Job Card -> /manufacturing/job-cards, Material Transfer/Manufacture/
                        Material Consumption -> /stock/stock-entries), so every blocker name links
                        to its canonical detail page. Closes MFG-FOLLOWUP-WO-LINK-1. */}
                    {c.submittedDocs!.map((docName, j) => (
                      <span key={docName}>
                        {j > 0 && ", "}
                        <Link href={`${c.href}/${encodeURIComponent(docName)}`} className="underline hover:no-underline">
                          {docName}
                        </Link>
                      </span>
                    ))}
                  </span>
                ))}
                . Cancel those first.
              </p>
            ) : cancelEligibility.allowed ? (
              <DocActionBar
                action={cancelWorkOrderAction.bind(null, doc.name)}
                label="Cancel Work Order"
                pendingLabel="Cancelling…"
                variant="danger"
              />
            ) : (
              <p className="text-sm text-graphite-500">{cancelEligibility.reason}</p>
            ))}
        </div>
      </div>
      <DocTabs
        tabs={[
          { id: "details", label: "Details", content: detailsTab },
          { id: "materials", label: "Materials", content: materialsTab },
          { id: "operations", label: "Operations", content: operationsTab },
          { id: "job-cards", label: "Job Cards", content: jobCardsTab },
          { id: "more-info", label: "More Info", content: moreInfoTab },
          { id: "comments", label: "Comments", content: commentsTab },
        ]}
      />
    </div>
  );
}

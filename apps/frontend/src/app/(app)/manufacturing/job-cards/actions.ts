"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { callDocMethod, cancelDoc, ErpNextError, getDoc } from "@/lib/erpnext";

export type FormState = { error?: string } | undefined;

/**
 * Same "pass ERPNext's own rejection text through mostly untouched" precedent as
 * `cancelBomAction`/`cancelWorkOrderAction`'s `humanizeCancelError`. Job Card cancel can be
 * blocked by `validate_produced_quantity()` when a submitted Manufacture Stock Entry already
 * used this Job Card for valuation (`MFG-UNV-014`, not live-reproduced during `MFG-JOBCARD-0`'s
 * discovery pass) — deliberately not special-cased here per that doc's own recommendation:
 * surface ERPNext's real message rather than inventing a proactive check for a condition this
 * app can't reliably re-derive client-side (which Job Cards fed which Manufacture Stock Entry's
 * valuation isn't a simple back-link scan).
 */
function humanizeCancelError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to cancel this Job Card.";
    return e.erpnextMessage ?? "ERPNext rejected this cancellation.";
  }
  return "Something went wrong. Try again.";
}

/**
 * docstatus 1 → 2 via ERPNext's own native cancel (`cancelDoc`), same no-cascade,
 * ERPNext-is-authoritative pattern as `cancelWorkOrderAction`/`cancelBomAction`
 * (`MFG-JOBCARD-LC-1`) — the package that actually closes the "Desk dependency" gap
 * `MFG-JOBCARD-0`'s discovery pass was motivated by (a submitted Job Card blocks Work Order
 * cancel via Frappe's generic back-link check, and until now the only way to cancel it was
 * ERPNext Desk).
 *
 * Re-fetches the Job Card fresh and checks `docstatus` itself rather than trusting the page
 * that rendered the button — same defense-in-depth precedent as every other cancel action in
 * this app. No proactive dependency check here: unlike Work Order (Stock Entry/Job Card
 * back-links) or BOM (Work Order back-link), Job Card's own real blocker
 * (`validate_produced_quantity()`) isn't a simple submitted-doc back-link this app can safely
 * re-derive — it's ERPNext's own valuation-consistency check. `humanizeCancelError` passes that
 * rejection through untouched rather than a custom message.
 */
export async function cancelJobCardAction(name: string): Promise<FormState> {
  let current: { docstatus: number; work_order?: string };
  try {
    current = await getDoc<{ docstatus: number; work_order?: string }>("Job Card", name);
  } catch {
    return { error: "Could not load this Job Card." };
  }

  if (current.docstatus !== 1) {
    return { error: "Only a submitted Job Card can be cancelled." };
  }

  try {
    await cancelDoc("Job Card", name);
  } catch (e) {
    return { error: humanizeCancelError(e) };
  }

  revalidatePath("/manufacturing/job-cards");
  revalidatePath(`/manufacturing/job-cards/${encodeURIComponent(name)}`);
  if (current.work_order) {
    revalidatePath(`/manufacturing/work-orders/${encodeURIComponent(current.work_order)}`);
  }
  redirect(`/manufacturing/job-cards/${encodeURIComponent(name)}?cancelled=1`);
}

export type ExecFormState = { error?: string } | undefined;

type JobCardTimeLogRow = { from_time?: string; to_time?: string };
type JobCardExecDoc = {
  docstatus: number;
  work_order?: string;
  for_quantity?: number;
  total_completed_qty?: number;
  time_logs?: JobCardTimeLogRow[];
};

function hasOpenTimeLog(timeLogs?: JobCardTimeLogRow[]): boolean {
  return (timeLogs ?? []).some((t) => t.from_time && !t.to_time);
}

/**
 * `MFG-JC-EXEC-1` — narrow, dated Manufacturing-freeze exception (see CLAUDE.md's Current
 * Mission lock) resolving E2E-1 finding D7. Same "pass ERPNext's own rejection text through
 * mostly untouched" precedent as `humanizeCancelError` above — `start_timer`/`complete_job_card`
 * throw real, already-specific ERPNext validation errors (e.g. `OverlapError` for a double-
 * booked employee/workstation, `OperationSequenceError` for an out-of-sequence operation) that
 * are clearer surfaced verbatim than replaced with an invented generic message.
 */
function humanizeExecError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to update this Job Card.";
    return e.erpnextMessage ?? "ERPNext rejected this action — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * Start (`start_timer`, docs/backend/05-manufacturing/job-card.md's "Lifecycle" table) — opens a
 * time log for each selected employee. Re-fetches the Job Card fresh and checks `docstatus` +
 * "no time log already open" itself before calling ERPNext, same defense-in-depth precedent as
 * `cancelJobCardAction` — this is what satisfies the mission's "prevent duplicate Start actions"
 * requirement server-side, on top of the page only ever rendering the Start form when no open
 * time log exists.
 */
export async function startJobCardAction(name: string, _prevState: ExecFormState, formData: FormData): Promise<ExecFormState> {
  const employeeIds = formData.getAll("employees").map(String).filter(Boolean);
  if (employeeIds.length === 0) {
    return { error: "Select at least one employee to start this Job Card." };
  }

  let current: JobCardExecDoc;
  try {
    current = await getDoc<JobCardExecDoc>("Job Card", name);
  } catch {
    return { error: "Could not load this Job Card." };
  }
  if (current.docstatus !== 0) {
    return { error: "Only a Draft Job Card (not yet submitted or cancelled) can be started." };
  }
  if (hasOpenTimeLog(current.time_logs)) {
    return { error: "This Job Card has already been started." };
  }

  const startTime = String(formData.get("start_time") ?? "").trim();
  if (!startTime) return { error: "Start time is required." };

  try {
    await callDocMethod("Job Card", name, "start_timer", {
      start_time: startTime,
      employees: employeeIds.map((employee) => ({ employee })),
    });
  } catch (e) {
    return { error: humanizeExecError(e) };
  }

  revalidatePath("/manufacturing/job-cards");
  revalidatePath(`/manufacturing/job-cards/${encodeURIComponent(name)}`);
  if (current.work_order) {
    revalidatePath(`/manufacturing/work-orders/${encodeURIComponent(current.work_order)}`);
  }
  redirect(`/manufacturing/job-cards/${encodeURIComponent(name)}?started=1`);
}

/**
 * Complete (`complete_job_card`) — closes the open time log with a completed/pending/process-
 * loss quantity split, then submits the Job Card in the same call via ERPNext's own native
 * `auto_submit` kwarg (source-confirmed: `complete_job_card` calls `self.submit()` when
 * `auto_submit` is truthy) rather than requiring a separate Submit click — the minimum "OPEN ->
 * START -> IN PROGRESS -> COMPLETE" flow the mission calls for, with no extra Ceylon-Stack-
 * invented step. Submitting is what actually feeds `update_work_order()` and unblocks Complete
 * Production (see job-card.md's "Quantity / partial-completion model").
 *
 * `for_quantity` (the older "add more to this cycle" kwarg) is deliberately never sent — leaving
 * it out skips `validate_completion_qty_split`'s stricter conservation check entirely
 * (source-confirmed: that check only runs `if flt(kwargs.for_quantity)`), which is correct here
 * since this app always completes against the Job Card's existing `for_quantity`, never extends
 * it mid-flight.
 */
export async function completeJobCardAction(name: string, _prevState: ExecFormState, formData: FormData): Promise<ExecFormState> {
  const qty = Number(String(formData.get("qty") ?? "").trim());
  if (!Number.isFinite(qty) || qty <= 0) {
    return { error: "Enter a completed quantity greater than zero." };
  }
  const pendingQty = Number(String(formData.get("pending_qty") ?? "0").trim()) || 0;
  const processLossQty = Number(String(formData.get("process_loss_qty") ?? "0").trim()) || 0;
  if (pendingQty < 0 || processLossQty < 0) {
    return { error: "Pending and process loss quantities cannot be negative." };
  }
  const endTime = String(formData.get("end_time") ?? "").trim();
  if (!endTime) return { error: "End time is required." };

  let current: JobCardExecDoc;
  try {
    current = await getDoc<JobCardExecDoc>("Job Card", name);
  } catch {
    return { error: "Could not load this Job Card." };
  }
  if (current.docstatus !== 0) {
    return { error: "Only a Draft Job Card (not yet submitted or cancelled) can be completed." };
  }
  if (!hasOpenTimeLog(current.time_logs)) {
    return { error: "Start this Job Card before completing it." };
  }
  const remaining = (current.for_quantity ?? 0) - (current.total_completed_qty ?? 0);
  if (qty + pendingQty + processLossQty - remaining > 1e-6) {
    return { error: `Completed, Pending, and Process Loss quantities cannot exceed the remaining ${remaining} to manufacture.` };
  }

  try {
    await callDocMethod("Job Card", name, "complete_job_card", {
      qty,
      pending_qty: pendingQty,
      process_loss_qty: processLossQty,
      end_time: endTime,
      auto_submit: true,
    });
  } catch (e) {
    return { error: humanizeExecError(e) };
  }

  revalidatePath("/manufacturing/job-cards");
  revalidatePath(`/manufacturing/job-cards/${encodeURIComponent(name)}`);
  if (current.work_order) {
    revalidatePath(`/manufacturing/work-orders/${encodeURIComponent(current.work_order)}`);
  }
  redirect(`/manufacturing/job-cards/${encodeURIComponent(name)}?completed=1`);
}

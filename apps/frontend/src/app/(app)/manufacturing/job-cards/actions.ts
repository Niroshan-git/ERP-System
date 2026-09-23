"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, ErpNextError, getDoc } from "@/lib/erpnext";

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

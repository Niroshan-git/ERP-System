"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createDoc, ErpNextError, getDoc, submitDoc } from "@/lib/erpnext";
import { canCompleteProduction } from "@/lib/erpStatus";
import { getItemLineDefaults } from "@/lib/actions/itemLookup";
import { getManufacturePreview } from "@/lib/actions/workOrderManufacture";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to create this production entry.";
    if (e.status === 409) return "A stock entry with that name already exists — try again.";
    return e.erpnextMessage ?? "ERPNext rejected this production entry — check quantities and warehouses.";
  }
  return "Something went wrong. Try again.";
}

type EligibilityDoc = {
  docstatus: number;
  status: string;
  qty: number;
  produced_qty?: number;
  track_semi_finished_goods?: 0 | 1;
  transfer_material_against?: string;
};

/**
 * Builds Manufacture Stock Entry fields for the bound `workOrderName`, re-verifying everything
 * server-side rather than trusting the page's earlier render or any client-submitted field —
 * same trust-boundary shape `transfer-materials/actions.ts`'s `buildStockEntryFields` already
 * established for this app (session re-check, fresh Work Order fetch, fresh eligibility check,
 * fresh `make_stock_entry` call). The one deliberate difference: unlike Material Transfer, this
 * form has **no client-editable item rows at all** — a Manufacture entry's raw-material
 * consumption and finished-goods rows are entirely ERPNext's own BOM-derived computation (see
 * `workOrderManufacture.ts`'s doc comment), and ERPNext's Manufacture flow has no equivalent to
 * Material Transfer's "additional item" mechanism (`add_additional_items` is Material-Transfer-
 * purpose-specific, source-confirmed — MFG-CLOSE-1 investigation). The only real client input
 * accepted here is the production quantity (`fg_completed_qty`), `posting_date`, and optional
 * `remarks` — every item field is taken verbatim from a fresh preview keyed off the trustworthy
 * bound `workOrderName`.
 */
async function buildManufactureStockEntryFields(
  workOrderName: string,
  formData: FormData,
): Promise<{ error: string } | { fields: Record<string, unknown> }> {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return { error: "Your session expired — reload the page and sign in again." };

  let workOrder: EligibilityDoc;
  try {
    workOrder = await getDoc<EligibilityDoc>("Work Order", workOrderName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) return { error: "Work Order not found." };
    return { error: "Could not verify the Work Order before completing production." };
  }
  const eligibility = canCompleteProduction(workOrder);
  if (!eligibility.allowed) {
    return { error: eligibility.reason ?? "This Work Order can no longer accept a production entry." };
  }

  const requestedQty = Number(String(formData.get("fg_completed_qty") ?? "").trim());
  if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
    return { error: "Enter a production quantity greater than zero." };
  }
  // Server-authoritative ceiling, re-derived from the Work Order just fetched above — not the
  // page's earlier render. A small float tolerance (same 1e-6 order of magnitude this codebase
  // uses elsewhere for qty comparisons) avoids rejecting "the full remaining qty" on a rounding
  // artifact while still catching a real over-production attempt (Scenario C).
  const remaining = workOrder.qty - (workOrder.produced_qty ?? 0);
  if (requestedQty > remaining + 1e-6) {
    return { error: `Quantity to complete cannot exceed the remaining ${remaining} still to produce.` };
  }

  const postingDate = String(formData.get("posting_date") ?? "").trim();
  if (!postingDate) return { error: "Posting date is required." };
  const remarks = String(formData.get("remarks") ?? "").trim() || undefined;

  const previewResult = await getManufacturePreview(workOrderName, requestedQty);
  if (!previewResult.preview) {
    return { error: previewResult.error };
  }
  const preview = previewResult.preview;

  if (!preview.to_warehouse) {
    return { error: "Work Order has no Target (Finished Goods) Warehouse — cannot complete production." };
  }
  if (preview.items.length === 0) {
    return { error: "ERPNext did not return any items for this production entry. Try again." };
  }
  // Defensive per-row warehouse check — a raw material whose BOM row has no configured
  // `source_warehouse` (a master-data gap, not something this app can fix) would otherwise reach
  // ERPNext as a Stock Entry Detail row with a blank source warehouse and fail at submit with a
  // raw ERPNext error. Caught here with a clear message instead, same philosophy as the
  // `to_warehouse` check above.
  const rowsMissingWarehouse = preview.items.filter((r) =>
    r.is_finished_item ? !r.t_warehouse : !r.s_warehouse,
  );
  if (rowsMissingWarehouse.length > 0) {
    const names = [...new Set(rowsMissingWarehouse.map((r) => r.item_code))].join(", ");
    return { error: `${names}: no warehouse configured on the BOM for this item — cannot complete production.` };
  }

  // Fail-closed batch/serial guard (§18 of the assigning brief): this screen has no batch/serial
  // picker UI, same limitation Material Transfer already discloses. Checked against every row
  // ERPNext proposed (raw materials + finished good + any scrap/co-product row), not just the
  // finished item, since a batch/serial-tracked raw material would be just as unsupported.
  const uniqueItemCodes = [...new Set(preview.items.map((r) => r.item_code))];
  const itemFlags = await Promise.all(uniqueItemCodes.map((code) => getItemLineDefaults(code)));
  // Fail closed on a lookup failure itself (code-review finding) — `getItemLineDefaults`
  // swallows its own errors and returns `null` on any Item lookup failure (network blip,
  // permission issue, deleted Item), so treating `null` the same as "doesn't require
  // batch/serial" via optional chaining would silently let an unverifiable item through. This
  // mirrors `transfer-materials/actions.ts`'s equivalent `if (!defaults) return { error: ... }`
  // guard for additional-item rows.
  const unverifiableItems = uniqueItemCodes.filter((_, i) => !itemFlags[i]);
  if (unverifiableItems.length > 0) {
    return { error: `Could not verify ${unverifiableItems.join(", ")} — try again.` };
  }
  const batchOrSerialItems = uniqueItemCodes.filter((_, i) => itemFlags[i]?.has_batch_no || itemFlags[i]?.has_serial_no);
  if (batchOrSerialItems.length > 0) {
    return {
      error: `${batchOrSerialItems.join(", ")} require${batchOrSerialItems.length === 1 ? "s" : ""} batch/serial allocation — not supported in this production screen yet.`,
    };
  }

  return {
    fields: {
      naming_series: "MAT-STE-.YYYY.-",
      company: preview.company,
      posting_date: postingDate,
      purpose: "Manufacture",
      stock_entry_type: "Manufacture",
      work_order: workOrderName,
      from_bom: preview.from_bom,
      bom_no: preview.bom_no,
      use_multi_level_bom: preview.use_multi_level_bom,
      ...(preview.from_warehouse ? { from_warehouse: preview.from_warehouse } : {}),
      to_warehouse: preview.to_warehouse,
      fg_completed_qty: preview.fg_completed_qty,
      ...(preview.process_loss_qty ? { process_loss_qty: preview.process_loss_qty } : {}),
      ...(preview.inspection_required ? { inspection_required: preview.inspection_required } : {}),
      ...(remarks ? { remarks } : {}),
      items: preview.items.map((row) => ({
        item_code: row.item_code,
        item_name: row.item_name,
        qty: row.qty,
        transfer_qty: row.transfer_qty,
        uom: row.uom,
        stock_uom: row.stock_uom,
        conversion_factor: row.conversion_factor,
        ...(row.s_warehouse ? { s_warehouse: row.s_warehouse } : {}),
        ...(row.t_warehouse ? { t_warehouse: row.t_warehouse } : {}),
        ...(row.is_finished_item ? { is_finished_item: row.is_finished_item } : {}),
        ...(row.secondary_item_type ? { secondary_item_type: row.secondary_item_type } : {}),
      })),
    },
  };
}

/** Create-only — leaves the Stock Entry at docstatus 0 (Draft). Same Draft-vs-Submit safety
 * split Material Transfer already established: a Draft never moves stock or updates the Work
 * Order (MFG-WF-003's rule, which applies to every Stock Entry purpose, not just Material
 * Transfer). The existing Stock Entry detail page (`/stock/stock-entries/[name]`) already has
 * its own Submit action for a saved draft. */
export async function saveProductionDraftAction(
  workOrderName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const built = await buildManufactureStockEntryFields(workOrderName, formData);
  if ("error" in built) return { error: built.error };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Stock Entry", built.fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath(`/manufacturing/work-orders/${encodeURIComponent(workOrderName)}`);
  redirect(`/stock/stock-entries/${encodeURIComponent(name)}`);
}

/**
 * Create + submit in one step — this is the actual production-completion action (Draft never
 * affects the Work Order's `produced_qty`/`consumed_qty`/`status`; only a submitted entry does,
 * per `Stock Entry.on_submit()` → `update_work_order()`, source-confirmed MFG-CLOSE-1). If
 * create succeeds but submit fails (e.g. ERPNext's own over-production/stock-shortage checks,
 * which only run at submit time), the Stock Entry is left as a real Draft rather than silently
 * discarded — same two-step-failure convention `submitTransferAction` already uses.
 */
export async function submitProductionAction(
  workOrderName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const built = await buildManufactureStockEntryFields(workOrderName, formData);
  if ("error" in built) return { error: built.error };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Stock Entry", built.fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  try {
    await submitDoc("Stock Entry", name);
  } catch (e) {
    return {
      error: `${humanizeError(e)} The production entry was saved as Draft ${name} but not submitted — stock has not moved and the Work Order is unchanged. Open it from Stock Entries to retry or fix the issue.`,
    };
  }

  revalidatePath(`/manufacturing/work-orders/${encodeURIComponent(workOrderName)}`);
  revalidatePath("/stock/stock-entries");
  redirect(
    `/manufacturing/work-orders/${encodeURIComponent(workOrderName)}?produced=${encodeURIComponent(name)}`,
  );
}

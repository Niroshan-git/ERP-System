"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createDoc, ErpNextError, submitDoc } from "@/lib/erpnext";

export type FormState = { error?: string } | undefined;

type TransferRowInput = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  s_warehouse: string;
};

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to create this material transfer.";
    if (e.status === 409) return "A stock entry with that name already exists — try again.";
    return e.erpnextMessage ?? "ERPNext rejected this transfer — check quantities and warehouses.";
  }
  return "Something went wrong. Try again.";
}

/** Parses the hidden JSON field MaterialTransferForm.tsx submits — same technique as
 * lib/lineRows.ts's parseLineRows, kept local since this route is the only caller
 * (FRONTEND_GUIDE.md: actions.ts is self-contained per doctype/route). */
function parseTransferRows(formData: FormData): TransferRowInput[] {
  const raw = String(formData.get("items") ?? "[]");
  let rows: unknown;
  try {
    rows = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object" && r.item_code))
    .map((r) => ({
      item_code: String(r.item_code),
      item_name: String(r.item_name || r.item_code),
      qty: Number(r.qty) || 0,
      uom: String(r.uom || ""),
      stock_uom: String(r.stock_uom || r.uom || ""),
      conversion_factor: Number(r.conversion_factor) || 1,
      s_warehouse: String(r.s_warehouse || ""),
    }))
    .filter((r) => r.qty > 0 && r.s_warehouse && r.uom);
}

/**
 * Builds Stock Entry fields from the reviewed transfer rows. Header shape mirrors exactly
 * what `erpnext...work_order.make_stock_entry` itself returned (see
 * lib/actions/workOrderTransfer.ts's doc comment) — `purpose`/`stock_entry_type`/`work_order`/
 * `company`/`from_bom`/`bom_no`/`use_multi_level_bom`/`to_warehouse` — rebuilt here from clean
 * scalar form fields rather than trusting a client-round-tripped copy of ERPNext's own dict.
 * `t_warehouse` is applied uniformly to every line from the header's `to_warehouse` (the
 * Work Order's WIP warehouse), same convention `stock-entries/actions.ts` already uses for
 * Material Transfer.
 */
function buildStockEntryFields(formData: FormData) {
  const workOrder = String(formData.get("work_order") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const bomNo = String(formData.get("bom_no") ?? "").trim();
  const useMultiLevelBom = formData.get("use_multi_level_bom") === "1" ? 1 : 0;
  const toWarehouse = String(formData.get("to_warehouse") ?? "").trim();
  const postingDate = String(formData.get("posting_date") ?? "").trim();
  const remarks = String(formData.get("remarks") ?? "").trim() || undefined;
  const fgCompletedQty = Number(formData.get("fg_completed_qty")) || 0;

  if (!workOrder) throw new Error("Missing Work Order reference.");
  if (!company) throw new Error("Missing company.");
  if (!toWarehouse) throw new Error("Work Order has no WIP warehouse — cannot transfer material.");
  if (!postingDate) throw new Error("Posting date is required.");
  if (fgCompletedQty <= 0) throw new Error("Missing production quantity for this transfer.");

  const rows = parseTransferRows(formData);
  if (rows.length === 0) throw new Error("Add at least one material with a quantity and source warehouse.");

  const items = rows.map((r) => ({
    item_code: r.item_code,
    item_name: r.item_name,
    qty: r.qty,
    transfer_qty: r.qty * r.conversion_factor,
    uom: r.uom,
    stock_uom: r.stock_uom,
    conversion_factor: r.conversion_factor,
    s_warehouse: r.s_warehouse,
    t_warehouse: toWarehouse,
  }));

  return {
    naming_series: "MAT-STE-.YYYY.-",
    company,
    posting_date: postingDate,
    purpose: "Material Transfer for Manufacture",
    stock_entry_type: "Material Transfer for Manufacture",
    work_order: workOrder,
    from_bom: 1,
    bom_no: bomNo,
    use_multi_level_bom: useMultiLevelBom,
    to_warehouse: toWarehouse,
    // Required for ERPNext's own Stock Entry.update_work_order to run at all — it's gated
    // behind `if self.fg_completed_qty:` (live-confirmed: omitting this silently skipped
    // add_additional_items, so an "additional" material never reached the Work Order's
    // required_items — see PROGRESS.md's Package 5 QA entry). Same value make_stock_entry
    // itself defaults to (Work Order's remaining qty to produce), passed through unchanged.
    fg_completed_qty: fgCompletedQty,
    ...(remarks ? { remarks } : {}),
    items,
  };
}

/** Create-only — leaves the Stock Entry at docstatus 0 (Draft). Existing Stock Entry detail
 * page (`/stock/stock-entries/[name]`) already has its own Submit action, so a saved draft
 * is never silently treated as transferred (see mission's Draft-vs-Submit safety rule). */
export async function saveTransferDraftAction(
  workOrderName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: ReturnType<typeof buildStockEntryFields>;
  try {
    fields = buildStockEntryFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Stock Entry", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath(`/manufacturing/work-orders/${encodeURIComponent(workOrderName)}`);
  redirect(`/stock/stock-entries/${encodeURIComponent(name)}`);
}

/**
 * Create + submit in one step — this is the stock-moving action (Draft never affects stock;
 * only a submitted Stock Entry does, per mission's Draft-vs-Submit rule). If create succeeds
 * but submit fails (e.g. a shortage ERPNext only checks at submit time), the Stock Entry is
 * left as a real Draft rather than silently discarded — the error names it so nothing is
 * lost, matching this app's existing two-step-failure convention (see
 * stock-entries/actions.ts's attachBatchSerialBundles doc comment for the same pattern).
 */
export async function submitTransferAction(
  workOrderName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: ReturnType<typeof buildStockEntryFields>;
  try {
    fields = buildStockEntryFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Stock Entry", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  try {
    await submitDoc("Stock Entry", name);
  } catch (e) {
    return {
      error: `${humanizeError(e)} The transfer was saved as Draft ${name} but not submitted — stock has not moved. Open it from Stock Entries to retry or fix the issue.`,
    };
  }

  revalidatePath(`/manufacturing/work-orders/${encodeURIComponent(workOrderName)}`);
  revalidatePath("/stock/stock-entries");
  redirect(
    `/manufacturing/work-orders/${encodeURIComponent(workOrderName)}?transferred=${encodeURIComponent(name)}`,
  );
}

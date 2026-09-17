"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createDoc, ErpNextError, submitDoc } from "@/lib/erpnext";
import { getItemLineDefaults } from "@/lib/actions/itemLookup";
import { getMaterialTransferPreview } from "@/lib/actions/workOrderTransfer";

export type FormState = { error?: string } | undefined;

type TransferRowInput = {
  item_code: string;
  qty: number;
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
 * (FRONTEND_GUIDE.md: actions.ts is self-contained per doctype/route). Only carries the
 * user's actual choices (which item, how much, which source warehouse) — every other field
 * (item_name/uom/stock_uom/conversion_factor, company, bom_no, to_warehouse,
 * fg_completed_qty) is re-derived server-side in buildStockEntryFields below, never trusted
 * from the client (see that function's doc comment for why). */
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
      qty: Number(r.qty) || 0,
      s_warehouse: String(r.s_warehouse || ""),
    }))
    .filter((r) => r.qty > 0 && r.s_warehouse);
}

/**
 * Builds Stock Entry fields for the bound `workOrderName` (the trustworthy route param each
 * action is `.bind(null, doc.name)`ed to — see page.tsx — unlike a hidden `<input>`, a bound
 * server-action argument is verified server-side and can't be edited via devtools). Re-fetches
 * `make_stock_entry` here rather than trusting the client's round-tripped copy of what the page
 * originally rendered: `company`/`bom_no`/`use_multi_level_bom`/`to_warehouse`/`fg_completed_qty`
 * all come from this fresh call, exactly mirroring `getMaterialTransferPreview`'s own doc
 * comment on why those fields are ERPNext-computed, not client-owned (code-review finding,
 * governance-closure pass — a tampered hidden field could otherwise post the transfer against
 * the wrong company/warehouse or with a stale `fg_completed_qty`).
 *
 * Per-row `item_code`/`qty`/`s_warehouse` are the only real client input (the user's actual
 * selection). A row matching one of the fresh preview's pending items is capped at ERPNext's
 * own proposed qty ceiling and takes its `item_name`/`uom`/`stock_uom`/`conversion_factor`
 * straight from that preview row — never from the client. A row NOT in the pending list is
 * treated as an additional (non-BOM) material: its master-data fields are re-derived from the
 * Item doctype via `getItemLineDefaults` (same batch/serial guard `MaterialTransferForm.tsx`
 * already applies client-side, re-checked here since a client can't be trusted to have run it).
 */
async function buildStockEntryFields(
  workOrderName: string,
  formData: FormData,
): Promise<{ error: string } | { fields: Record<string, unknown> }> {
  const previewResult = await getMaterialTransferPreview(workOrderName);
  if (!previewResult.preview) {
    return { error: previewResult.error };
  }
  const preview = previewResult.preview;

  if (!preview.to_warehouse) {
    return { error: "Work Order has no WIP warehouse — cannot transfer material." };
  }
  if (preview.fg_completed_qty <= 0) {
    return { error: "Missing production quantity for this transfer." };
  }

  const postingDate = String(formData.get("posting_date") ?? "").trim();
  if (!postingDate) return { error: "Posting date is required." };
  const remarks = String(formData.get("remarks") ?? "").trim() || undefined;

  const rows = parseTransferRows(formData);
  if (rows.length === 0) return { error: "Add at least one material with a quantity and source warehouse." };

  const pendingByItem = new Map(preview.items.map((r) => [r.item_code, r]));
  const items: Record<string, unknown>[] = [];

  for (const row of rows) {
    const pending = pendingByItem.get(row.item_code);
    if (pending) {
      const qty = Math.min(row.qty, pending.qty);
      if (qty <= 0) continue;
      items.push({
        item_code: pending.item_code,
        item_name: pending.item_name,
        qty,
        transfer_qty: qty * pending.conversion_factor,
        uom: pending.uom,
        stock_uom: pending.stock_uom,
        conversion_factor: pending.conversion_factor,
        s_warehouse: row.s_warehouse,
        t_warehouse: preview.to_warehouse,
      });
      continue;
    }

    const defaults = await getItemLineDefaults(row.item_code);
    if (!defaults) return { error: `${row.item_code}: could not look up this item.` };
    if (defaults.has_batch_no || defaults.has_serial_no) {
      return {
        error: `${row.item_code} requires ${defaults.has_batch_no ? "batch" : "serial"} allocation — not supported in this transfer screen yet.`,
      };
    }
    items.push({
      item_code: row.item_code,
      item_name: defaults.item_name,
      qty: row.qty,
      transfer_qty: row.qty,
      uom: defaults.uom,
      stock_uom: defaults.uom,
      conversion_factor: 1,
      s_warehouse: row.s_warehouse,
      t_warehouse: preview.to_warehouse,
    });
  }

  if (items.length === 0) {
    return { error: "Add at least one material with a quantity and source warehouse." };
  }

  return {
    fields: {
      naming_series: "MAT-STE-.YYYY.-",
      company: preview.company,
      posting_date: postingDate,
      purpose: "Material Transfer for Manufacture",
      stock_entry_type: "Material Transfer for Manufacture",
      work_order: workOrderName,
      from_bom: preview.from_bom,
      bom_no: preview.bom_no,
      use_multi_level_bom: preview.use_multi_level_bom,
      to_warehouse: preview.to_warehouse,
      // Required for ERPNext's own Stock Entry.update_work_order to run at all — it's gated
      // behind `if self.fg_completed_qty:` (live-confirmed: omitting this silently skipped
      // add_additional_items, so an "additional" material never reached the Work Order's
      // required_items — see PROGRESS.md's Package 5 QA entry). Sourced fresh from this
      // call's own make_stock_entry response, same value ERPNext itself defaults to.
      fg_completed_qty: preview.fg_completed_qty,
      ...(remarks ? { remarks } : {}),
      items,
    },
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
  const built = await buildStockEntryFields(workOrderName, formData);
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
  const built = await buildStockEntryFields(workOrderName, formData);
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
      error: `${humanizeError(e)} The transfer was saved as Draft ${name} but not submitted — stock has not moved. Open it from Stock Entries to retry or fix the issue.`,
    };
  }

  revalidatePath(`/manufacturing/work-orders/${encodeURIComponent(workOrderName)}`);
  revalidatePath("/stock/stock-entries");
  redirect(
    `/manufacturing/work-orders/${encodeURIComponent(workOrderName)}?transferred=${encodeURIComponent(name)}`,
  );
}

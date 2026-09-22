"use server";

import { callMethodWithResult, ErpNextError } from "@/lib/erpnext";

export type ManufactureItemRow = {
  item_code: string;
  item_name: string;
  qty: number;
  transfer_qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  s_warehouse: string | null;
  t_warehouse: string | null;
  is_finished_item?: 0 | 1;
  secondary_item_type?: string;
};

export type ManufacturePreview = {
  purpose: string;
  stock_entry_type: string;
  work_order: string;
  company: string;
  from_bom: 0 | 1;
  bom_no: string;
  use_multi_level_bom: 0 | 1;
  from_warehouse: string | null;
  to_warehouse: string | null;
  fg_completed_qty: number;
  process_loss_qty?: number;
  inspection_required?: 0 | 1;
  items: ManufactureItemRow[];
};

export type ManufacturePreviewResult =
  | { preview: ManufacturePreview; error?: undefined }
  | { preview?: undefined; error: string };

/**
 * Calls ERPNext's own whitelisted `make_stock_entry` (Work Order controller) with
 * `purpose: "Manufacture"` — the exact method Desk's own "Manufacture"/"Finish" action calls
 * (source-traced live on the Hetzner instance, ERPNext v16.34.2,
 * `erpnext/manufacturing/doctype/work_order/work_order.py::make_stock_entry`, MFG-CLOSE-1
 * investigation). No consumption/production math is recomputed in this app — every field below
 * is exactly what ERPNext itself proposes for the requested `fgCompletedQty`.
 *
 * Source-confirmed behavior this preview relies on (not guessed):
 * - `fg_completed_qty` defaults server-side to `work_order.qty - work_order.produced_qty`
 *   (full remaining qty) when no `qty` argument is passed, but accepts any explicit override —
 *   this is how "Quantity to Complete Now" (partial production) works: this function is called
 *   again with a specific `fgCompletedQty` to get a *freshly scaled* preview, never computed by
 *   scaling the full-qty preview client-side (BOM UOM conversion/rounding/process-loss math is
 *   ERPNext's, not reproduced here).
 * - Raw material rows come from `get_bom_raw_materials()` → `get_bom_items_as_dict()`, scaled to
 *   the requested `fg_completed_qty` — each row's own `s_warehouse` is either the BOM item's own
 *   `source_warehouse` or, if `Work Order.from_wip_warehouse` is checked, uniformly the WIP
 *   warehouse (this instance's real Manufacturing Settings: `backflush_raw_materials_based_on =
 *   "BOM"`, `material_consumption = 0` — confirmed live, so this is the active code path, not the
 *   Material-Transferred-quantity-based alternative).
 * - The finished-goods row (`is_finished_item: 1`) has `qty = fg_completed_qty -
 *   process_loss_qty`, `t_warehouse = work_order.fg_warehouse`. `process_loss_qty` (a Stock Entry
 *   header field) is computed here too when the BOM has `process_loss_percentage` set — passed
 *   through, never recomputed client-side.
 * - `make_stock_entry` itself performs no over-production validation — the preview call always
 *   succeeds even for an absurd qty. The actual rejection is live-confirmed (MFG-CLOSE-1 QA) to
 *   happen inside `Stock Entry.validate()` (`stock_entry.py`, reads `Manufacturing
 *   Settings.overproduction_percentage_for_work_order` directly and throws `ValidationError` —
 *   e.g. `"For quantity 15.0 should not be greater than allowed quantity 10.0"`), which Frappe's
 *   controller lifecycle runs on **every save, including a plain Draft `insert()`** — not
 *   specifically at Submit, and not via `Work Order.update_work_order_qty()` (an earlier,
 *   source-reading-only pass over this method incorrectly attributed the check to that function
 *   and to submit-time specifically; corrected after live-reproducing the actual rejection point).
 *   This instance's `overproduction_percentage_for_work_order = 0.0`, i.e. no allowance. This app
 *   pre-validates the requested qty against remaining qty before calling this function (see
 *   `complete-production/actions.ts`) purely so the user gets a clear message sooner — ERPNext's
 *   own check remains the actual enforcement point, and in practice fires even earlier (at
 *   `createDoc`/Draft time) than this comment previously implied.
 */
export async function getManufacturePreview(
  workOrderName: string,
  fgCompletedQty?: number,
): Promise<ManufacturePreviewResult> {
  try {
    const preview = await callMethodWithResult<ManufacturePreview>(
      "erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry",
      {
        work_order_id: workOrderName,
        purpose: "Manufacture",
        ...(fgCompletedQty != null ? { qty: fgCompletedQty } : {}),
      },
    );
    return { preview };
  } catch (e) {
    if (e instanceof ErpNextError) {
      if (e.status === 403) return { error: "Not allowed to prepare a production entry for this Work Order." };
      return { error: e.erpnextMessage ?? "ERPNext could not prepare this production entry." };
    }
    return { error: "Something went wrong contacting ERPNext. Try again." };
  }
}

"use server";

import { callMethodWithResult, ErpNextError } from "@/lib/erpnext";

export type TransferMaterialRow = {
  item_code: string;
  item_name: string;
  qty: number;
  transfer_qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  s_warehouse: string | null;
  t_warehouse: string | null;
  actual_qty: number;
  transferred_qty: number;
  allow_alternative_item: 0 | 1;
  original_item: string | null;
};

export type TransferMaterialPreview = {
  purpose: string;
  work_order: string;
  company: string;
  from_bom: 0 | 1;
  bom_no: string;
  use_multi_level_bom: 0 | 1;
  to_warehouse: string | null;
  stock_entry_type: string;
  project: string | null;
  fg_completed_qty: number;
  items: TransferMaterialRow[];
};

export type MaterialTransferPreviewResult =
  | { preview: TransferMaterialPreview; error?: undefined }
  | { preview?: undefined; error: string };

/**
 * Calls ERPNext's own whitelisted `make_stock_entry` (Work Order controller) — the exact
 * method Desk's "Start" button calls — instead of recomputing outstanding-required-qty math
 * in this app. Live-confirmed on the Hetzner instance (see PROGRESS.md's Package 5 entry):
 * with no `qty` override this defaults to the Work Order's full remaining production qty
 * (`qty - produced_qty`), and `items` already contains only the PENDING materials
 * (`required_qty > transferred_qty`, `Manufacturing Settings.transfer_extra_materials_percentage`
 * headroom included), each row pre-scaled with `s_warehouse`/`t_warehouse` defaults, real
 * `actual_qty` at the source warehouse (Bin-backed, authoritative — no separate stock lookup
 * needed here), the item's own cumulative `transferred_qty` so far, and
 * `allow_alternative_item` already ANDed with the Work Order's own flag.
 *
 * `make_stock_entry` itself never throws for "nothing pending" — it just returns `items: []`
 * (the caller renders its own message for that case). A thrown error here is always a real
 * failure (permission, an ineligible Work Order that slipped past `canTransferMaterials`,
 * ERPNext down) — returned as `{ error }` rather than collapsed into the same `null`/"nothing
 * to transfer" case a permission error used to be indistinguishable from (code-review finding,
 * Package 5 — a floor user hitting a 403 deserves a different message than an empty list).
 */
export async function getMaterialTransferPreview(workOrderName: string): Promise<MaterialTransferPreviewResult> {
  try {
    const preview = await callMethodWithResult<TransferMaterialPreview>(
      "erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry",
      { work_order_id: workOrderName, purpose: "Material Transfer for Manufacture" },
    );
    return { preview };
  } catch (e) {
    if (e instanceof ErpNextError) {
      if (e.status === 403) return { error: "Not allowed to prepare a material transfer for this Work Order." };
      return { error: e.erpnextMessage ?? "ERPNext could not prepare this material transfer." };
    }
    return { error: "Something went wrong contacting ERPNext. Try again." };
  }
}

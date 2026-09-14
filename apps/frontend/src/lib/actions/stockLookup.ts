"use server";

import { listDocs } from "@/lib/erpnext";

export type BinQty = { actual_qty: number; projected_qty: number };

/**
 * Real per-warehouse stock levels from the `Bin` doctype (already readable by `Sales User`,
 * confirmed via the live DocType permissions) — the "get Stock into the Sales part" data
 * source per Phase 2D. Returns `{actual_qty: 0, projected_qty: 0}` when no Bin row exists
 * for this item/warehouse combo yet (genuinely zero stock, not an error), and `null` only
 * when the lookup itself couldn't run (missing args, or a 403/network failure — "can't
 * tell", not "there are none", matching this app's established getConnections/
 * getBilledQtyBySoDetail convention).
 *
 * Soft-warning-only by design (see DESIGN DECISIONS in the Phase 2 plan) — this is shown
 * next to a Delivery Note line as a proactive hint, never a hard client-side block.
 * ERPNext's own submit-time validation (which already accounts for `allow_negative_stock`
 * Stock Settings) remains the real authority.
 */
export async function getBinQty(itemCode: string, warehouse: string): Promise<BinQty | null> {
  if (!itemCode || !warehouse) return null;
  try {
    const rows = await listDocs<{ actual_qty: number; projected_qty: number }>("Bin", {
      fields: ["actual_qty", "projected_qty"],
      filters: [
        ["item_code", "=", itemCode],
        ["warehouse", "=", warehouse],
      ],
      limit: 1,
    });
    const row = rows[0];
    return { actual_qty: row?.actual_qty ?? 0, projected_qty: row?.projected_qty ?? 0 };
  } catch {
    return null;
  }
}

"use server";

import { getDoc, listDocs } from "@/lib/erpnext";

export type BomOption = { name: string; is_active: 0 | 1; is_default: 0 | 1; with_operations: 0 | 1 };

/**
 * Active, submitted BOMs for a given production item — called from WorkOrderForm when the
 * Production Item changes. Ordered `is_default desc` so callers can treat the first row as
 * the preferred pick when more than one exists; the form auto-selects it outright when
 * exactly one BOM comes back, or when one is explicitly flagged `is_default`.
 */
export async function listBomsForItem(itemCode: string): Promise<BomOption[]> {
  if (!itemCode) return [];
  try {
    return await listDocs<BomOption>("BOM", {
      fields: ["name", "is_active", "is_default", "with_operations"],
      filters: [
        ["item", "=", itemCode],
        ["docstatus", "=", 1],
        ["is_active", "=", 1],
      ],
      orderBy: "is_default desc",
      limit: 20,
    });
  } catch {
    return [];
  }
}

export type BomItemRow = { item_code: string; item_name: string; qty: number; uom: string; rate: number };
/**
 * Fields live-confirmed against the installed ERPNext's `BOM Operation` doctype schema
 * (`get_doctype_fields`, 2026-09-18, CX-MFG-002 remediation) that also exist on `Work Order
 * Operation` and are meaningful to carry forward at Work Order creation time — see
 * `work-orders/actions.ts`'s `buildWorkOrderFields` for exactly which are copied and why.
 * Deliberately excludes `finished_good`/`finished_good_qty`/`bom_no` (per-operation semi-finished
 * goods routing — this app doesn't build multi-level/semi-finished Work Orders yet, same
 * boundary already accepted for `required_items`' own no-BOM-explosion rule) and BOM-side
 * computed-cost fields (`cost_per_unit`, `base_cost_per_unit`, `operating_cost`,
 * `base_operating_cost`, `set_cost_based_on_bom_qty`, `is_final_finished_good`) which are BOM's
 * own costing snapshot/flags with no matching `Work Order Operation` field at all — confirmed via
 * `get_doctype_fields` against both doctypes, not assumed.
 */
export type BomOperationRow = {
  operation: string;
  workstation?: string;
  workstation_type?: string;
  sequence_id?: number;
  time_in_mins?: number;
  fixed_time?: 0 | 1;
  batch_size?: number;
  /** Transaction-currency rate (BOM's own `hour_rate`) — NOT copied to Work Order Operation.
   * Kept only in case a future BOM-currency preview needs it; see `base_hour_rate` below for
   * the field this app actually maps forward (`CX-MFG-002` final correction, 2026-09-18). */
  hour_rate?: number;
  /** Company-currency rate. Native ERPNext maps `BOM Operation.base_hour_rate` (not the
   * transaction-currency `hour_rate`) onto `Work Order Operation.hour_rate`, confirmed by
   * `Work Order Operation.hour_rate`'s own schema being a plain `Float` with no `options:
   * "currency"` link (`get_doctype_fields`, 2026-09-18) — i.e. it is not currency-symbol-aware
   * and is meant to already be in company currency. When the BOM's transaction currency equals
   * the company currency, `hour_rate === base_hour_rate` and this made no visible difference;
   * the bug only surfaces when they differ. See `work-orders/actions.ts`. */
  base_hour_rate?: number;
  quality_inspection_required?: 0 | 1;
  is_subcontracted?: 0 | 1;
  skip_material_transfer?: 0 | 1;
  backflush_from_wip_warehouse?: 0 | 1;
  source_warehouse?: string;
  wip_warehouse?: string;
  fg_warehouse?: string;
  description?: string;
};
export type BomDetail = { name: string; quantity: number; items: BomItemRow[]; operations: BomOperationRow[] } | null;

/**
 * Full BOM doc (header `quantity` + `items`/`operations` child tables). Used both for
 * WorkOrderForm.tsx's read-only preview (client-side scaling against the Work Order's own
 * `qty` is flat arithmetic on this doc's top-level `items` only —
 * `bomItem.qty * (workOrderQty / bom.quantity)`, deliberately not multi-level BOM explosion,
 * which ERPNext itself does server-side for `required_items`) and by
 * `work-orders/actions.ts`'s `createWorkOrderAction`, which re-fetches this same BOM
 * server-side to build the create payload's `operations` array — ERPNext's own `validate()`
 * populates `required_items` from `bom_no`+`qty` on insert, but leaves `operations` empty on a
 * plain REST insert (live-confirmed), so this app sends `operations` itself rather than assume
 * ERPNext will.
 */
export async function getBomDetails(bomName: string): Promise<BomDetail> {
  if (!bomName) return null;
  try {
    const doc = await getDoc<{
      name: string;
      quantity: number;
      items?: BomItemRow[];
      operations?: BomOperationRow[];
    }>("BOM", bomName);
    return {
      name: doc.name,
      quantity: doc.quantity || 1,
      items: doc.items ?? [],
      operations: doc.operations ?? [],
    };
  } catch {
    return null;
  }
}

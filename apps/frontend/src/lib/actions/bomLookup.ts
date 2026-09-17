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
export type BomOperationRow = { operation: string; workstation?: string; time_in_mins?: number; hour_rate?: number };
export type BomDetail = { name: string; quantity: number; items: BomItemRow[]; operations: BomOperationRow[] } | null;

/**
 * Full BOM doc (header `quantity` + `items`/`operations` child tables) for the read-only
 * preview on Work Order create. Client-side scaling against the Work Order's own `qty` is
 * flat arithmetic on this doc's top-level `items` only (`bomItem.qty * (workOrderQty /
 * bom.quantity)`) — deliberately not multi-level BOM explosion, which ERPNext itself does
 * server-side after the Work Order is created (`required_items`/`operations` are populated
 * by ERPNext's own `validate()`, not sent by this app).
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

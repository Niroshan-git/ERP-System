import "server-only";

export type BomComponentRowInput = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  source_warehouse?: string;
  operation?: string;
  bom_no?: string;
  allow_alternative_item?: 0 | 1;
};

/**
 * Parses BomComponentsEditor.tsx's hidden JSON field into `BOM Item` child-table rows.
 * Same technique as lib/lineRows.ts's parseLineRows, but scoped to BOM Item's own fields
 * (no batch/serial, no Pricing Rule — those are Sales/Buying-only concepts). `uom` is
 * always the component Item's own `stock_uom` (same single-UOM simplification
 * `parsePurchaseOrderItems` already uses for Purchase Order Item) — this app doesn't expose
 * a separate purchase/stock UOM selector, so `conversion_factor` is always 1 and
 * `stock_qty` always equals `qty`.
 */
export function parseBomComponentRows(formData: FormData, fieldName = "components"): BomComponentRowInput[] {
  const raw = String(formData.get(fieldName) ?? "[]");
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
      rate: Number(r.rate) || 0,
      ...(typeof r.source_warehouse === "string" && r.source_warehouse ? { source_warehouse: r.source_warehouse } : {}),
      ...(typeof r.operation === "string" && r.operation ? { operation: r.operation } : {}),
      ...(typeof r.bom_no === "string" && r.bom_no ? { bom_no: r.bom_no } : {}),
      ...(r.allow_alternative_item ? { allow_alternative_item: 1 as const } : {}),
    }))
    .filter((r) => r.qty > 0 && r.uom);
}

export type BomOperationRowInput = {
  operation: string;
  workstation?: string;
  time_in_mins: number;
  batch_size?: number;
  hour_rate?: number;
  description?: string;
};

/**
 * Parses BomOperationsEditor.tsx's hidden JSON field into `BOM Operation` child-table rows.
 * `hour_rate` here is intentionally the transaction-currency field (BOM's own `currency`,
 * not company currency) since this form collects it directly from the user for a BOM being
 * authored in that currency — unlike `work-orders/actions.ts`'s BOM→Work-Order-Operation
 * copy (CX-MFG-002), there is no `base_hour_rate` to prefer here because this is the BOM
 * itself, not a copy derived from one.
 */
export function parseBomOperationRows(formData: FormData, fieldName = "operations"): BomOperationRowInput[] {
  const raw = String(formData.get(fieldName) ?? "[]");
  let rows: unknown;
  try {
    rows = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object" && r.operation))
    .map((r) => ({
      operation: String(r.operation),
      time_in_mins: Number(r.time_in_mins) || 0,
      ...(typeof r.workstation === "string" && r.workstation ? { workstation: r.workstation } : {}),
      ...(Number(r.batch_size) > 0 ? { batch_size: Number(r.batch_size) } : {}),
      ...(Number(r.hour_rate) > 0 ? { hour_rate: Number(r.hour_rate) } : {}),
      ...(typeof r.description === "string" && r.description ? { description: r.description } : {}),
    }))
    .filter((r) => r.time_in_mins > 0);
}

import "server-only";

/** One confirmed batch/serial allocation for a line — mirrors BatchSerialPicker's own
 * BatchSerialEntry shape (kept independent here since lib/ is server-only and can't import
 * a "use client" component's type). */
export type BatchSerialEntryInput = { batch_no?: string; serial_no?: string; qty: number };

export type LineRowInput = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  /**
   * Present only when this row is still tagged as coming from a specific Quotation Item
   * row — set by "Copy From Quotation" (CopyFromQuotationPanel/LineItemsEditor) and
   * cleared the moment the user swaps that row's item (see LineItemsEditor's
   * onItemChange). Only meaningful for Sales Order — carried here generically since
   * parseLineRows is shared across Quotation/Sales Order/Sales Invoice, but only
   * orders/actions.ts's buildSalesOrderFields actually reads these to set
   * `quotation_item`/`prevdoc_docname` on save and to re-validate remaining qty.
   */
  quotation_item?: string;
  /** The source Quotation's own name — becomes `prevdoc_docname` on save. Paired with
   * quotation_item; both are set together or not at all (see the tagging logic above). */
  source_quotation?: string;
  /**
   * Delivery-Note-only fields (Phase 2C/2D) — carried here generically, same as the
   * Quotation tag fields above, since parseLineRows is shared. Only
   * delivery-notes/actions.ts actually reads these: `warehouse` (the line's stock-moving
   * warehouse, defaulted client-side from the company default) and `batchSerialEntries`
   * (the confirmed BatchSerialPicker selection, attached via the two-step
   * add_serial_batch_ledgers flow after the Delivery Note itself is inserted — never sent
   * as part of the initial createDoc payload).
   */
  warehouse?: string;
  batchSerialEntries?: BatchSerialEntryInput[];
};

/** Parses the hidden JSON field LineItemsEditor.tsx submits into clean, validated rows. */
export function parseLineRows(formData: FormData, fieldName: string): LineRowInput[] {
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
    .map((r) => {
      const quotation_item = typeof r.quotation_item === "string" && r.quotation_item ? r.quotation_item : undefined;
      const source_quotation =
        typeof r.source_quotation === "string" && r.source_quotation ? r.source_quotation : undefined;
      const warehouse = typeof r.warehouse === "string" && r.warehouse ? r.warehouse : undefined;
      const batchSerialEntries = parseBatchSerialEntries(r.batchSerialEntries);
      return {
        item_code: String(r.item_code),
        item_name: String(r.item_name || r.item_code),
        qty: Number(r.qty) || 0,
        uom: String(r.uom || ""),
        rate: Number(r.rate) || 0,
        // Both-or-neither — a half-set tag is meaningless and must not reach ERPNext.
        ...(quotation_item && source_quotation ? { quotation_item, source_quotation } : {}),
        ...(warehouse ? { warehouse } : {}),
        ...(batchSerialEntries.length > 0 ? { batchSerialEntries } : {}),
      };
    })
    .filter((r) => r.qty > 0 && r.uom);
}

function parseBatchSerialEntries(value: unknown): BatchSerialEntryInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((e): e is Record<string, unknown> => Boolean(e && typeof e === "object"))
    .map((e) => ({
      batch_no: typeof e.batch_no === "string" && e.batch_no ? e.batch_no : undefined,
      serial_no: typeof e.serial_no === "string" && e.serial_no ? e.serial_no : undefined,
      qty: Number(e.qty) || 0,
    }))
    .filter((e) => e.qty > 0 && (e.batch_no || e.serial_no));
}

export type LineSelectionInput = {
  reference: string;
  qty: number;
  /** Delivery-Note-only (Sales-Order -> Delivery-Note create-delivery flow, see
   * LineSelectionEditor.tsx) — same BatchSerialPicker selection as LineRowInput's own
   * field above, carried through generically since parseLineSelectionRows is shared with
   * the Sales-Order -> Sales-Invoice / Delivery-Note -> Sales-Invoice flows that don't use it. */
  batchSerialEntries?: BatchSerialEntryInput[];
};

/**
 * Parses the hidden JSON field LineSelectionEditor.tsx submits — same technique as
 * parseLineRows above, but for a partial-fulfillment "select lines & quantities" step
 * (Quotation -> Sales Order, Sales Order -> Sales Invoice, Sales Order -> Delivery Note).
 * Each row only carries a `reference` back to the source child-table row (the Quotation
 * Item's/Sales Order Item's own `name`) plus the qty requested for that line — deliberately
 * not item_code/uom/rate, so the caller always re-derives those from the authoritative
 * source document itself rather than trusting client-supplied item data.
 */
export function parseLineSelectionRows(formData: FormData, fieldName: string): LineSelectionInput[] {
  const raw = String(formData.get(fieldName) ?? "[]");
  let rows: unknown;
  try {
    rows = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object" && r.reference))
    .map((r) => {
      const batchSerialEntries = parseBatchSerialEntries(r.batchSerialEntries);
      return {
        reference: String(r.reference),
        qty: Number(r.qty) || 0,
        ...(batchSerialEntries.length > 0 ? { batchSerialEntries } : {}),
      };
    })
    .filter((r) => r.qty > 0);
}

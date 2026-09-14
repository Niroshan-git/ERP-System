import "server-only";

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
      return {
        item_code: String(r.item_code),
        item_name: String(r.item_name || r.item_code),
        qty: Number(r.qty) || 0,
        uom: String(r.uom || ""),
        rate: Number(r.rate) || 0,
        // Both-or-neither — a half-set tag is meaningless and must not reach ERPNext.
        ...(quotation_item && source_quotation ? { quotation_item, source_quotation } : {}),
      };
    })
    .filter((r) => r.qty > 0 && r.uom);
}

export type LineSelectionInput = { reference: string; qty: number };

/**
 * Parses the hidden JSON field LineSelectionEditor.tsx submits — same technique as
 * parseLineRows above, but for a partial-fulfillment "select lines & quantities" step
 * (Quotation -> Sales Order, Sales Order -> Sales Invoice). Each row only carries a
 * `reference` back to the source child-table row (the Quotation Item's/Sales Order
 * Item's own `name`) plus the qty requested for that line — deliberately not
 * item_code/uom/rate, so the caller always re-derives those from the authoritative
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
    .map((r) => ({ reference: String(r.reference), qty: Number(r.qty) || 0 }))
    .filter((r) => r.qty > 0);
}

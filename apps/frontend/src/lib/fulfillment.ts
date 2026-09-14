import "server-only";
import { getDoc, listDocs } from "@/lib/erpnext";

type InvoiceItemRow = { so_detail?: string; qty: number };
type SalesInvoiceForBilling = { name: string; items: InvoiceItemRow[] };

export type QuotationLineInfo = {
  item_code: string;
  item_name: string;
  uom: string;
  rate: number;
  qty: number;
  /** Real, live ERPNext field on Quotation Item — auto-maintained by ERPNext's own
   * status_updater whenever a Sales Order Item is submitted/cancelled with
   * `quotation_item` set to this row's `name` (confirmed live on the Hetzner server
   * while building the dedicated /sales/quotations/[name]/create-order flow). */
  ordered_qty?: number;
};

/** "Remaining qty to order" for one Quotation Item row — the one formula both the
 * dedicated create-order flow and "Copy From Quotation"'s tagged-row re-validation need
 * to agree on. */
export function remainingQuotationLineQty(item: { qty: number; ordered_qty?: number }): number {
  return item.qty - (item.ordered_qty ?? 0);
}

type QuotationForLines = { name: string; docstatus: number; items: (QuotationLineInfo & { name: string })[] };

/**
 * One Quotation's lines, keyed by each Quotation Item row's own `name` — the same
 * reference `quotation_item` points at. Returns null if the Quotation can't be loaded
 * (deleted, 403, etc.) rather than throwing, so callers can turn that into a clear
 * "reload and try again" message instead of a raw crash.
 *
 * Shared by the dedicated create-order flow (orders/actions.ts's
 * createSalesOrderFromQuotationAction) and the "Copy From Quotation" flow's
 * save-time re-validation of already-tagged rows (buildSalesOrderFields) — both need
 * "what's actually left to order on this exact Quotation line, right now" computed the
 * same way, not trusted from an earlier client-side snapshot.
 */
export async function getQuotationLinesByReference(quotationName: string): Promise<Record<string, QuotationLineInfo> | null> {
  try {
    const doc = await getDoc<QuotationForLines>("Quotation", quotationName);
    const map: Record<string, QuotationLineInfo> = {};
    for (const item of doc.items) {
      map[item.name] = item;
    }
    return map;
  } catch {
    return null;
  }
}

/**
 * How much of each Sales Order line has actually been invoiced — the real basis for
 * "remaining qty to invoice" on a partial-billing flow.
 *
 * There is NO stored `billed_qty` field on Sales Order Item in this ERPNext version —
 * confirmed by reading `sales_order_item.json` on the live server: the only billing
 * field stored there is `billed_amt` (a Currency amount, used for pending *amount*
 * calculations), not a qty. ERPNext's own `sales_order.py::make_sales_invoice` computes
 * "how much of this line is already billed" with a live query joining Sales Invoice Item
 * (`so_detail`) to Sales Order Item (`name`), summing `qty` across Submitted invoices —
 * see `get_billed_qty_by_item()` in that file. This replicates that same query the only
 * way this app can (no raw SQL/joins over REST): list the Submitted Sales Invoices linked
 * to this order (same child-table filter-tuple technique as lib/connections.ts), fetch
 * each one's full `items`, and sum `qty` grouped by `so_detail` client-side. Order-level
 * invoice counts are small in practice, so the extra per-invoice fetch is a reasonable
 * cost for correctness here.
 */
export async function getBilledQtyBySoDetail(salesOrderName: string): Promise<Record<string, number>> {
  const invoices = await listDocs<{ name: string; docstatus: number }>("Sales Invoice", {
    fields: ["name", "docstatus"],
    filters: [["Sales Invoice Item", "sales_order", "=", salesOrderName]],
    limit: 500,
  });
  const submittedNames = Array.from(new Set(invoices.filter((d) => d.docstatus === 1).map((d) => d.name)));

  const docs = await Promise.all(
    submittedNames.map((invName) => getDoc<SalesInvoiceForBilling>("Sales Invoice", invName).catch(() => null)),
  );

  const billed: Record<string, number> = {};
  for (const doc of docs) {
    if (!doc) continue; // a 403/404 here means "can't tell" — omit rather than lie.
    for (const item of doc.items) {
      if (!item.so_detail) continue;
      billed[item.so_detail] = (billed[item.so_detail] ?? 0) + Number(item.qty || 0);
    }
  }
  return billed;
}

import type { DocStatus } from "@/lib/docStatus";

export type StatusTone = "success" | "alert" | "signal" | "neutral";
export type StatusDisplay = { label: string; tone: StatusTone };

/**
 * Real per-doctype status display, replacing the generic Draft/Submitted/Cancelled label
 * this app started with. ERPNext's own list views (`*_list.js`, read directly off the live
 * server) color-code a much richer `status` field per doctype — e.g. a Submitted Sales
 * Order is "To Deliver and Bill"/"Completed"/"Overdue", not just "Submitted". Matching that
 * is what the user asked for after seeing ERPNext's own Sales Order list.
 *
 * Tone mapping deliberately collapses ERPNext's palette (green/orange/red/yellow/gray) onto
 * this app's three status tones (success/alert/neutral) rather than introducing new colors —
 * `docs/brand/package/ceylon-stack-frontend-design.md` is explicit that status colors reuse
 * signal/alert/success consistently instead of one color per status, and `alert` is defined
 * there as covering "warnings, overdue items, validation errors" — so orange/red/yellow all
 * become `alert` here, matching that design rule intentionally, not by omission.
 */

function isOverdue(deliveryDate: string | undefined): boolean {
  if (!deliveryDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(deliveryDate) < today;
}

/**
 * Mirrors `sales_order_list.js`'s `get_indicator` (confirmed on the live server). The
 * stored `status` field's enum (Draft/On Hold/To Pay/To Deliver and Bill/To Bill/To
 * Deliver/Completed/Cancelled/Closed — checked against the live DocType JSON) never
 * contains "Overdue": that label is a cosmetic, date-dependent override Desk computes at
 * render time by comparing `delivery_date` to today, so it's recomputed here the same way
 * rather than trusted as a stored value. The `advance_payment_status === "Requested"`
 * ("To Pay") branch from the original is skipped — this app doesn't track advance payment
 * requests, out of scope for the Selling module built so far.
 */
export function salesOrderStatus(doc: {
  status: string;
  docstatus: DocStatus;
  per_delivered: number;
  per_billed: number;
  delivery_date?: string;
}): StatusDisplay {
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  if (doc.status === "Closed" || doc.status === "Completed") return { label: doc.status, tone: "success" };
  if (doc.per_delivered < 100 && isOverdue(doc.delivery_date)) return { label: "Overdue", tone: "alert" };
  // On Hold / To Deliver and Bill / To Bill / To Deliver
  return { label: doc.status, tone: "alert" };
}

/** Mirrors `quotation_list.js`'s `get_indicator` (confirmed on the live server). */
const QUOTATION_STATUS_TONE: Record<string, StatusTone> = {
  Open: "alert",
  Replied: "alert",
  "Partially Ordered": "alert",
  Ordered: "success",
  Lost: "neutral",
  Expired: "neutral",
};

export function quotationStatus(doc: { status: string; docstatus: DocStatus }): StatusDisplay {
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  return { label: doc.status, tone: QUOTATION_STATUS_TONE[doc.status] ?? "alert" };
}

/**
 * Mirrors `sales_invoice_list.js`'s `status_colors` map (confirmed on the live server).
 * Unlike Sales Order/Quotation, Sales Invoice's own `status` field enum already includes
 * "Draft"/"Submitted"/"Cancelled" as literal values (checked against the live DocType
 * JSON), so this trusts `status` directly with no docstatus override — including
 * ERPNext's own unusual choice to color a Draft invoice red (`alert`), not neutral.
 */
const SALES_INVOICE_STATUS_TONE: Record<string, StatusTone> = {
  Draft: "alert",
  Return: "neutral",
  "Credit Note Issued": "neutral",
  Submitted: "signal",
  Paid: "success",
  "Partly Paid": "alert",
  Unpaid: "alert",
  "Unpaid and Discounted": "alert",
  "Partly Paid and Discounted": "alert",
  "Overdue and Discounted": "alert",
  Overdue: "alert",
  Cancelled: "alert",
  "Internal Transfer": "neutral",
};

export function salesInvoiceStatus(doc: { status: string }): StatusDisplay {
  return { label: doc.status, tone: SALES_INVOICE_STATUS_TONE[doc.status] ?? "neutral" };
}

/**
 * Mirrors `delivery_note_list.js`'s `get_indicator` (confirmed on the live server, function
 * body read directly, not guessed):
 * ```
 * is_return && status=="Return"   -> "Return"            (gray)
 * status=="Closed"                -> "Closed"             (green)
 * status=="Return Issued"         -> "Return Issued"      (grey)
 * per_billed == 0                 -> "To Bill"            (orange)
 * 0 < per_billed < 100            -> "Partially Billed"   (yellow)
 * per_billed == 100               -> "Completed"          (green)
 * ```
 * Delivery Note has no `delivery_date`/`per_delivered` of its own (those are Sales Order
 * Item concepts) — this doc's live-relevant fields are `per_billed` and `is_return`
 * instead, so unlike `salesOrderStatus` there's no date-driven "Overdue" override here.
 * Draft/Cancelled short-circuit the same way `salesOrderStatus` does.
 */
export function deliveryNoteStatus(doc: {
  status: string;
  docstatus: DocStatus;
  per_billed: number;
  is_return?: 0 | 1;
}): StatusDisplay {
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  if (doc.is_return && doc.status === "Return") return { label: "Return", tone: "neutral" };
  if (doc.status === "Closed") return { label: "Closed", tone: "success" };
  if (doc.status === "Return Issued") return { label: "Return Issued", tone: "neutral" };
  if (doc.per_billed === 0) return { label: "To Bill", tone: "alert" };
  if (doc.per_billed < 100) return { label: "Partially Billed", tone: "alert" };
  return { label: "Completed", tone: "success" };
}

/**
 * Pick List's own `status` enum (confirmed via the live DocType JSON): Draft / Open /
 * Partly Delivered / Partially Transferred / Completed / Cancelled. Unlike Delivery Note,
 * there's no separate list.js indicator to mirror here (Pick List has no Desk list view
 * indicator override worth replicating) — this just applies the same
 * docstatus-first-then-status-map shape the other status functions use, collapsed onto
 * this app's three tones the same way.
 */
export function pickListStatus(doc: { status: string; docstatus: DocStatus }): StatusDisplay {
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  if (doc.status === "Completed") return { label: "Completed", tone: "success" };
  // Open / Partly Delivered / Partially Transferred
  return { label: doc.status, tone: "alert" };
}

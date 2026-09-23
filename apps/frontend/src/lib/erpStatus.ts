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

/**
 * Mirrors `material_request_list.js`'s `get_indicator` (confirmed on the live server, read
 * directly, not guessed), filtered down to only the branches reachable when
 * `material_request_type` is always "Purchase" in this app (Buying is Purchase-only —
 * see buying/material-requests/actions.ts). The real function body:
 * ```
 * status == "Stopped"                          -> "Stopped"            (red)
 * docstatus == 1 && per_ordered == 0            -> "Pending"           (orange)
 * docstatus == 1 && per_ordered < 100           -> "Partially Ordered" (yellow)
 * docstatus == 1 && per_ordered == 100:
 *   0 < per_received < 100                      -> "Partially Received"(yellow)
 *   per_received == 100                         -> "Received"          (green)
 *   else (per_received == 0)                    -> "Ordered"           (green)
 * ```
 * The `transfer_status`/Material Transfer/Manufacture/Customer Provided branches in the
 * real file are dropped entirely — they only ever fire for
 * `material_request_type != "Purchase"`, which never occurs here.
 */
export function materialRequestStatus(doc: {
  status: string;
  docstatus: DocStatus;
  per_ordered: number;
  per_received: number;
}): StatusDisplay {
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  if (doc.status === "Stopped") return { label: "Stopped", tone: "alert" };
  if (doc.per_ordered === 0) return { label: "Pending", tone: "alert" };
  if (doc.per_ordered < 100) return { label: "Partially Ordered", tone: "alert" };
  if (doc.per_received > 0 && doc.per_received < 100) return { label: "Partially Received", tone: "alert" };
  if (doc.per_received === 100) return { label: "Received", tone: "success" };
  return { label: "Ordered", tone: "success" };
}

/**
 * Request for Quotation has NO custom Desk list-view indicator to mirror — confirmed by a
 * directory search on the live server: there is no `request_for_quotation_list.js` at all
 * (unlike every other doctype in this file, which all have one). It falls back to Frappe
 * core's generic docstatus-only indicator (`listview_settings` default), which is just:
 * Draft (docstatus 0) = red, Submitted (docstatus 1) = blue, Cancelled (docstatus 2) = red.
 * Deliberately left this plain rather than inventing richer status logic that doesn't
 * actually exist for this doctype.
 */
export function rfqStatus(doc: { docstatus: DocStatus }): StatusDisplay {
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  return { label: "Submitted", tone: "signal" };
}

/**
 * Mirrors `supplier_quotation_list.js`'s `get_indicator` (confirmed on the live server).
 * The real function body only explicitly colors 3 outcomes, then falls through to the
 * generic docstatus indicator for everything else:
 * ```
 * doc.status === "Ordered"   -> "Ordered" (green)
 * doc.status === "Rejected"  -> "Lost"    (gray)   // checks "Rejected", labels it "Lost"
 * doc.status === "Expired"   -> "Expired" (gray)
 * else -> generic docstatus indicator
 * ```
 * NOTE — deliberate discrepancy, do not "fix": the declared `status` Select field's options
 * (Draft/Submitted/Stopped/Cancelled/Expired, confirmed via the live DocType JSON) do NOT
 * include "Ordered" or "Rejected" as literal enum values. Frappe still allows the stored
 * value to be set to one of these outside the declared options via server-side `db_set` —
 * this happens when a Purchase Order gets created from the quotation (sets "Ordered") or
 * when a competing quotation wins (sets "Rejected"). Both branches are handled here
 * defensively even though they're not (yet) reachable from anything this app itself writes.
 */
const SUPPLIER_QUOTATION_STATUS_TONE: Record<string, StatusTone> = {
  Ordered: "success",
  Rejected: "neutral", // real label is "Lost" — see doc comment above
  Expired: "neutral",
};

const SUPPLIER_QUOTATION_STATUS_LABEL: Record<string, string> = {
  Rejected: "Lost",
};

export function supplierQuotationStatus(doc: { status: string; docstatus: DocStatus }): StatusDisplay {
  if (SUPPLIER_QUOTATION_STATUS_TONE[doc.status]) {
    return { label: SUPPLIER_QUOTATION_STATUS_LABEL[doc.status] ?? doc.status, tone: SUPPLIER_QUOTATION_STATUS_TONE[doc.status] };
  }
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  // docstatus 1 with a status the real get_indicator doesn't special-case (Submitted or
  // Stopped) — the generic fallback indicator is purely docstatus-driven, not status-text-
  // driven, so this shows the same "Submitted" every other docstatus-1 fallback would,
  // same as rfqStatus's own fallback above.
  return { label: "Submitted", tone: "signal" };
}

/**
 * Mirrors `purchase_order_list.js`'s real `get_indicator`. NOTE: this session had no network
 * access to the live Hetzner server (confirmed by a failed test connection) — the function
 * body below was supplied pre-verified by the task that scoped this build (its author states
 * it was read directly from the live `get_indicator` source via SSH), not independently
 * re-checked here:
 * ```
 * status == "Closed"                                    -> "Closed"                (green)
 * status == "On Hold"                                    -> "On Hold"               (orange)
 * status == "Delivered"                                  -> "Delivered"             (green)
 * per_received < 100 && status != "Closed":
 *   per_billed < 100                                      -> "To Receive and Bill"   (orange)
 *   else                                                   -> "To Receive"           (orange)
 * per_received >= 100 && per_billed < 100 && status != "Closed"  -> "To Bill"        (orange)
 * per_received >= 100 && per_billed == 100 && status != "Closed" -> "Completed"      (green)
 * ```
 * Frappe core's own Draft/Cancelled docstatus short-circuit runs first (see this file's
 * top-of-module doc comment on the precedence rule) — Purchase Order's own `_list.js` sets
 * neither `has_indicator_for_draft` nor `has_indicator_for_cancelled`, confirmed on the live
 * server, so the branches above only ever apply at docstatus 1. `advance_payment_status` is
 * out of scope here too — same "out of scope" call salesOrderStatus already made for Sales
 * Order's own advance-payment branch.
 */
export function purchaseOrderStatus(doc: {
  status: string;
  docstatus: DocStatus;
  per_billed: number;
  per_received: number;
}): StatusDisplay {
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  if (doc.status === "Closed") return { label: "Closed", tone: "success" };
  if (doc.status === "On Hold") return { label: "On Hold", tone: "alert" };
  if (doc.status === "Delivered") return { label: "Delivered", tone: "success" };
  if (doc.per_received < 100 && doc.status !== "Closed") {
    return doc.per_billed < 100
      ? { label: "To Receive and Bill", tone: "alert" }
      : { label: "To Receive", tone: "alert" };
  }
  if (doc.per_received >= 100 && doc.per_billed < 100 && doc.status !== "Closed") {
    return { label: "To Bill", tone: "alert" };
  }
  if (doc.per_received >= 100 && doc.per_billed === 100 && doc.status !== "Closed") {
    return { label: "Completed", tone: "success" };
  }
  // Nothing above matched (shouldn't normally happen given the branches are exhaustive over
  // per_received/per_billed's possible ranges) — same generic docstatus-1 fallback shape
  // every other status function in this file uses.
  return { label: doc.status || "Submitted", tone: "alert" };
}

/**
 * Mirrors `purchase_receipt_list.js`'s real `get_indicator` — same not-independently-
 * re-verified-this-session caveat as purchaseOrderStatus above (no live network access;
 * logic supplied pre-verified by the scoping task):
 * ```
 * is_return && status == "Return"          -> "Return"         (gray)
 * status == "Closed"                       -> "Closed"          (green)
 * per_returned == 100                      -> "Return Issued"   (gray)
 * grand_total != 0 && per_billed == 0      -> "To Bill"         (orange)
 * per_billed > 0 && per_billed < 100       -> "Partly Billed"    (yellow)
 * grand_total == 0 || per_billed >= 100    -> "Completed"       (green)
 * ```
 * Same Draft/Cancelled docstatus-first precedence as purchaseOrderStatus above — Purchase
 * Receipt's own `_list.js` sets neither `has_indicator_for_draft` nor
 * `has_indicator_for_cancelled` either, confirmed on the live server.
 */
export function purchaseReceiptStatus(doc: {
  status: string;
  docstatus: DocStatus;
  per_billed: number;
  per_returned: number;
  grand_total: number;
  is_return?: 0 | 1;
}): StatusDisplay {
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  if (doc.is_return && doc.status === "Return") return { label: "Return", tone: "neutral" };
  if (doc.status === "Closed") return { label: "Closed", tone: "success" };
  if (doc.per_returned === 100) return { label: "Return Issued", tone: "neutral" };
  if (doc.grand_total !== 0 && doc.per_billed === 0) return { label: "To Bill", tone: "alert" };
  if (doc.per_billed > 0 && doc.per_billed < 100) return { label: "Partly Billed", tone: "alert" };
  if (doc.grand_total === 0 || doc.per_billed >= 100) return { label: "Completed", tone: "success" };
  return { label: doc.status || "Submitted", tone: "alert" };
}

/**
 * Mirrors `purchase_invoice_list.js`'s real `status_colors` map + `get_indicator` — same
 * not-independently-re-verified-this-session caveat as the two functions above. Like `salesInvoiceStatus`, Purchase
 * Invoice's own `status` field enum already includes "Draft"/"Submitted"/"Cancelled" as
 * literal stored values (confirmed via the live DocType JSON) — this is the one Buying
 * doctype in this trio that trusts `status` directly, with NO docstatus pre-check (see this
 * file's top-of-module doc comment on the precedence rule's stated exception):
 * ```
 * status == "Debit Note Issued"                                      -> label / neutral
 * outstanding_amount > 0 && docstatus == 1 && on_hold:
 *   !release_date                                                     -> "On Hold" / neutral
 *   release_date in the future                                        -> "Temporarily on Hold" / neutral
 *   (else — release_date today or in the past — falls through below)
 * status in {Unpaid, Paid, Return, Overdue, "Partly Paid", "Internal Transfer"}:
 *   Paid -> success; Unpaid/Overdue/"Partly Paid" -> alert; Return/"Internal Transfer" -> neutral
 * else (Draft/Submitted/Cancelled — none in the status_colors map above)
 *   -> generic docstatus fallback: 0 Draft/neutral, 1 Submitted/signal, 2 Cancelled/alert
 * ```
 * `is_paid`/`update_stock` are out of scope for this app (see the Buying plan) and play no
 * part in this mapping either way — ERPNext's own indicator doesn't branch on them.
 */
const PURCHASE_INVOICE_STATUS_TONE: Record<string, StatusTone> = {
  Paid: "success",
  Unpaid: "alert",
  Overdue: "alert",
  "Partly Paid": "alert",
  Return: "neutral",
  "Internal Transfer": "neutral",
};

/**
 * Stock Entry has no separate `status` field at all (confirmed via the live DocType JSON —
 * unlike every other doctype in this file) — Desk's own list view falls back to the generic
 * docstatus-only indicator: Draft (0) = red, Submitted (1) = blue, Cancelled (2) = red.
 * Deliberately left this plain rather than inventing status logic that doesn't exist.
 */
export function stockEntryStatus(doc: { docstatus: DocStatus }): StatusDisplay {
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  return { label: "Submitted", tone: "signal" };
}

/**
 * Work Order's own `status` Select field enum (live-verified via
 * `mcp__ceylon-stack__get_doctype_fields`, 2026-09-17): Draft / Submitted / Not Started /
 * In Process / Stock Reserved / Stock Partially Reserved / Completed / Stopped / Closed /
 * Cancelled — unlike every other doctype in this file, that enum already spells out
 * Draft/Submitted/Cancelled as literal stored values, so this trusts `status` directly with
 * no separate `docstatus` pre-check (same shape `salesInvoiceStatus` uses for the same
 * reason). This session had no way to read Work Order's actual `work_order_list.js`
 * `get_indicator` source (no SSH/devops access from this task), so the tone choices below
 * are this app's own reasonable mapping onto the three-tone system, not a mirrored Desk
 * indicator — revisit if a future session confirms the real one differs.
 */
const WORK_ORDER_STATUS_TONE: Record<string, StatusTone> = {
  Draft: "neutral",
  Submitted: "signal",
  "Not Started": "neutral",
  "In Process": "signal",
  "Stock Reserved": "signal",
  "Stock Partially Reserved": "alert",
  Completed: "success",
  Stopped: "alert",
  Closed: "success",
  Cancelled: "alert",
};

export function workOrderStatus(doc: { status: string }): StatusDisplay {
  return { label: doc.status, tone: WORK_ORDER_STATUS_TONE[doc.status] ?? "neutral" };
}

/**
 * Mirrors ERPNext Desk's own "Start" button visibility rule for Material Transfer for
 * Manufacture (`erpnext.work_order.set_custom_buttons` in `work_order.js`, live-read on the
 * Hetzner instance) rather than guessing at status logic:
 *
 * ```
 * doc.docstatus === 1 && !["Closed","Completed"].includes(doc.status) && doc.status !==
 * "Stopped" && !doc.skip_transfer && doc.transfer_material_against !== "Job Card" &&
 * !doc.track_semi_finished_goods && required_items.some(i => transferred_qty < required_qty)
 * ```
 *
 * Desk shows "Additional Material Transfer" instead once nothing is pending but
 * `Manufacturing Settings.transfer_extra_materials_percentage` still allows headroom — out of
 * scope here (that setting is 0% on this instance, live-confirmed in the Package 4
 * investigation) so this only covers the plain "still has pending materials" case.
 */
export function canTransferMaterials(doc: {
  docstatus: number;
  status: string;
  skip_transfer?: 0 | 1;
  transfer_material_against?: string;
  track_semi_finished_goods?: 0 | 1;
  required_items?: { required_qty: number; transferred_qty?: number }[];
}): { allowed: boolean; reason?: string } {
  if (doc.docstatus !== 1) {
    return { allowed: false, reason: "Work Order must be submitted before transferring materials." };
  }
  if (["Closed", "Completed", "Stopped"].includes(doc.status)) {
    return { allowed: false, reason: `Not available while the Work Order is ${doc.status}.` };
  }
  if (doc.skip_transfer) {
    return { allowed: false, reason: "This Work Order skips the material transfer step." };
  }
  if (doc.transfer_material_against === "Job Card") {
    return { allowed: false, reason: "Material is transferred per Job Card for this Work Order, not here." };
  }
  if (doc.track_semi_finished_goods) {
    return { allowed: false, reason: "Not available for Work Orders tracking semi-finished goods." };
  }
  const pending = (doc.required_items ?? []).some((i) => (i.transferred_qty ?? 0) < i.required_qty);
  if (!pending) {
    return { allowed: false, reason: "All required materials have already been transferred." };
  }
  return { allowed: true };
}

/**
 * Eligibility gate for the Manufacture Stock Entry ("Complete Production") action
 * (MFG-CLOSE-1). Unlike `canTransferMaterials`, this app never read ERPNext Desk's own
 * `set_custom_buttons` source for the Manufacture/"Finish" button this session (no browser/SSH
 * source read for that specific button — the underlying `make_stock_entry(purpose="Manufacture")`
 * mechanics were, see `workOrderManufacture.ts`) — so this is a deliberately conservative,
 * server-enforced-anyway gate, not a mirrored Desk indicator:
 *
 * - `docstatus === 1` and `status` not in `{Closed, Completed, Stopped}` — same submitted/active
 *   requirement `canTransferMaterials` uses; a Work Order that's already `Completed` has nothing
 *   left to produce, confirmed by the remaining-qty check below anyway.
 * - `!track_semi_finished_goods` — same boundary `canTransferMaterials` draws: this app doesn't
 *   build multi-level/semi-finished-goods routing (`work-order.md`'s `MFG-CALC-001`/operations
 *   table note), and semi-finished Work Orders route Manufacture-purpose entries differently
 *   server-side (`load_items_from_bom`'s FG/Semi-FG branching).
 * - `transfer_material_against !== "Job Card"` — Job Card lifecycle is explicitly out of scope
 *   for this app (no Job Card list/detail/complete UI exists); a Job-Card-driven Work Order's
 *   normal path is to complete production through its Job Cards, not this generic action. This
 *   frontend-only restriction fails closed rather than allowing a Manufacture entry around a
 *   workflow this app doesn't otherwise support.
 * - remaining qty (`qty - produced_qty`) `> 0` — nothing left to manufacture otherwise; this is
 *   also the exact quantity `make_stock_entry` itself defaults `fg_completed_qty` to.
 *
 * `skip_transfer` is deliberately NOT checked here (unlike `canTransferMaterials`, which blocks
 * on it): a Work Order that skips the transfer step still needs a Manufacture entry to actually
 * produce — `skip_transfer` only changes where `make_stock_entry` sources raw materials from
 * (`work_order.source_warehouse` instead of WIP, source-confirmed), not whether Manufacture is
 * allowed.
 */
export function canCompleteProduction(doc: {
  docstatus: number;
  status: string;
  qty: number;
  produced_qty?: number;
  track_semi_finished_goods?: 0 | 1;
  transfer_material_against?: string;
}): { allowed: boolean; reason?: string } {
  if (doc.docstatus !== 1) {
    return { allowed: false, reason: "Work Order must be submitted before production can be completed." };
  }
  if (["Closed", "Completed", "Stopped"].includes(doc.status)) {
    return { allowed: false, reason: `Not available while the Work Order is ${doc.status}.` };
  }
  if (doc.track_semi_finished_goods) {
    return { allowed: false, reason: "Not available for Work Orders tracking semi-finished goods." };
  }
  if (doc.transfer_material_against === "Job Card") {
    return { allowed: false, reason: "Production is completed per Job Card for this Work Order, not here." };
  }
  const remaining = doc.qty - (doc.produced_qty ?? 0);
  if (remaining <= 0) {
    return { allowed: false, reason: "This Work Order has already been fully produced." };
  }
  return { allowed: true };
}

/**
 * Eligibility gate for Work Order Cancel (`MFG-WO-LC-1`). Source-verified against the live
 * v16.34.2 install (`erpnext/manufacturing/doctype/work_order/work_order.py`), then live-tested
 * against disposable fixtures — see `docs/backend/05-manufacturing/work-order.md`'s "Cancel
 * contract" for the full dependency matrix. Two things this deliberately does NOT do, both
 * confirmed live rather than assumed:
 *
 * - **Does not block `status === "Completed"`.** Unlike `canTransferMaterials`/
 *   `canCompleteProduction`, which both exclude Completed, ERPNext's own `on_cancel()` ->
 *   `validate_cancel()` has no status-based restriction beyond `"Stopped"` — a fully completed
 *   Work Order is genuinely cancellable natively (live-confirmed: a Work Order with
 *   `produced_qty` fully filled cancelled cleanly once its Stock Entries were cancelled first).
 *   Excluding Completed here would hide a real, ERPNext-native action.
 * - **Does not proactively re-derive the Stock Entry/Job Card dependency check itself** — that
 *   lives in `lib/connections.ts`'s new `"Work Order"` entry (`getConnections`), reused by both
 *   this page's preview and `cancelWorkOrderAction`'s own re-derived, authoritative check. This
 *   function only covers the two conditions ERPNext's `validate_cancel()` itself checks structurally
 *   (docstatus, `Stopped` status) — the same "check what this doctype's own controller checks,
 *   leave everything else to the real backend" boundary `canTransferMaterials`/
 *   `canCompleteProduction` already draw.
 *
 * `docstatus !== 1` covers both Draft (0 — nothing to cancel yet; Frappe's own generic
 * docstatus-transition guard would reject it anyway, `DocstatusTransitionError`, live-confirmed)
 * and already-Cancelled (2 — Frappe rejects with `ValidationError: Cannot edit cancelled
 * document`, live-confirmed) with one shared, friendlier message each rather than surfacing
 * ERPNext's generic error for a state the UI could simply not offer the button in.
 */
export function canCancelWorkOrder(doc: {
  docstatus: number;
  status: string;
}): { allowed: boolean; reason?: string } {
  if (doc.docstatus === 0) {
    return { allowed: false, reason: "A Draft Work Order has nothing to cancel yet." };
  }
  if (doc.docstatus === 2) {
    return { allowed: false, reason: "This Work Order is already cancelled." };
  }
  if (doc.status === "Stopped") {
    return { allowed: false, reason: "This Work Order is Stopped — unstop it first, then cancel." };
  }
  return { allowed: true };
}

/**
 * BOM has no separate `status` Select field of its own (live-confirmed via
 * `get_doctype_fields`, 2026-09-19 Manufacturing Masters (BOM) investigation — see
 * `docs/backend/05-manufacturing/bom.md`'s Identity/Status tables) — only the standard
 * submittable `docstatus` (it has an `amended_from` field, same amend-pattern as every other
 * submittable doctype in this file). No Desk `bom_list.js` `get_indicator` source was read
 * this session (no SSH/devops access), so — same caveat as `stockEntryStatus`/`rfqStatus`
 * above — this is the generic docstatus-only fallback shape, not a mirrored Desk indicator.
 * Tracked as `NEEDS_VERIFICATION` in `docs/backend/99-unverified/unverified-behaviours.md`.
 */
export function bomStatus(doc: { docstatus: DocStatus }): StatusDisplay {
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  return { label: "Submitted", tone: "signal" };
}

/**
 * Production Plan's own `status` Select field enum (schema-verified via
 * `mcp__ceylon-stack__get_doctype_fields`, 2026-09-19 discovery package — see
 * `docs/backend/05-manufacturing/production-plan.md`): Draft / Submitted / Not Started /
 * In Process / Completed / Closed / Cancelled / Material Requested — server-calculated via
 * `set_status()`, never set directly by a user. Like `workOrderStatus`/`salesInvoiceStatus`,
 * that enum already spells out Draft/Submitted/Cancelled as literal stored values, so this
 * trusts `status` directly with no separate `docstatus` pre-check. No live Production Plan
 * document exists on this instance (zero live documents, confirmed by the discovery
 * package) and no Desk `production_plan_list.js` `get_indicator` source was read this
 * session — same caveat as `workOrderStatus`: this is this app's own reasonable mapping
 * onto the three-tone system, not a mirrored Desk indicator. Tracked under `MFG-UNV-012`.
 */
const PRODUCTION_PLAN_STATUS_TONE: Record<string, StatusTone> = {
  Draft: "neutral",
  Submitted: "signal",
  "Not Started": "neutral",
  "In Process": "signal",
  Completed: "success",
  Closed: "success",
  Cancelled: "alert",
  "Material Requested": "signal",
};

export function productionPlanStatus(doc: { status: string }): StatusDisplay {
  return { label: doc.status, tone: PRODUCTION_PLAN_STATUS_TONE[doc.status] ?? "neutral" };
}

export function purchaseInvoiceStatus(doc: {
  status: string;
  docstatus: DocStatus;
  outstanding_amount: number;
  on_hold?: 0 | 1;
  release_date?: string;
}): StatusDisplay {
  if (doc.status === "Debit Note Issued") return { label: doc.status, tone: "neutral" };

  if (doc.outstanding_amount > 0 && doc.docstatus === 1 && doc.on_hold) {
    if (!doc.release_date) return { label: "On Hold", tone: "neutral" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(doc.release_date) > today) return { label: "Temporarily on Hold", tone: "neutral" };
    // release_date has passed — falls through to the plain status mapping below, same as
    // ERPNext's own real indicator does once the hold has effectively expired.
  }

  if (PURCHASE_INVOICE_STATUS_TONE[doc.status]) {
    return { label: doc.status, tone: PURCHASE_INVOICE_STATUS_TONE[doc.status] };
  }

  // Draft/Submitted/Cancelled (or any other value not in the status_colors map) — generic
  // docstatus-driven fallback, same shape used elsewhere in this file.
  if (doc.docstatus === 0) return { label: "Draft", tone: "neutral" };
  if (doc.docstatus === 2) return { label: "Cancelled", tone: "alert" };
  return { label: "Submitted", tone: "signal" };
}

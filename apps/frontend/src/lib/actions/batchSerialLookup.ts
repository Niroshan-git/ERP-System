"use server";

import { callMethodWithResult, getDoc } from "@/lib/erpnext";

const BUNDLE_MODULE = "erpnext.stock.doctype.serial_and_batch_bundle.serial_and_batch_bundle";

/**
 * One available batch, as returned by `get_auto_data` (real ERPNext code, read directly
 * from `get_qty_based_available_batches`/`get_available_batches` on the live v16.34.2
 * server): `{batch_no, qty, warehouse}` when a `qty` is requested (portioned to sum to
 * that qty, FIFO/oldest-batch-first by default), plus `expiry_date` when browsing without
 * a qty cap. We always request a qty (see BatchSerialPicker), so `expiry_date` is only
 * present some of the time — kept optional rather than assumed.
 */
export type AutoBatchRow = {
  batch_no: string;
  qty: number;
  warehouse?: string;
  expiry_date?: string;
};

/**
 * One available serial number, as returned by `get_auto_data` ->
 * `get_available_serial_nos` — each row is exactly one physical unit (no qty field; the
 * caller counts rows). `batch_no` is only included when the item also has_batch_no
 * (an item with both flags set is unusual but not impossible — see the DocType).
 */
export type AutoSerialRow = {
  serial_no: string;
  warehouse?: string;
  batch_no?: string;
};

/**
 * Wraps ERPNext's real, whitelisted
 * `serial_and_batch_bundle.get_auto_data` — the same server-side logic Desk's own
 * Serial and Batch Bundle picker calls for FIFO/LIFO/Expiry-based auto-suggestion. Not
 * reimplemented client-side: batch valuation/expiry/reservation rules live entirely in
 * this one real ERPNext function.
 *
 * `qty` should be requested generously above what's actually needed for the Delivery Note
 * line (see BatchSerialPicker) — the returned list doubles as the "what's available to
 * browse" source, not just the minimal FIFO allocation.
 *
 * An item is normally has_batch_no XOR has_serial_no, not both — but both flags are passed
 * through as given rather than assumed, matching the real Item master.
 */
export async function getAutoBatchSerialData(args: {
  item_code: string;
  warehouse: string;
  qty: number;
  has_batch_no: boolean;
  has_serial_no: boolean;
  based_on?: "FIFO" | "LIFO" | "Expiry";
}): Promise<(AutoBatchRow | AutoSerialRow)[]> {
  if (!args.item_code || !args.warehouse || args.qty <= 0) return [];

  const data = await callMethodWithResult<(AutoBatchRow | AutoSerialRow)[] | null>(`${BUNDLE_MODULE}.get_auto_data`, {
    item_code: args.item_code,
    warehouse: args.warehouse,
    qty: args.qty,
    has_batch_no: args.has_batch_no ? 1 : 0,
    has_serial_no: args.has_serial_no ? 1 : 0,
    based_on: args.based_on ?? "FIFO",
  });
  return data ?? [];
}

export type BatchSerialLedgerEntry = { qty: number; batch_no?: string; serial_no?: string };

/**
 * Wraps ERPNext's real, whitelisted `serial_and_batch_bundle.add_serial_batch_ledgers` —
 * given a real, already-inserted child-row (Delivery Note Item) and `do_not_save: true`,
 * this creates a real "Serial and Batch Bundle" document and writes its name onto that
 * row's `serial_and_batch_bundle` field directly via `frappe.db.set_value` (confirmed by
 * reading `create_serial_batch_no_ledgers`'s body on the live server) — not reimplemented,
 * since ERPNext's own valuation/negative-stock/duplicate-serial validation all runs inside
 * `doc.save()` here.
 *
 * KNOWN PERMISSION GAP (expected, not a code bug): the `frontend-integration` service
 * account's roles (Sales User/Item Manager/Accounts User) don't cover the
 * `Serial and Batch Bundle` doctype itself — `doc.save()` inside this call is expected to
 * 403 until an ERPNext admin grants `Stock User` to that account (a live-server role change,
 * not a code change). See delivery-notes/actions.ts's error handling for how that surfaces.
 */
export type SerialBatchBundleEntry = { batch_no?: string; serial_no?: string; qty: number };

/**
 * Reads back what was actually consumed/received against a real "Serial and Batch Bundle"
 * doc's `entries` child table — used to show which batches/serials a submitted transaction
 * line resolved to (the bundle itself is created by `addSerialBatchLedgers` above at
 * submit-time; this is the read side, for any doctype whose line carries a
 * `serial_and_batch_bundle` link, not just Stock Entry). Returns `[]` rather than throwing on
 * a missing/inaccessible bundle — a display-only lookup should never break the page it's on.
 */
export async function getSerialBatchBundleEntries(bundleName: string | undefined): Promise<SerialBatchBundleEntry[]> {
  if (!bundleName) return [];
  try {
    const bundle = await getDoc<{ entries: SerialBatchBundleEntry[] }>("Serial and Batch Bundle", bundleName);
    return bundle.entries ?? [];
  } catch {
    return [];
  }
}

export async function addSerialBatchLedgers(args: {
  entries: BatchSerialLedgerEntry[];
  child_row: {
    doctype: string;
    name: string;
    item_code: string;
    warehouse: string;
    parenttype: string;
    is_rejected?: 0 | 1;
    /** Stock Entry Detail only — ERPNext's `get_type_of_transaction` reads this exact key
     * off `child_row` to decide Outward vs Inward for Stock Entry (`"Outward" if
     * child_row.get("s_warehouse") else "Inward"`, confirmed on the live v16.34.2 server).
     * The generic `warehouse` field above does not satisfy that check — omitting this key
     * silently defaults every Stock Entry bundle to "Inward", which then fails to submit
     * for any outbound purpose (Material Issue/Transfer). */
    s_warehouse?: string;
  };
  doc: {
    doctype: string;
    name: string;
    posting_date: string;
    company: string;
    is_return?: 0 | 1;
  };
  warehouse: string;
}): Promise<{ name: string }> {
  return callMethodWithResult<{ name: string }>(`${BUNDLE_MODULE}.add_serial_batch_ledgers`, {
    entries: args.entries,
    child_row: args.child_row,
    doc: args.doc,
    warehouse: args.warehouse,
    do_not_save: true,
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, getDoc, submitDoc } from "@/lib/erpnext";
import { getBuyingDefaults } from "@/lib/buyingDefaults";
import { parseLineSelectionRows } from "@/lib/lineRows";
import { getConnections } from "@/lib/connections";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this purchase receipt.";
    if (e.status === 409) return "A purchase receipt with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this purchase receipt — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

type PurchaseOrderItemForReceipt = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  stock_uom: string;
  rate: number;
  /** Real, live stored Float field on Purchase Order Item — see the doc comment on
   * createPurchaseReceiptFromPurchaseOrderAction below. */
  received_qty?: number;
};

type PurchaseOrderForReceipt = {
  name: string;
  supplier: string;
  company: string;
  currency: string;
  status: string;
  items: PurchaseOrderItemForReceipt[];
};

/**
 * "Create Purchase Receipt" from a Submitted Purchase Order — the target of the
 * /buying/purchase-orders/[name]/create-receipt line-selection step (LineSelectionEditor).
 * Purchase Receipt has no standalone `new/` in this app — it's only ever created this way,
 * same convention as Delivery Note not needing to exist independently of a Sales Order.
 *
 * Every line is re-derived from the *live* Purchase Order (never trusted from the client),
 * capped at `Purchase Order Item.qty - Purchase Order Item.received_qty` — a simple
 * subtraction, since `received_qty` is a real stored field ERPNext itself maintains (per
 * the live-verified field list this build was scoped against), same shape as Sales Order's
 * own `delivered_qty`.
 *
 * `purchase_order`/`purchase_order_item` are set on each resulting line — Purchase Receipt
 * Item's own field name for its Purchase Order back-reference (NOT `po_detail`, which is
 * Purchase Invoice Item's differently-named field for the same concept — see the Buying
 * plan's field-name gotcha note). Without this, Purchase Order Item's own `received_qty`
 * bookkeeping would never fire on submit, and the Purchase Order's own receipt status/
 * progress would never update.
 *
 * Multiple partial Purchase Receipts against the same Purchase Order are legal as long as
 * no single line is ever over-received — same partial-fulfillment shape as every other
 * create-from-source action in this app.
 */
export async function createPurchaseReceiptFromPurchaseOrderAction(
  purchaseOrderName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const selection = parseLineSelectionRows(formData, "items");
  if (selection.length === 0) {
    return { error: "Select at least one item and quantity to receive." };
  }

  let purchaseOrder: PurchaseOrderForReceipt;
  try {
    purchaseOrder = await getDoc<PurchaseOrderForReceipt>("Purchase Order", purchaseOrderName);
  } catch {
    return { error: "Could not load the source purchase order." };
  }

  if (purchaseOrder.status === "On Hold" || purchaseOrder.status === "Closed") {
    return { error: `${purchaseOrderName} is ${purchaseOrder.status} — cannot receive against it.` };
  }

  const defaults = await getBuyingDefaults(purchaseOrder.company);

  const receiptItems: {
    item_code: string;
    item_name: string;
    received_qty: number;
    qty: number;
    uom: string;
    stock_uom: string;
    conversion_factor: number;
    rate: number;
    warehouse?: string;
    purchase_order: string;
    purchase_order_item: string;
  }[] = [];

  for (const sel of selection) {
    const item = purchaseOrder.items.find((i) => i.name === sel.reference);
    if (!item) {
      return { error: "One of the selected lines no longer exists on this purchase order — reload and try again." };
    }
    const remaining = item.qty - (item.received_qty ?? 0);
    if (sel.qty > remaining + 1e-6) {
      return { error: `${item.item_code}: requested ${sel.qty} but only ${remaining} remains to receive.` };
    }
    receiptItems.push({
      item_code: item.item_code,
      item_name: item.item_name,
      received_qty: sel.qty,
      qty: sel.qty,
      uom: item.uom,
      stock_uom: item.stock_uom,
      conversion_factor: 1,
      rate: item.rate,
      warehouse: defaults.defaultWarehouse,
      purchase_order: purchaseOrderName,
      purchase_order_item: item.name,
    });
  }

  if (receiptItems.length === 0) {
    return { error: "Nothing to receive." };
  }

  const fields = {
    supplier: purchaseOrder.supplier,
    posting_date: new Date().toISOString().slice(0, 10),
    company: purchaseOrder.company,
    currency: purchaseOrder.currency,
    conversion_rate: 1,
    items: receiptItems,
  };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Purchase Receipt", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-receipts");
  revalidatePath(`/buying/purchase-orders/${encodeURIComponent(purchaseOrderName)}`);
  redirect(`/buying/purchase-receipts/${encodeURIComponent(name)}`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitPurchaseReceiptAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Purchase Receipt", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-receipts");
  revalidatePath(`/buying/purchase-receipts/${encodeURIComponent(name)}`);
  redirect(`/buying/purchase-receipts/${encodeURIComponent(name)}`);
}

/**
 * Bound to `(name)`; useActionState calls the bound function with (state, formData) which
 * are unused here.
 *
 * Same proactive-guard pattern as cancelDeliveryNoteAction — ERPNext refuses to cancel a
 * Purchase Receipt that's linked to a Submitted Purchase Invoice.
 */
export async function cancelPurchaseReceiptAction(name: string): Promise<FormState> {
  const connections = await getConnections("Purchase Receipt", name);
  const blockingInvoices = connections.find((c) => c.label === "Purchase Invoice")?.submittedDocs ?? [];
  if (blockingInvoices.length > 0) {
    return {
      error: `Cannot cancel — linked with Purchase Invoice ${blockingInvoices.join(", ")}. Cancel that first.`,
    };
  }

  try {
    await cancelDoc("Purchase Receipt", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-receipts");
  revalidatePath(`/buying/purchase-receipts/${encodeURIComponent(name)}`);
  redirect(`/buying/purchase-receipts/${encodeURIComponent(name)}`);
}

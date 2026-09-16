"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, getDoc, submitDoc, updateDoc } from "@/lib/erpnext";
import { getBuyingDefaults, type BuyingDefaults } from "@/lib/buyingDefaults";
import { parseLineRows, parseLineSelectionRows, type LineSelectionInput } from "@/lib/lineRows";
import { getBilledQtyByPoDetail, getBilledQtyByPrDetail } from "@/lib/fulfillment";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this purchase invoice.";
    if (e.status === 409) return "A purchase invoice with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this purchase invoice — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * `credit_to`/expense_account/cost_center are applied uniformly to every parsed row here
 * (not collected per-row in the UI), same "resolved plumbing, not a user-facing field"
 * treatment buildSalesInvoiceFields already gives debit_to/income_account/cost_center — see
 * buyingDefaults.ts's own doc comment for why these are needed despite not being in the
 * Buying plan's own live-verified Purchase Invoice field list. `is_paid`/`update_stock` are
 * left at their default (false/unset) — never read from the form, per the plan's explicit
 * scope.
 */
async function buildPurchaseInvoiceFields(formData: FormData) {
  const supplier = String(formData.get("supplier") ?? "").trim();
  const posting_date = String(formData.get("posting_date") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "").trim() || undefined;
  const bill_no = String(formData.get("bill_no") ?? "").trim() || undefined;
  const bill_date = String(formData.get("bill_date") ?? "").trim() || undefined;
  const companyName = String(formData.get("company") ?? "").trim() || undefined;

  if (!supplier) throw new Error("Supplier is required.");
  if (!posting_date) throw new Error("Posting date is required.");

  const rows = parseLineRows(formData, "items");
  if (rows.length === 0) throw new Error("Add at least one item with a quantity and UOM.");

  const defaults = await getBuyingDefaults(companyName);

  if (!defaults.defaultPayableAccount) {
    throw new Error("Company has no default payable account configured in ERPNext.");
  }
  if (!defaults.defaultExpenseAccount || !defaults.defaultCostCenter) {
    throw new Error("Company has no default expense account or cost center configured in ERPNext.");
  }

  const items = rows.map((r) => ({
    ...r,
    conversion_factor: 1,
    expense_account: defaults.defaultExpenseAccount,
    cost_center: defaults.defaultCostCenter,
  }));

  return {
    supplier,
    posting_date,
    due_date,
    bill_no,
    bill_date,
    company: defaults.company,
    currency: defaults.currency,
    conversion_rate: 1,
    credit_to: defaults.defaultPayableAccount,
    items,
  };
}

export async function createPurchaseInvoiceAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildPurchaseInvoiceFields>>;
  try {
    fields = await buildPurchaseInvoiceFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Purchase Invoice", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-invoices");
  redirect(`/buying/purchase-invoices/${encodeURIComponent(name)}`);
}

export async function updatePurchaseInvoiceAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildPurchaseInvoiceFields>>;
  try {
    fields = await buildPurchaseInvoiceFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    await updateDoc("Purchase Invoice", name, fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-invoices");
  revalidatePath(`/buying/purchase-invoices/${encodeURIComponent(name)}`);
  redirect(`/buying/purchase-invoices/${encodeURIComponent(name)}?saved=1`);
}

/**
 * docstatus 0→1 — posts real entries to the General Ledger. Never call this from a test
 * script; only a deliberate click in the real UI should trigger it.
 */
/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitPurchaseInvoiceAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Purchase Invoice", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-invoices");
  revalidatePath(`/buying/purchase-invoices/${encodeURIComponent(name)}`);
  redirect(`/buying/purchase-invoices/${encodeURIComponent(name)}`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function cancelPurchaseInvoiceAction(name: string): Promise<FormState> {
  try {
    await cancelDoc("Purchase Invoice", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-invoices");
  revalidatePath(`/buying/purchase-invoices/${encodeURIComponent(name)}`);
  redirect(`/buying/purchase-invoices/${encodeURIComponent(name)}`);
}

type PurchaseOrderItemForInvoice = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
};

type PurchaseOrderForInvoice = {
  name: string;
  supplier: string;
  company: string;
  currency: string;
  status: string;
  items: PurchaseOrderItemForInvoice[];
};

/** Builds one Purchase Invoice Item row sourced from a Purchase Order line. `po_detail` is
 * set alongside `purchase_order` so ERPNext's own billed-qty query (see
 * lib/fulfillment.ts's getBilledQtyByPoDetail) actually picks this invoice up next time —
 * NOT `purchase_order_item`, which is Purchase Receipt Item's own, differently-named field
 * for the same concept (see the Buying plan's field-name gotcha note). */
function buildInvoiceItemFromPurchaseOrder(
  item: PurchaseOrderItemForInvoice,
  qty: number,
  defaults: BuyingDefaults,
  purchaseOrderName: string,
) {
  return {
    item_code: item.item_code,
    item_name: item.item_name,
    qty,
    uom: item.uom,
    rate: item.rate,
    conversion_factor: 1,
    expense_account: defaults.defaultExpenseAccount,
    cost_center: defaults.defaultCostCenter,
    purchase_order: purchaseOrderName,
    po_detail: item.name,
  };
}

/**
 * Core "Create Purchase Invoice from Purchase Order" logic — the Buying-cycle mirror of
 * createSalesInvoiceFromOrder. Purchase Order Item has no stored billed-*qty* field (only
 * `billed_amt`), so remaining-to-invoice per line always comes from the live-summed
 * getBilledQtyByPoDetail query. Item data (item_code/item_name/uom/rate) is always
 * re-derived from the Purchase Order itself, never trusted from a client-supplied selection
 * payload. Multiple partial invoices against the same Purchase Order are legal as long as
 * no single line is ever over-invoiced.
 */
async function createPurchaseInvoiceFromPurchaseOrder(
  purchaseOrderName: string,
  selection: LineSelectionInput[],
): Promise<{ name: string } | { error: string }> {
  let purchaseOrder: PurchaseOrderForInvoice;
  try {
    purchaseOrder = await getDoc<PurchaseOrderForInvoice>("Purchase Order", purchaseOrderName);
  } catch {
    return { error: "Could not load the source purchase order." };
  }

  const defaults = await getBuyingDefaults(purchaseOrder.company);
  if (!defaults.defaultPayableAccount) {
    return { error: "Company has no default payable account configured in ERPNext." };
  }
  if (!defaults.defaultExpenseAccount || !defaults.defaultCostCenter) {
    return { error: "Company has no default expense account or cost center configured in ERPNext." };
  }

  const billedByRef = await getBilledQtyByPoDetail(purchaseOrderName);

  const invoiceItems: ReturnType<typeof buildInvoiceItemFromPurchaseOrder>[] = [];
  for (const sel of selection) {
    const item = purchaseOrder.items.find((i) => i.name === sel.reference);
    if (!item) {
      return { error: "One of the selected lines no longer exists on this purchase order — reload and try again." };
    }
    const remaining = item.qty - (billedByRef[item.name] ?? 0);
    if (sel.qty > remaining + 1e-6) {
      return { error: `${item.item_code}: requested ${sel.qty} but only ${remaining} remains to invoice.` };
    }
    invoiceItems.push(buildInvoiceItemFromPurchaseOrder(item, sel.qty, defaults, purchaseOrderName));
  }

  if (invoiceItems.length === 0) {
    return { error: `Nothing left to invoice on ${purchaseOrderName}.` };
  }

  const fields = {
    supplier: purchaseOrder.supplier,
    posting_date: new Date().toISOString().slice(0, 10),
    company: purchaseOrder.company,
    currency: purchaseOrder.currency,
    conversion_rate: 1,
    credit_to: defaults.defaultPayableAccount,
    items: invoiceItems,
  };

  try {
    const doc = await createDoc<{ name: string }>("Purchase Invoice", fields);
    return { name: doc.name };
  } catch (e) {
    return { error: humanizeError(e) };
  }
}

/**
 * "Create Purchase Invoice" from a Submitted Purchase Order — the target of the
 * /buying/purchase-orders/[name]/create-invoice line-selection step (LineSelectionEditor).
 */
export async function createPurchaseInvoiceFromPurchaseOrderAction(
  purchaseOrderName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const selection = parseLineSelectionRows(formData, "items");
  if (selection.length === 0) {
    return { error: "Select at least one item and quantity to invoice." };
  }

  const result = await createPurchaseInvoiceFromPurchaseOrder(purchaseOrderName, selection);
  if ("error" in result) return { error: result.error };

  revalidatePath("/buying/purchase-invoices");
  revalidatePath(`/buying/purchase-orders/${encodeURIComponent(purchaseOrderName)}`);
  redirect(`/buying/purchase-invoices/${encodeURIComponent(result.name)}`);
}

type PurchaseReceiptItemForInvoice = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  /** Present when this Purchase Receipt line was itself created from a Purchase Order line
   * (see purchase-receipts/actions.ts's createPurchaseReceiptFromPurchaseOrderAction) —
   * carried through onto the resulting Purchase Invoice line below so the ultimate source
   * Purchase Order's own billed-qty bookkeeping keeps working even when the invoice is
   * raised from the Purchase Receipt rather than the Purchase Order directly. This is
   * Purchase Receipt Item's OWN back-reference field name (`purchase_order_item`), distinct
   * from Purchase Invoice Item's `po_detail` for the same concept — see the Buying plan's
   * field-name gotcha note. */
  purchase_order?: string;
  purchase_order_item?: string;
};

type PurchaseReceiptForInvoice = {
  name: string;
  supplier: string;
  company: string;
  currency: string;
  items: PurchaseReceiptItemForInvoice[];
};

/** Builds one Purchase Invoice Item row sourced from a Purchase Receipt line. `pr_detail`
 * is set alongside `purchase_receipt` so ERPNext's own invoiced-qty query (see
 * lib/fulfillment.ts's getBilledQtyByPrDetail) actually picks this invoice up next time.
 * `purchase_order`/`po_detail` are carried through too, when the source Purchase Receipt
 * line has them — this keeps the ultimate source Purchase Order's own Connections tab and
 * remaining-to-invoice total accurate even for a receipt-sourced invoice, mirroring
 * `buildInvoiceItemFromDeliveryNote`'s equivalent carryover on the Sales side. */
function buildInvoiceItemFromPurchaseReceipt(
  item: PurchaseReceiptItemForInvoice,
  qty: number,
  defaults: BuyingDefaults,
  purchaseReceiptName: string,
) {
  return {
    item_code: item.item_code,
    item_name: item.item_name,
    qty,
    uom: item.uom,
    rate: item.rate,
    conversion_factor: 1,
    expense_account: defaults.defaultExpenseAccount,
    cost_center: defaults.defaultCostCenter,
    purchase_receipt: purchaseReceiptName,
    pr_detail: item.name,
    ...(item.purchase_order && item.purchase_order_item
      ? { purchase_order: item.purchase_order, po_detail: item.purchase_order_item }
      : {}),
  };
}

/**
 * Core "Create Purchase Invoice from Purchase Receipt" logic — the Buying-cycle mirror of
 * createSalesInvoiceFromDeliveryNote. Purchase Receipt Item has no stored billed-*qty*
 * field either (only `billed_amt`), so remaining-to-invoice per line always comes from the
 * live-summed getBilledQtyByPrDetail query.
 */
async function createPurchaseInvoiceFromPurchaseReceipt(
  purchaseReceiptName: string,
  selection: LineSelectionInput[],
): Promise<{ name: string } | { error: string }> {
  let purchaseReceipt: PurchaseReceiptForInvoice;
  try {
    purchaseReceipt = await getDoc<PurchaseReceiptForInvoice>("Purchase Receipt", purchaseReceiptName);
  } catch {
    return { error: "Could not load the source purchase receipt." };
  }

  const defaults = await getBuyingDefaults(purchaseReceipt.company);
  if (!defaults.defaultPayableAccount) {
    return { error: "Company has no default payable account configured in ERPNext." };
  }
  if (!defaults.defaultExpenseAccount || !defaults.defaultCostCenter) {
    return { error: "Company has no default expense account or cost center configured in ERPNext." };
  }

  const billedByRef = await getBilledQtyByPrDetail(purchaseReceiptName);

  const invoiceItems: ReturnType<typeof buildInvoiceItemFromPurchaseReceipt>[] = [];
  for (const sel of selection) {
    const item = purchaseReceipt.items.find((i) => i.name === sel.reference);
    if (!item) {
      return { error: "One of the selected lines no longer exists on this purchase receipt — reload and try again." };
    }
    const remaining = item.qty - (billedByRef[item.name] ?? 0);
    if (sel.qty > remaining + 1e-6) {
      return { error: `${item.item_code}: requested ${sel.qty} but only ${remaining} remains to invoice.` };
    }
    invoiceItems.push(buildInvoiceItemFromPurchaseReceipt(item, sel.qty, defaults, purchaseReceiptName));
  }

  if (invoiceItems.length === 0) {
    return { error: `Nothing left to invoice on ${purchaseReceiptName}.` };
  }

  const fields = {
    supplier: purchaseReceipt.supplier,
    posting_date: new Date().toISOString().slice(0, 10),
    company: purchaseReceipt.company,
    currency: purchaseReceipt.currency,
    conversion_rate: 1,
    credit_to: defaults.defaultPayableAccount,
    items: invoiceItems,
  };

  try {
    const doc = await createDoc<{ name: string }>("Purchase Invoice", fields);
    return { name: doc.name };
  } catch (e) {
    return { error: humanizeError(e) };
  }
}

/**
 * "Create Purchase Invoice" from a Submitted Purchase Receipt — the target of the
 * /buying/purchase-receipts/[name]/create-invoice line-selection step (LineSelectionEditor).
 * Purchase Invoice now has three creation entry points: standalone (`new/`), from Purchase
 * Order directly, and from Purchase Receipt (this one) — matching ERPNext's own native
 * support for billing off of either upstream document, or none at all.
 */
export async function createPurchaseInvoiceFromPurchaseReceiptAction(
  purchaseReceiptName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const selection = parseLineSelectionRows(formData, "items");
  if (selection.length === 0) {
    return { error: "Select at least one item and quantity to invoice." };
  }

  const result = await createPurchaseInvoiceFromPurchaseReceipt(purchaseReceiptName, selection);
  if ("error" in result) return { error: result.error };

  revalidatePath("/buying/purchase-invoices");
  revalidatePath(`/buying/purchase-receipts/${encodeURIComponent(purchaseReceiptName)}`);
  redirect(`/buying/purchase-invoices/${encodeURIComponent(result.name)}`);
}

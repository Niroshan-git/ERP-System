"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, getDoc, submitDoc, updateDoc } from "@/lib/erpnext";
import { getSellingDefaults, type SellingDefaults } from "@/lib/salesDefaults";
import { parseLineRows, parseLineSelectionRows, type LineSelectionInput } from "@/lib/lineRows";
import { getBilledQtyBySoDetail } from "@/lib/fulfillment";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this sales invoice.";
    if (e.status === 409) return "A sales invoice with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this sales invoice — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * income_account/cost_center are applied uniformly to every parsed row here
 * (not collected per-row in the UI) — see the Sales Invoice spec. debit_to is
 * required at the header. Both surface a clear error rather than silently
 * submitting a doc ERPNext would reject for missing accounting fields.
 */
async function buildSalesInvoiceFields(formData: FormData) {
  const customer = String(formData.get("customer") ?? "").trim();
  const posting_date = String(formData.get("posting_date") ?? "").trim();
  const companyName = String(formData.get("company") ?? "").trim() || undefined;

  // Address & Contact tab — all optional, ERPNext derives address_display/contact_display itself.
  const customer_address = String(formData.get("customer_address") ?? "").trim() || undefined;
  const contact_person = String(formData.get("contact_person") ?? "").trim() || undefined;
  const shipping_address_name = String(formData.get("shipping_address_name") ?? "").trim() || undefined;
  const territory = String(formData.get("territory") ?? "").trim() || undefined;
  const customer_group = String(formData.get("customer_group") ?? "").trim() || undefined;

  // Terms tab — all optional.
  const payment_terms_template = String(formData.get("payment_terms_template") ?? "").trim() || undefined;
  const tc_name = String(formData.get("tc_name") ?? "").trim() || undefined;
  const terms = String(formData.get("terms") ?? "").trim() || undefined;

  // More Info tab — optional.
  const title = String(formData.get("title") ?? "").trim() || undefined;
  const po_no = String(formData.get("po_no") ?? "").trim() || undefined;
  const po_date = String(formData.get("po_date") ?? "").trim() || undefined;

  if (!customer) throw new Error("Customer is required.");
  if (!posting_date) throw new Error("Posting date is required.");

  const rows = parseLineRows(formData, "items");
  if (rows.length === 0) throw new Error("Add at least one item with a quantity and UOM.");

  const defaults = await getSellingDefaults(companyName);

  if (!defaults.debitToAccount) {
    throw new Error("Company has no default receivable account configured in ERPNext.");
  }
  if (!defaults.defaultIncomeAccount || !defaults.defaultCostCenter) {
    throw new Error("Company has no default income account or cost center configured in ERPNext.");
  }

  const items = rows.map((r) => ({
    ...r,
    conversion_factor: 1,
    income_account: defaults.defaultIncomeAccount,
    cost_center: defaults.defaultCostCenter,
  }));

  return {
    naming_series: "ACC-SINV-.YYYY.-",
    customer,
    posting_date,
    company: defaults.company,
    currency: defaults.currency,
    conversion_rate: 1,
    selling_price_list: defaults.sellingPriceList,
    price_list_currency: defaults.priceListCurrency,
    plc_conversion_rate: 1,
    debit_to: defaults.debitToAccount,
    customer_address,
    contact_person,
    shipping_address_name,
    territory,
    customer_group,
    payment_terms_template,
    tc_name,
    terms,
    title,
    po_no,
    po_date,
    items,
  };
}

export async function createSalesInvoiceAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildSalesInvoiceFields>>;
  try {
    fields = await buildSalesInvoiceFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Sales Invoice", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/invoices");
  redirect(`/sales/invoices/${encodeURIComponent(name)}`);
}

export async function updateSalesInvoiceAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildSalesInvoiceFields>>;
  try {
    fields = await buildSalesInvoiceFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    await updateDoc("Sales Invoice", name, fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/invoices");
  revalidatePath(`/sales/invoices/${encodeURIComponent(name)}`);
  redirect(`/sales/invoices/${encodeURIComponent(name)}?saved=1`);
}

/**
 * docstatus 0→1 — posts real entries to the General Ledger. Never call this
 * from a test script; only a deliberate click in the real UI should trigger it.
 */
/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitSalesInvoiceAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Sales Invoice", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/invoices");
  revalidatePath(`/sales/invoices/${encodeURIComponent(name)}`);
  redirect(`/sales/invoices/${encodeURIComponent(name)}`);
}

type SalesOrderItemForInvoice = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
};

type SalesOrderForInvoice = {
  name: string;
  customer: string;
  company: string;
  currency: string;
  selling_price_list: string;
  price_list_currency: string;
  status: string;
  items: SalesOrderItemForInvoice[];
  customer_address?: string;
  contact_person?: string;
  shipping_address_name?: string;
  territory?: string;
  customer_group?: string;
  tc_name?: string;
  terms?: string;
  title?: string;
  po_no?: string;
  po_date?: string;
};

/** Builds one Sales Invoice Item row. `so_detail` is set alongside `sales_order` so
 * ERPNext's own billed-qty query (see lib/fulfillment.ts) — and therefore this app's own
 * remaining-to-invoice calculation next time — actually picks this invoice up. */
function buildInvoiceItem(item: SalesOrderItemForInvoice, qty: number, defaults: SellingDefaults, salesOrderName: string) {
  return {
    item_code: item.item_code,
    item_name: item.item_name,
    qty,
    uom: item.uom,
    rate: item.rate,
    conversion_factor: 1,
    income_account: defaults.defaultIncomeAccount,
    cost_center: defaults.defaultCostCenter,
    sales_order: salesOrderName,
    so_detail: item.name,
  };
}

/**
 * Core "Create Sales Invoice from Sales Order" logic, shared by the single-document
 * action below and `bulkCreateSalesInvoicesFromOrdersAction`. Carries
 * customer/company/currency/price-list across, tags each line with `sales_order` +
 * `so_detail` so it shows up under the source order's own Connections panel and so
 * ERPNext's own billed-qty bookkeeping (lib/fulfillment.ts) actually runs. Lands as
 * Draft — never auto-submitted here (see the GL-posting warning on
 * submitSalesInvoiceAction below).
 *
 * `selection`, when given (the line-selection step at
 * /sales/orders/[name]/create-invoice), caps each requested line at that line's own
 * real remaining-to-invoice qty (`Sales Order Item.qty` minus whatever's already been
 * summed as Submitted-invoiced against its `so_detail` — see lib/fulfillment.ts's doc
 * comment for why there's no stored `billed_qty` field to just read directly) and
 * rejects any request that exceeds it. When omitted (the bulk action, which has no
 * line-selection UI), every line's full remaining qty is invoiced — mirroring ERPNext's
 * own default `get_mapped_doc` mapping behavior when no explicit row selection is
 * passed (confirmed in `sales_order.py::make_sales_invoice`). Multiple partial
 * invoices against the same Sales Order are legal as long as no single line is ever
 * over-invoiced — replaces the old one-parent-one-child hard guard, which conflicted
 * with ERPNext's own native "partial billing" behavior (see
 * docs/ceylon-stack-sales-scenarios.md).
 *
 * Item data (item_code/item_name/uom/rate) is always re-derived from the Sales Order
 * itself, never trusted from a client-supplied selection payload.
 *
 * Also skips an order with `status` "On Hold" or "Closed" — matching ERPNext's own bulk
 * transaction processing (`erpnext/utilities/bulk_transaction.py`, read on the live
 * server: `skipped_records = [d for d in ... if d.get("status") in ("On Hold", "Closed")]`).
 */
async function createSalesInvoiceFromOrder(
  salesOrderName: string,
  selection?: LineSelectionInput[],
): Promise<{ name: string } | { error: string }> {
  let salesOrder: SalesOrderForInvoice;
  try {
    salesOrder = await getDoc<SalesOrderForInvoice>("Sales Order", salesOrderName);
  } catch {
    return { error: "Could not load the source sales order." };
  }

  if (salesOrder.status === "On Hold" || salesOrder.status === "Closed") {
    return { error: `${salesOrderName} is ${salesOrder.status} — skipped.` };
  }

  const defaults = await getSellingDefaults(salesOrder.company);
  if (!defaults.debitToAccount) {
    return { error: "Company has no default receivable account configured in ERPNext." };
  }
  if (!defaults.defaultIncomeAccount || !defaults.defaultCostCenter) {
    return { error: "Company has no default income account or cost center configured in ERPNext." };
  }

  const billedByRef = await getBilledQtyBySoDetail(salesOrderName);

  const invoiceItems: ReturnType<typeof buildInvoiceItem>[] = [];

  if (selection) {
    for (const sel of selection) {
      const item = salesOrder.items.find((i) => i.name === sel.reference);
      if (!item) {
        return { error: "One of the selected lines no longer exists on this sales order — reload and try again." };
      }
      const remaining = item.qty - (billedByRef[item.name] ?? 0);
      if (sel.qty > remaining + 1e-6) {
        return { error: `${item.item_code}: requested ${sel.qty} but only ${remaining} remains to invoice.` };
      }
      invoiceItems.push(buildInvoiceItem(item, sel.qty, defaults, salesOrderName));
    }
  } else {
    for (const item of salesOrder.items) {
      const remaining = item.qty - (billedByRef[item.name] ?? 0);
      if (remaining > 1e-6) {
        invoiceItems.push(buildInvoiceItem(item, remaining, defaults, salesOrderName));
      }
    }
  }

  if (invoiceItems.length === 0) {
    return { error: `Nothing left to invoice on ${salesOrderName}.` };
  }

  const fields = {
    naming_series: "ACC-SINV-.YYYY.-",
    customer: salesOrder.customer,
    posting_date: new Date().toISOString().slice(0, 10),
    company: salesOrder.company,
    currency: salesOrder.currency,
    conversion_rate: 1,
    selling_price_list: salesOrder.selling_price_list,
    price_list_currency: salesOrder.price_list_currency,
    plc_conversion_rate: 1,
    debit_to: defaults.debitToAccount,
    customer_address: salesOrder.customer_address,
    contact_person: salesOrder.contact_person,
    shipping_address_name: salesOrder.shipping_address_name,
    territory: salesOrder.territory,
    customer_group: salesOrder.customer_group,
    tc_name: salesOrder.tc_name,
    terms: salesOrder.terms,
    title: salesOrder.title,
    po_no: salesOrder.po_no,
    po_date: salesOrder.po_date,
    items: invoiceItems,
  };

  try {
    const doc = await createDoc<{ name: string }>("Sales Invoice", fields);
    return { name: doc.name };
  } catch (e) {
    return { error: humanizeError(e) };
  }
}

/**
 * "Create Sales Invoice" from a Submitted Sales Order — the target of the
 * /sales/orders/[name]/create-invoice line-selection step (LineSelectionEditor).
 */
export async function createSalesInvoiceFromSalesOrderAction(
  salesOrderName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const selection = parseLineSelectionRows(formData, "items");
  if (selection.length === 0) {
    return { error: "Select at least one item and quantity to invoice." };
  }

  const result = await createSalesInvoiceFromOrder(salesOrderName, selection);
  if ("error" in result) return { error: result.error };

  revalidatePath("/sales/invoices");
  revalidatePath(`/sales/orders/${encodeURIComponent(salesOrderName)}`);
  redirect(`/sales/invoices/${encodeURIComponent(result.name)}`);
}

/**
 * Bulk row-selection version — ERPNext's own "Sales Invoice" bulk action item on the
 * Sales Order list (`erpnext.bulk_transaction_processing.create`, read on the live
 * server) creates one target document PER selected source document, not one consolidated
 * invoice covering several orders — confirmed by reading `bulk_transaction.py`'s `task()`,
 * which loops `deserialized_data` calling the single-document mapper once per name. This
 * matches that: one Draft Sales Invoice per eligible selected Sales Order.
 */
export async function bulkCreateSalesInvoicesFromOrdersAction(names: string[]): Promise<{ message: string }> {
  let created = 0;
  const skipped: string[] = [];

  for (const name of names) {
    const result = await createSalesInvoiceFromOrder(name);
    if ("error" in result) skipped.push(name);
    else created++;
  }

  revalidatePath("/sales/invoices");
  revalidatePath("/sales/orders");
  const skippedNote = skipped.length > 0 ? ` Skipped ${skipped.length} (${skipped.join(", ")}).` : "";
  return { message: `Created ${created} sales invoice(s).${skippedNote}` };
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function cancelSalesInvoiceAction(name: string): Promise<FormState> {
  try {
    await cancelDoc("Sales Invoice", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/invoices");
  revalidatePath(`/sales/invoices/${encodeURIComponent(name)}`);
  redirect(`/sales/invoices/${encodeURIComponent(name)}`);
}

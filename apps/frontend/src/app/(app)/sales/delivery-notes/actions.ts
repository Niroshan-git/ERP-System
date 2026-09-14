"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, getDoc, submitDoc, updateDoc } from "@/lib/erpnext";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { parseLineRows, parseLineSelectionRows, type BatchSerialEntryInput } from "@/lib/lineRows";
import { getConnections } from "@/lib/connections";
import { addSerialBatchLedgers } from "@/lib/actions/batchSerialLookup";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this delivery note.";
    if (e.status === 409) return "A delivery note with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this delivery note — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * Manual "New Delivery Note" build — mirrors buildSalesOrderFields/buildSalesInvoiceFields.
 * `warehouse` defaults to the company's default (same WarehouseRequired reasoning as Sales
 * Order — see the comment on defaultWarehouse in salesDefaults.ts) but is taken from the
 * row itself when LineItemsEditor already set one (it does, uniformly, whenever
 * `defaultWarehouse` is passed to it — see DeliveryNoteForm.tsx).
 *
 * Returns the parsed `rows` alongside `fields` (not just `fields.items`) because the rows
 * also carry each line's `batchSerialEntries` — real ERPNext `items` fields only, never
 * batch/serial data (see the Design Decisions in the Phase 2 plan: that's attached in a
 * second step, after the Delivery Note itself has real, Frappe-assigned child-row names).
 */
async function buildDeliveryNoteFields(formData: FormData) {
  const customer = String(formData.get("customer") ?? "").trim();
  const posting_date = String(formData.get("posting_date") ?? "").trim();
  const companyName = String(formData.get("company") ?? "").trim() || undefined;

  // Address & Contact tab — all optional, ERPNext derives address_display/contact_display itself.
  const customer_address = String(formData.get("customer_address") ?? "").trim() || undefined;
  const contact_person = String(formData.get("contact_person") ?? "").trim() || undefined;
  const shipping_address_name = String(formData.get("shipping_address_name") ?? "").trim() || undefined;
  const territory = String(formData.get("territory") ?? "").trim() || undefined;
  const customer_group = String(formData.get("customer_group") ?? "").trim() || undefined;

  // Terms tab — tc_name/terms are real Delivery Note fields; `payment_terms_template` is
  // NOT (confirmed live via the DocType meta — Delivery Note has no such field), so even
  // though TermsFields renders that selector for UI consistency with the other doctypes,
  // its value is deliberately never read or sent here.
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

  // parseLineRows's LineRowInput also carries optional quotation_item/source_quotation tag
  // fields (only meaningful for Sales Order's "Copy From Quotation" — see lib/lineRows.ts's
  // doc comment) — deliberately not read here, Delivery Note Item has no such fields.
  const items = rows.map((r) => ({
    item_code: r.item_code,
    item_name: r.item_name,
    qty: r.qty,
    uom: r.uom,
    rate: r.rate,
    conversion_factor: 1,
    warehouse: r.warehouse || defaults.defaultWarehouse,
  }));

  const fields = {
    naming_series: "MAT-DN-.YYYY.-",
    customer,
    posting_date,
    company: defaults.company,
    currency: defaults.currency,
    conversion_rate: 1,
    selling_price_list: defaults.sellingPriceList,
    price_list_currency: defaults.priceListCurrency,
    plc_conversion_rate: 1,
    customer_address,
    contact_person,
    shipping_address_name,
    territory,
    customer_group,
    tc_name,
    terms,
    title,
    po_no,
    po_date,
    items,
  };

  return { fields, rows };
}

type BatchSerialAttachInput = { item_code: string; warehouse?: string; batchSerialEntries?: BatchSerialEntryInput[] };

/**
 * Step 2 of the two-step create flow (see Design Decisions in the Phase 2 plan): the
 * Delivery Note itself must already be inserted (real, Frappe-assigned child-row names) —
 * this re-fetches it and, for each `lines[i]` that carries `batchSerialEntries`, calls the
 * real `add_serial_batch_ledgers` with that exact child row, matched by array position
 * (the same order `lines` was used to build the Delivery Note's own `items`, which ERPNext
 * preserves).
 *
 * The Delivery Note stays in Draft throughout — this never submits it. If one line's
 * bundle creation fails (e.g. the known `Serial and Batch Bundle` permission gap, see
 * lib/actions/batchSerialLookup.ts), the error names that line and the Delivery Note is
 * left in Draft, recoverable — not silently swallowed, and nothing here undoes lines
 * already attached before the failure.
 */
async function attachBatchSerialBundles(deliveryNoteName: string, lines: BatchSerialAttachInput[]): Promise<void> {
  const withEntries = lines
    .map((line, idx) => ({ line, idx }))
    .filter((r) => r.line.batchSerialEntries && r.line.batchSerialEntries.length > 0);
  if (withEntries.length === 0) return;

  const doc = await getDoc<{
    name: string;
    posting_date: string;
    company: string;
    is_return?: 0 | 1;
    items: { name: string; item_code: string; warehouse?: string }[];
  }>("Delivery Note", deliveryNoteName);

  for (const { line, idx } of withEntries) {
    const childRow = doc.items[idx];
    if (!childRow || childRow.item_code !== line.item_code) {
      throw new Error(
        `Could not match the batch/serial selection for ${line.item_code} back to a real line on ${deliveryNoteName} ` +
          `— the line order didn't match what was just created. The delivery note was saved as a Draft; reopen it to attach batches/serials manually.`,
      );
    }
    const warehouse = childRow.warehouse || line.warehouse || "";
    try {
      await addSerialBatchLedgers({
        entries: line.batchSerialEntries!.map((e) => ({ qty: e.qty, batch_no: e.batch_no, serial_no: e.serial_no })),
        child_row: {
          doctype: "Delivery Note Item",
          name: childRow.name,
          item_code: childRow.item_code,
          warehouse,
          parenttype: "Delivery Note",
          is_rejected: 0,
        },
        doc: {
          doctype: "Delivery Note",
          name: doc.name,
          posting_date: doc.posting_date,
          company: doc.company,
          is_return: 0,
        },
        warehouse,
      });
    } catch (e) {
      const detail = e instanceof ErpNextError ? (e.erpnextMessage ?? e.message) : "an unknown error";
      throw new Error(
        `${deliveryNoteName} was saved as a Draft, but attaching the batch/serial selection for ${line.item_code} failed: ${detail}. ` +
          `Reopen the delivery note to retry.`,
      );
    }
  }
}

export async function createDeliveryNoteAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let built: Awaited<ReturnType<typeof buildDeliveryNoteFields>>;
  try {
    built = await buildDeliveryNoteFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Delivery Note", built.fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  // Step 2 of the two-step flow — the Delivery Note now has real child-row names to attach
  // any picked batch/serial selections to. Stays in Draft either way; a failure here is
  // surfaced but doesn't lose the document (see attachBatchSerialBundles's doc comment).
  try {
    await attachBatchSerialBundles(name, built.rows);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to attach the batch/serial selection." };
  }

  revalidatePath("/sales/delivery-notes");
  redirect(`/sales/delivery-notes/${encodeURIComponent(name)}`);
}

export async function updateDeliveryNoteAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let built: Awaited<ReturnType<typeof buildDeliveryNoteFields>>;
  try {
    built = await buildDeliveryNoteFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    await updateDoc("Delivery Note", name, built.fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  try {
    await attachBatchSerialBundles(name, built.rows);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to attach the batch/serial selection." };
  }

  revalidatePath("/sales/delivery-notes");
  revalidatePath(`/sales/delivery-notes/${encodeURIComponent(name)}`);
  redirect(`/sales/delivery-notes/${encodeURIComponent(name)}?saved=1`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitDeliveryNoteAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Delivery Note", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/delivery-notes");
  revalidatePath(`/sales/delivery-notes/${encodeURIComponent(name)}`);
  redirect(`/sales/delivery-notes/${encodeURIComponent(name)}`);
}

/**
 * Bound to `(name)`; useActionState calls the bound function with (state, formData) which
 * are unused here.
 *
 * Same proactive-guard pattern as cancelSalesOrderAction — ERPNext refuses to cancel a
 * Delivery Note that's linked to a Submitted Sales Invoice (via the "Delivery Note" ->
 * Sales Invoice CONNECTION_CONFIG entry, `delivery_note` back-reference — NOT `dn_detail`,
 * which is a specific child-row id, not the parent Delivery Note's own name; this was a
 * real live-verified bug, fixed in connections.ts); checked here first so the error names
 * the actual blocking invoice instead of a generic rejection.
 */
export async function cancelDeliveryNoteAction(name: string): Promise<FormState> {
  const connections = await getConnections("Delivery Note", name);
  const blockingInvoices = connections.find((c) => c.label === "Sales Invoice")?.submittedDocs ?? [];
  if (blockingInvoices.length > 0) {
    return {
      error: `Cannot cancel — linked with Sales Invoice ${blockingInvoices.join(", ")}. Cancel that first.`,
    };
  }

  try {
    await cancelDoc("Delivery Note", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/delivery-notes");
  revalidatePath(`/sales/delivery-notes/${encodeURIComponent(name)}`);
  redirect(`/sales/delivery-notes/${encodeURIComponent(name)}`);
}

type SalesOrderItemForDelivery = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  /** Real, live stored Float field on Sales Order Item (confirmed via the live DocType
   * JSON) — unlike the billed-qty case, "remaining to deliver" is a simple subtraction,
   * no live-summed query needed. */
  delivered_qty?: number;
};

type SalesOrderForDelivery = {
  name: string;
  customer: string;
  company: string;
  currency: string;
  selling_price_list: string;
  price_list_currency: string;
  status: string;
  items: SalesOrderItemForDelivery[];
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

/**
 * "Create Delivery Note" from a Submitted Sales Order — the target of the
 * /sales/orders/[name]/create-delivery line-selection step (LineSelectionEditor).
 *
 * Every line is re-derived from the *live* Sales Order (never trusted from the client),
 * capped at `Sales Order Item.qty - Sales Order Item.delivered_qty` — a simple subtraction,
 * since (unlike the billed-qty case) `delivered_qty` is a real stored field ERPNext itself
 * maintains, confirmed via the live DocType JSON.
 *
 * `so_detail` is set alongside `against_sales_order` on each line — this exactly matches
 * ERPNext's own `sales_order.py::make_delivery_note` field_map
 * (`{"name": "so_detail", "parent": "against_sales_order"}`, confirmed by reading that file
 * on the live server) — without it, Sales Order Item's own `delivered_qty` bookkeeping
 * would never fire on submit, and the Sales Order's delivery status/progress would never
 * update. `warehouse` defaults from getSellingDefaults(), same as every other stock line
 * this app creates.
 *
 * Multiple partial Delivery Notes against the same Sales Order are legal as long as no
 * single line is ever over-delivered — same "partial fulfillment" shape as Phase 1's
 * Quotation -> Sales Order and Sales Order -> Sales Invoice flows.
 */
export async function createDeliveryNoteFromSalesOrderAction(
  salesOrderName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const selection = parseLineSelectionRows(formData, "items");
  if (selection.length === 0) {
    return { error: "Select at least one item and quantity to deliver." };
  }

  let salesOrder: SalesOrderForDelivery;
  try {
    salesOrder = await getDoc<SalesOrderForDelivery>("Sales Order", salesOrderName);
  } catch {
    return { error: "Could not load the source sales order." };
  }

  if (salesOrder.status === "On Hold" || salesOrder.status === "Closed") {
    return { error: `${salesOrderName} is ${salesOrder.status} — cannot deliver against it.` };
  }

  const defaults = await getSellingDefaults(salesOrder.company);

  const deliveryItems: {
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    rate: number;
    conversion_factor: number;
    warehouse?: string;
    against_sales_order: string;
    so_detail: string;
  }[] = [];
  // Parallel to deliveryItems, same index — each selection's BatchSerialPicker choice
  // (see LineSelectionEditor.tsx), attached in the step-2 pass below.
  const batchSerialByIndex: (BatchSerialEntryInput[] | undefined)[] = [];

  for (const sel of selection) {
    const item = salesOrder.items.find((i) => i.name === sel.reference);
    if (!item) {
      return { error: "One of the selected lines no longer exists on this sales order — reload and try again." };
    }
    const remaining = item.qty - (item.delivered_qty ?? 0);
    if (sel.qty > remaining + 1e-6) {
      return { error: `${item.item_code}: requested ${sel.qty} but only ${remaining} remains to deliver.` };
    }
    deliveryItems.push({
      item_code: item.item_code,
      item_name: item.item_name,
      qty: sel.qty,
      uom: item.uom,
      rate: item.rate,
      conversion_factor: 1,
      warehouse: defaults.defaultWarehouse,
      against_sales_order: salesOrderName,
      so_detail: item.name,
    });
    batchSerialByIndex.push(sel.batchSerialEntries);
  }

  if (deliveryItems.length === 0) {
    return { error: "Nothing to deliver." };
  }

  const fields = {
    naming_series: "MAT-DN-.YYYY.-",
    customer: salesOrder.customer,
    posting_date: new Date().toISOString().slice(0, 10),
    company: salesOrder.company,
    currency: salesOrder.currency,
    conversion_rate: 1,
    selling_price_list: salesOrder.selling_price_list,
    price_list_currency: salesOrder.price_list_currency,
    plc_conversion_rate: 1,
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
    items: deliveryItems,
  };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Delivery Note", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  try {
    await attachBatchSerialBundles(
      name,
      deliveryItems.map((item, idx) => ({
        item_code: item.item_code,
        warehouse: item.warehouse,
        batchSerialEntries: batchSerialByIndex[idx],
      })),
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to attach the batch/serial selection." };
  }

  revalidatePath("/sales/delivery-notes");
  revalidatePath(`/sales/orders/${encodeURIComponent(salesOrderName)}`);
  redirect(`/sales/delivery-notes/${encodeURIComponent(name)}`);
}

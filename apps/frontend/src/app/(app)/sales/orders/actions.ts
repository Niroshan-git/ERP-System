"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { callMethod, cancelDoc, createDoc, ErpNextError, getDoc, submitDoc, updateDoc } from "@/lib/erpnext";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { parseLineRows, parseLineSelectionRows, type LineRowInput } from "@/lib/lineRows";
import { getConnections } from "@/lib/connections";
import { getQuotationLinesByReference, remainingQuotationLineQty } from "@/lib/fulfillment";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this sales order.";
    if (e.status === 409) return "A sales order with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this sales order — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * Re-validates every "Copy From Quotation"-tagged row (`quotation_item`/`source_quotation`
 * set — see LineItemsEditor's LineRow type) against that Quotation line's real, *current*
 * remaining-to-order qty before this Sales Order is created or updated. The qty shown/capped
 * in LineSelectionEditor at copy time is just a snapshot — this is the actual enforcement,
 * same "proactive guard checked before createDoc" pattern as
 * createSalesOrderFromQuotationAction below (which this shares getQuotationLinesByReference/
 * remainingQuotationLineQty with), just operating on tagged rows out of a free-form
 * LineItemsEditor instead of a dedicated LineSelectionEditor step. Runs on both create and
 * update — a Draft Sales Order's tagged rows haven't been counted into any Quotation's
 * ordered_qty yet (that only happens on Sales Order *submit*), so re-checking against the
 * Quotation's current ordered_qty here never double-counts this same Draft's own qty.
 *
 * Sums requested qty per (source_quotation, quotation_item) first, not row-by-row, in case
 * the same source line ends up tagged on more than one row (e.g. a duplicated copied row) —
 * each individually could look fine while the combined total still over-orders the line.
 *
 * Returns an error string, or null if every tagged row (if any) is still within bounds.
 */
async function validateTaggedRows(rows: LineRowInput[]): Promise<string | null> {
  const tagged = rows.filter((r) => r.quotation_item && r.source_quotation);
  if (tagged.length === 0) return null;

  const quotationNames = Array.from(new Set(tagged.map((r) => r.source_quotation as string)));
  const lineMapsByQuotation = new Map(
    await Promise.all(
      quotationNames.map(async (name) => [name, await getQuotationLinesByReference(name)] as const),
    ),
  );

  const requestedByQuotation = new Map<string, Map<string, number>>();
  for (const row of tagged) {
    const qName = row.source_quotation as string;
    const itemRef = row.quotation_item as string;
    if (!requestedByQuotation.has(qName)) requestedByQuotation.set(qName, new Map());
    const inner = requestedByQuotation.get(qName) as Map<string, number>;
    inner.set(itemRef, (inner.get(itemRef) ?? 0) + row.qty);
  }

  for (const [qName, requestedByRef] of requestedByQuotation) {
    const lines = lineMapsByQuotation.get(qName);
    if (!lines) {
      return `Could not re-check ${qName} — reload the page and try copying again.`;
    }
    for (const [itemRef, requestedQty] of requestedByRef) {
      const line = lines[itemRef];
      if (!line) {
        return `A copied line's source row on ${qName} no longer exists — reload and try again.`;
      }
      const remaining = remainingQuotationLineQty(line);
      if (requestedQty > remaining + 1e-6) {
        return `${line.item_code}: requested ${requestedQty} but only ${remaining} remains to order on ${qName}.`;
      }
    }
  }

  return null;
}

async function buildSalesOrderFields(formData: FormData) {
  const customer = String(formData.get("customer") ?? "").trim();
  const transaction_date = String(formData.get("transaction_date") ?? "").trim();
  const delivery_date = String(formData.get("delivery_date") ?? "").trim() || undefined;
  const order_type = String(formData.get("order_type") ?? "Sales").trim() || "Sales";
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
  if (!transaction_date) throw new Error("Date is required.");
  // ERPNext's live Sales Order controller rejects a missing delivery_date at
  // save time ("Please enter Delivery Date") even though the DocType meta
  // marks it optional — discovered during live testing, enforced here too.
  if (!delivery_date) throw new Error("Delivery date is required.");

  const rows = parseLineRows(formData, "items");
  if (rows.length === 0) throw new Error("Add at least one item with a quantity and UOM.");

  // Re-check any "Copy From Quotation"-tagged rows against their real, current remaining
  // qty before building anything else — see validateTaggedRows's doc comment for why this
  // can't just trust LineSelectionEditor's earlier snapshot.
  const taggedRowsError = await validateTaggedRows(rows);
  if (taggedRowsError) throw new Error(taggedRowsError);

  const defaults = await getSellingDefaults(companyName);
  // ERPNext rejects a stock item with no warehouse (WarehouseRequired) whenever the
  // item has no per-company default configured — confirmed live, not hypothetical.
  // See the comment on defaultWarehouse in salesDefaults.ts.
  const items = rows.map((r) => {
    const { quotation_item, source_quotation, ...rest } = r;
    return {
      ...rest,
      conversion_factor: 1,
      warehouse: defaults.defaultWarehouse,
      // Both-or-neither (see LineRowInput's doc comment) — `source_quotation` becomes the
      // real ERPNext field name `prevdoc_docname` here; `quotation_item`'s own field name
      // already matches ERPNext's, same as createSalesOrderFromQuotationAction below.
      ...(quotation_item && source_quotation ? { quotation_item, prevdoc_docname: source_quotation } : {}),
    };
  });

  return {
    naming_series: "SAL-ORD-.YYYY.-",
    customer,
    order_type,
    transaction_date,
    delivery_date,
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
    payment_terms_template,
    tc_name,
    terms,
    title,
    po_no,
    po_date,
    items,
  };
}

export async function createSalesOrderAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildSalesOrderFields>>;
  try {
    fields = await buildSalesOrderFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Sales Order", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/orders");
  redirect(`/sales/orders/${encodeURIComponent(name)}`);
}

export async function updateSalesOrderAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildSalesOrderFields>>;
  try {
    fields = await buildSalesOrderFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    await updateDoc("Sales Order", name, fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/orders");
  revalidatePath(`/sales/orders/${encodeURIComponent(name)}`);
  redirect(`/sales/orders/${encodeURIComponent(name)}?saved=1`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitSalesOrderAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Sales Order", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/orders");
  revalidatePath(`/sales/orders/${encodeURIComponent(name)}`);
  redirect(`/sales/orders/${encodeURIComponent(name)}`);
}

/**
 * Bound to `(name)`; useActionState calls the bound function with (state, formData) which
 * are unused here.
 *
 * Checked proactively (not just left to ERPNext to reject) so the error names the actual
 * blocking document instead of a generic rejection — matches the same live-verified rule
 * ERPNext itself enforces (see the `submittedDocs` doc comment in lib/connections.ts): a
 * Sales Order can't be cancelled while a Submitted Sales Invoice references it. The page
 * also hides the Cancel button in this case; this is the real enforcement, that's just UI.
 */
export async function cancelSalesOrderAction(name: string): Promise<FormState> {
  const connections = await getConnections("Sales Order", name);
  const blockingInvoices = connections.find((c) => c.label === "Sales Invoice")?.submittedDocs ?? [];
  if (blockingInvoices.length > 0) {
    return {
      error: `Cannot cancel — linked with Sales Invoice ${blockingInvoices.join(", ")}. Cancel that first.`,
    };
  }

  try {
    await cancelDoc("Sales Order", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/orders");
  revalidatePath(`/sales/orders/${encodeURIComponent(name)}`);
  redirect(`/sales/orders/${encodeURIComponent(name)}`);
}

type QuotationItemForOrder = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  /** Real, live ERPNext field on Quotation Item — auto-maintained by ERPNext's own
   * status_updater whenever a Sales Order Item is submitted/cancelled with
   * `quotation_item` set to this row's `name` (confirmed by reading quotation.py/
   * sales_order.py on the live server). "Remaining to order" = qty - ordered_qty. */
  ordered_qty?: number;
};

type QuotationForOrder = {
  name: string;
  party_name: string;
  company: string;
  currency: string;
  selling_price_list: string;
  price_list_currency: string;
  items: QuotationItemForOrder[];
  customer_address?: string;
  contact_person?: string;
  shipping_address_name?: string;
  territory?: string;
  customer_group?: string;
  tc_name?: string;
  terms?: string;
  title?: string;
};

/**
 * "Create Sales Order" from a Submitted Quotation — the target of the
 * /sales/quotations/[name]/create-order line-selection step (LineSelectionEditor).
 * Each selected row is validated against that line's own real remaining-to-order qty
 * (`Quotation Item.qty - Quotation Item.ordered_qty`, see the type comment above) —
 * over-ordering a line is rejected, but multiple partial Sales Orders against the same
 * Quotation are legal as long as no single line is ever over-ordered. Replaces the old
 * one-parent-one-child hard guard, which conflicted with ERPNext's own native "multiple
 * SOs from one Quotation (partial acceptance)" behavior (see
 * docs/ceylon-stack-sales-scenarios.md).
 *
 * Item data (item_code/item_name/uom/rate) is re-derived here from the Quotation itself,
 * not trusted from the client's selection payload — only `qty` per line reference comes
 * from the form (see lib/lineRows.ts's parseLineSelectionRows).
 *
 * `quotation_item` is set per row (alongside `prevdoc_docname`) so ERPNext's own
 * ordered_qty bookkeeping on the Quotation Item actually runs on submit — this matches
 * `quotation.py::make_sales_order`'s own `get_mapped_doc` field_map exactly
 * (`{"parent": "prevdoc_docname", "name": "quotation_item"}`, confirmed live). Without
 * this, ordered_qty would never update and the Quotation would never show "Partially
 * Ordered"/"Ordered" — a gap in this action's original one-click version.
 *
 * delivery_date has no source on Quotation — ERPNext's Sales Order controller requires
 * it (see buildSalesOrderFields above), so this defaults to one week out; editable
 * immediately after, since the new order lands in Draft.
 *
 * Address & Contact / Terms / More Info fields are carried over too, matching ERPNext's
 * own `quotation.py::_make_sales_order` — its `get_mapped_doc` call copies every
 * same-named field from Quotation to Sales Order by default, with exactly one exclusion:
 * `field_no_map: ["payment_terms_template"]` (confirmed by reading that file on the live
 * server) — so that one field is deliberately NOT carried over here either; the new order
 * gets whatever default Sales Order resolution would otherwise apply.
 */
export async function createSalesOrderFromQuotationAction(
  quotationName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const selection = parseLineSelectionRows(formData, "items");
  if (selection.length === 0) {
    return { error: "Select at least one item and quantity to order." };
  }

  let quotation: QuotationForOrder;
  try {
    quotation = await getDoc<QuotationForOrder>("Quotation", quotationName);
  } catch {
    return { error: "Could not load the source quotation." };
  }

  const defaults = await getSellingDefaults(quotation.company);

  const orderItems: {
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    rate: number;
    conversion_factor: number;
    warehouse?: string;
    prevdoc_docname: string;
    quotation_item: string;
  }[] = [];

  for (const sel of selection) {
    const item = quotation.items.find((i) => i.name === sel.reference);
    if (!item) {
      return { error: "One of the selected lines no longer exists on this quotation — reload and try again." };
    }
    const remaining = remainingQuotationLineQty(item);
    if (sel.qty > remaining + 1e-6) {
      return { error: `${item.item_code}: requested ${sel.qty} but only ${remaining} remains to order.` };
    }
    orderItems.push({
      item_code: item.item_code,
      item_name: item.item_name,
      qty: sel.qty,
      uom: item.uom,
      rate: item.rate,
      conversion_factor: 1,
      warehouse: defaults.defaultWarehouse,
      prevdoc_docname: quotationName,
      quotation_item: item.name,
    });
  }

  if (orderItems.length === 0) {
    return { error: "Nothing to order." };
  }

  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(deliveryDate.getDate() + 7);

  const fields = {
    naming_series: "SAL-ORD-.YYYY.-",
    customer: quotation.party_name,
    order_type: "Sales",
    transaction_date: today.toISOString().slice(0, 10),
    delivery_date: deliveryDate.toISOString().slice(0, 10),
    company: quotation.company,
    currency: quotation.currency,
    conversion_rate: 1,
    selling_price_list: quotation.selling_price_list,
    price_list_currency: quotation.price_list_currency,
    plc_conversion_rate: 1,
    customer_address: quotation.customer_address,
    contact_person: quotation.contact_person,
    shipping_address_name: quotation.shipping_address_name,
    territory: quotation.territory,
    customer_group: quotation.customer_group,
    tc_name: quotation.tc_name,
    terms: quotation.terms,
    title: quotation.title,
    items: orderItems,
  };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Sales Order", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/orders");
  revalidatePath(`/sales/quotations/${encodeURIComponent(quotationName)}`);
  redirect(`/sales/orders/${encodeURIComponent(name)}`);
}

/**
 * Bulk row-selection actions on the Sales Order list — the "Close"/"Re-open" items from
 * ERPNext's own `sales_order_list.js` `onload` (its bulk "Actions" menu, only shown once
 * rows are checked). Calls ERPNext's real whitelisted
 * `close_or_unclose_sales_orders(names, status)` directly (live-verified: toggles a real
 * order's `status` between "Closed" and its correct computed status, e.g. "To Deliver and
 * Bill", and back) rather than reimplementing its state machine here — that function
 * already silently skips anything not eligible (Draft/Cancelled docstatus, already
 * Cancelled/Closed, or — for Close only — already fully delivered and billed), so no
 * extra validation is duplicated on this side.
 */
export async function bulkCloseSalesOrdersAction(names: string[]): Promise<{ message: string }> {
  await callMethod("erpnext.selling.doctype.sales_order.sales_order.close_or_unclose_sales_orders", {
    names: JSON.stringify(names),
    status: "Closed",
  });
  revalidatePath("/sales/orders");
  return { message: `Closed ${names.length} sales order(s) (any not eligible were skipped).` };
}

/** Re-open: ERPNext's own list.js passes `status: "Submitted"` here — see the doc comment above. */
export async function bulkReopenSalesOrdersAction(names: string[]): Promise<{ message: string }> {
  await callMethod("erpnext.selling.doctype.sales_order.sales_order.close_or_unclose_sales_orders", {
    names: JSON.stringify(names),
    status: "Submitted",
  });
  revalidatePath("/sales/orders");
  return { message: `Re-opened ${names.length} sales order(s) (any not eligible were skipped).` };
}

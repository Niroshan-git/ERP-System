"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { callDocMethod, cancelDoc, createDoc, ErpNextError, getDoc, listDocs, submitDoc, updateDoc } from "@/lib/erpnext";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { parseLineRows } from "@/lib/lineRows";
import { getConnections } from "@/lib/connections";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this quotation.";
    if (e.status === 409) return "A quotation with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this quotation — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * Builds the full Quotation payload from the form + resolved selling defaults.
 * Throws a plain Error with a human-readable message on validation failure —
 * callers catch it and surface it the same way as an ERPNext rejection.
 */
async function buildQuotationFields(formData: FormData) {
  const party_name = String(formData.get("party_name") ?? "").trim();
  const transaction_date = String(formData.get("transaction_date") ?? "").trim();
  const valid_till = String(formData.get("valid_till") ?? "").trim() || undefined;
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

  // Document-level discount (Phase 4) — real stored ERPNext fields (confirmed via the live
  // Quotation DocType JSON), same three on Sales Order/Sales Invoice. A percentage takes
  // priority over a flat amount: ERPNext's own `set_discount_amount()`
  // (erpnext/controllers/taxes_and_totals.py) overwrites `discount_amount` from
  // `additional_discount_percentage` whenever the latter is set, so both are sent through
  // untouched and ERPNext itself resolves which one actually applies.
  const apply_discount_on = String(formData.get("apply_discount_on") ?? "Grand Total").trim() || "Grand Total";
  const additionalDiscountRaw = String(formData.get("additional_discount_percentage") ?? "").trim();
  const additional_discount_percentage = additionalDiscountRaw ? Number(additionalDiscountRaw) : undefined;
  const discountAmountRaw = String(formData.get("discount_amount") ?? "").trim();
  const discount_amount = discountAmountRaw ? Number(discountAmountRaw) : undefined;

  if (!party_name) throw new Error("Customer is required.");
  if (!transaction_date) throw new Error("Date is required.");

  const items = parseLineRows(formData, "items");
  if (items.length === 0) throw new Error("Add at least one item with a quantity and UOM.");

  const defaults = await getSellingDefaults(companyName);

  return {
    naming_series: "SAL-QTN-.YYYY.-",
    quotation_to: "Customer",
    party_name,
    transaction_date,
    valid_till,
    order_type,
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
    apply_discount_on,
    additional_discount_percentage,
    discount_amount,
    items,
  };
}

export async function createQuotationAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildQuotationFields>>;
  try {
    fields = await buildQuotationFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Quotation", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/quotations");
  redirect(`/sales/quotations/${encodeURIComponent(name)}`);
}

export async function updateQuotationAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildQuotationFields>>;
  try {
    fields = await buildQuotationFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    await updateDoc("Quotation", name, fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/quotations");
  revalidatePath(`/sales/quotations/${encodeURIComponent(name)}`);
  redirect(`/sales/quotations/${encodeURIComponent(name)}?saved=1`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitQuotationAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Quotation", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/quotations");
  revalidatePath(`/sales/quotations/${encodeURIComponent(name)}`);
  redirect(`/sales/quotations/${encodeURIComponent(name)}`);
}

/**
 * Bound to `(name)`; useActionState calls the bound function with (state, formData) which
 * are unused here. Same proactive guard as cancelSalesOrderAction — see that comment.
 */
export async function cancelQuotationAction(name: string): Promise<FormState> {
  const connections = await getConnections("Quotation", name);
  const blockingOrders = connections.find((c) => c.label === "Sales Order")?.submittedDocs ?? [];
  if (blockingOrders.length > 0) {
    return {
      error: `Cannot cancel — linked with Sales Order ${blockingOrders.join(", ")}. Cancel that first.`,
    };
  }

  try {
    await cancelDoc("Quotation", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/quotations");
  revalidatePath(`/sales/quotations/${encodeURIComponent(name)}`);
  redirect(`/sales/quotations/${encodeURIComponent(name)}`);
}

/**
 * "Set as Lost" — calls ERPNext's real `Quotation.declare_enquiry_lost(lost_reasons_list,
 * competitors, detailed_reason)` (confirmed by reading `quotation.py` on the live server;
 * NOT `set_as_lost`, which doesn't exist on this doctype) via callDocMethod, rather than
 * setting `status: "Lost"` directly through updateDoc — that field is fully
 * server-managed (`db_set`, not a normal validated save) and the lost-reasons child table
 * only gets populated through this exact method, so there is no faithful
 * updateDoc-shaped equivalent.
 *
 * `lost_reasons_list` items must be shaped `{ lost_reason: <Quotation Lost Reason name> }`
 * to match the `Quotation Lost Reason Detail` child table's own field name (confirmed via
 * its live DocType JSON) — matches ERPNext's own dialog in
 * `erpnext/public/js/utils/sales_common.js::pre_sales.set_as_lost`, which is also where
 * `competitors: []` (unused here — no Competitor picker built, out of scope for this pass;
 * declare_enquiry_lost accepts an empty list fine) and the optional `detailed_reason` free
 * text are confirmed as the exact same 3 args that real dialog sends.
 */
export async function setQuotationAsLostAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const lostReasons = formData
    .getAll("lost_reasons")
    .map((r) => String(r).trim())
    .filter(Boolean);
  if (lostReasons.length === 0) {
    return { error: "Select at least one lost reason." };
  }
  const detailed_reason = String(formData.get("detailed_reason") ?? "").trim() || undefined;

  try {
    await callDocMethod("Quotation", name, "declare_enquiry_lost", {
      lost_reasons_list: lostReasons.map((r) => ({ lost_reason: r })),
      competitors: [],
      detailed_reason,
    });
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/quotations");
  revalidatePath(`/sales/quotations/${encodeURIComponent(name)}`);
  redirect(`/sales/quotations/${encodeURIComponent(name)}`);
}

type QuotationForAmend = {
  docstatus: number;
  quotation_to: string;
  party_name: string;
  transaction_date: string;
  valid_till?: string;
  order_type: string;
  company: string;
  currency: string;
  selling_price_list: string;
  price_list_currency: string;
  customer_address?: string;
  contact_person?: string;
  shipping_address_name?: string;
  territory?: string;
  customer_group?: string;
  payment_terms_template?: string;
  tc_name?: string;
  terms?: string;
  title?: string;
  apply_discount_on?: string;
  additional_discount_percentage?: number;
  discount_amount?: number;
  items: {
    name: string;
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    rate: number;
    price_list_rate?: number;
    discount_percentage?: number;
    discount_amount?: number;
    pricing_rules?: string;
  }[];
};

/**
 * "Amend" — offered only on a Cancelled (docstatus 2) Quotation. Real ERPNext Desk has no
 * dedicated server-side "amend" whitelisted method: `form.js::amend_doc()` (read on the
 * live server) just calls `frappe.client.is_document_amended` to block a second amendment,
 * then does a client-side `frappe.model.copy_doc` (clears name/owner/dates/docstatus,
 * keeps every other field) and sets `amended_from` to the cancelled doc's name before the
 * user saves the resulting new Draft themselves. This mirrors that exact shape server-side
 * instead: re-fetch the cancelled doc, copy every same field `_make_sales_order`-style
 * carryover already established in orders/actions.ts covers (Address & Contact / Terms /
 * More Info, not just header+items), and create the new Draft in one step with
 * `amended_from` set.
 *
 * `naming_series` is still sent, but has no effect on the resulting name: Frappe's
 * `frappe.model.naming.set_new_name` special-cases `amended_from` first — this site's
 * `Document Naming Settings.default_amend_naming` is "Amend Counter" (confirmed live via
 * `bench execute`), so the new doc is actually named `<cancelled-name>-1` (or `-2`, etc.),
 * not a fresh naming-series number.
 */
export async function amendQuotationAction(name: string): Promise<FormState> {
  let source: QuotationForAmend;
  try {
    source = await getDoc<QuotationForAmend>("Quotation", name);
  } catch {
    return { error: "Could not load the quotation to amend." };
  }

  if (source.docstatus !== 2) {
    return { error: "Only a cancelled quotation can be amended." };
  }

  // Mirrors form.js's own `frappe.client.is_document_amended` pre-check — a cancelled
  // document can only be amended once.
  const existingAmendments = await listDocs<{ name: string }>("Quotation", {
    fields: ["name"],
    filters: [["amended_from", "=", name]],
    limit: 1,
  });
  if (existingAmendments.length > 0) {
    return { error: `Already amended as ${existingAmendments[0].name}.` };
  }

  const fields = {
    naming_series: "SAL-QTN-.YYYY.-",
    quotation_to: source.quotation_to,
    party_name: source.party_name,
    transaction_date: source.transaction_date,
    valid_till: source.valid_till,
    order_type: source.order_type,
    company: source.company,
    currency: source.currency,
    conversion_rate: 1,
    selling_price_list: source.selling_price_list,
    price_list_currency: source.price_list_currency,
    plc_conversion_rate: 1,
    customer_address: source.customer_address,
    contact_person: source.contact_person,
    shipping_address_name: source.shipping_address_name,
    territory: source.territory,
    customer_group: source.customer_group,
    payment_terms_template: source.payment_terms_template,
    tc_name: source.tc_name,
    terms: source.terms,
    title: source.title,
    apply_discount_on: source.apply_discount_on,
    additional_discount_percentage: source.additional_discount_percentage,
    discount_amount: source.discount_amount,
    items: source.items.map((i) => ({
      item_code: i.item_code,
      item_name: i.item_name,
      qty: i.qty,
      uom: i.uom,
      rate: i.rate,
      ...(i.price_list_rate
        ? {
            price_list_rate: i.price_list_rate,
            discount_percentage: i.discount_percentage,
            discount_amount: i.discount_amount,
            pricing_rules: i.pricing_rules,
          }
        : {}),
    })),
    amended_from: name,
  };

  let newName: string;
  try {
    const doc = await createDoc<{ name: string }>("Quotation", fields);
    newName = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/quotations");
  revalidatePath(`/sales/quotations/${encodeURIComponent(name)}`);
  redirect(`/sales/quotations/${encodeURIComponent(newName)}`);
}

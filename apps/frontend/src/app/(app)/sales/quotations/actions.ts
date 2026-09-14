"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, submitDoc, updateDoc } from "@/lib/erpnext";
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

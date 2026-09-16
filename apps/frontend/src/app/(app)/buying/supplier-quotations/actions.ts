"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, getDoc, submitDoc } from "@/lib/erpnext";
import { parseLineRows } from "@/lib/lineRows";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this supplier quotation.";
    if (e.status === 409) return "A supplier quotation with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this supplier quotation — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

type SourceRfqItem = { name: string; item_code: string };
type SourceRfq = { name: string; docstatus: number; company: string; items: SourceRfqItem[] };

/**
 * Supplier Quotation is only ever created from a submitted RFQ (like Request for
 * Quotation itself is only reachable from a Material Request) — there is no standalone
 * `new/`. `company` is always taken from the source RFQ, not exposed as a user field here
 * (a Supplier Quotation naturally belongs to the same company as the RFQ it answers) —
 * the plan's own build steps for this page list transaction_date/valid_till/currency/
 * conversion_rate/supplier as the exposed fields, company isn't among them.
 *
 * `request_for_quotation`/`request_for_quotation_item` back-references (real, stored
 * fields — confirmed via the live Supplier Quotation Item DocType JSON, required for
 * lib/connections.ts's RFQ -> Supplier Quotation connection) are attached by matching each
 * submitted row's `item_code` back to the source RFQ's own item list — LineItemsEditor
 * doesn't carry a source-row tag the way Sales Order's "Copy From Quotation" flow does, and
 * rows can be freely added/reordered/removed here, so item_code is the only reliable join
 * key available. Ambiguous if the same item_code appears more than once on one RFQ (picks
 * the first unclaimed match); rows whose item_code isn't found on the source RFQ (e.g. a
 * line the user added by hand) are still saved, just without the back-reference.
 */
export async function createSupplierQuotationFromRfqAction(
  rfqName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const supplier = String(formData.get("supplier") ?? "").trim();
  const currency = String(formData.get("currency") ?? "").trim();
  const conversion_rate = Number(formData.get("conversion_rate") ?? 1) || 1;
  const transaction_date = String(formData.get("transaction_date") ?? "").trim();
  const valid_till = String(formData.get("valid_till") ?? "").trim() || undefined;

  if (!supplier) return { error: "Select which supplier this quote is from." };
  if (!currency) return { error: "Currency is required." };
  if (!transaction_date) return { error: "Date is required." };

  const items = parseLineRows(formData, "items");
  if (items.length === 0) return { error: "Add at least one item with a quantity, UOM, and rate." };

  let source: SourceRfq;
  try {
    source = await getDoc<SourceRfq>("Request for Quotation", rfqName);
  } catch {
    return { error: "Could not load the source RFQ." };
  }
  if (source.docstatus !== 1) {
    return { error: "The source RFQ must be submitted first." };
  }

  const remainingSourceItems = [...source.items];
  const itemsWithBackref = items.map((row) => {
    const matchIndex = remainingSourceItems.findIndex((si) => si.item_code === row.item_code);
    if (matchIndex === -1) return row;
    const [matched] = remainingSourceItems.splice(matchIndex, 1);
    return { ...row, request_for_quotation: source.name, request_for_quotation_item: matched.name };
  });

  const fields = {
    supplier,
    company: source.company,
    currency,
    conversion_rate,
    transaction_date,
    valid_till,
    items: itemsWithBackref,
  };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Supplier Quotation", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/supplier-quotations");
  revalidatePath(`/buying/request-for-quotations/${encodeURIComponent(rfqName)}`);
  redirect(`/buying/supplier-quotations/${encodeURIComponent(name)}`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitSupplierQuotationAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Supplier Quotation", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/supplier-quotations");
  revalidatePath(`/buying/supplier-quotations/${encodeURIComponent(name)}`);
  redirect(`/buying/supplier-quotations/${encodeURIComponent(name)}`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function cancelSupplierQuotationAction(name: string): Promise<FormState> {
  try {
    await cancelDoc("Supplier Quotation", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/supplier-quotations");
  revalidatePath(`/buying/supplier-quotations/${encodeURIComponent(name)}`);
  redirect(`/buying/supplier-quotations/${encodeURIComponent(name)}`);
}

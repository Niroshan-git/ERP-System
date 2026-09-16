"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, getDoc, submitDoc } from "@/lib/erpnext";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this RFQ.";
    if (e.status === 409) return "An RFQ with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this RFQ — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

type SourceMaterialRequestItem = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  schedule_date: string;
  warehouse?: string;
};

type SourceMaterialRequest = {
  name: string;
  docstatus: number;
  items: SourceMaterialRequestItem[];
};

/**
 * RFQ is only ever created from a Material Request (like Pick List is only reachable via
 * Sales Order's own create-pick-list route) — there is no standalone `new/`. Copies the
 * source Material Request's full item set 1:1 at full qty (see create-rfq/page.tsx's own
 * doc comment for why no partial-qty picker is offered here), tagging each row with
 * `material_request`/`material_request_item` back-references (real, stored fields —
 * confirmed via the live Request for Quotation Item DocType JSON — required for
 * lib/connections.ts's Material Request -> Request for Quotation connection to work).
 *
 * `subject` is Request for Quotation's own required email-subject field (for its
 * supplier-emailing feature, out of scope here) — hard-coded to a fixed string, never
 * exposed as a user field, same treatment `material_request_type` gets on Material Request.
 */
export async function createRfqFromMaterialRequestAction(
  materialRequestName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const company = String(formData.get("company") ?? "").trim();
  const transaction_date = String(formData.get("transaction_date") ?? "").trim();
  const schedule_date = String(formData.get("schedule_date") ?? "").trim() || undefined;
  const suppliers = formData
    .getAll("suppliers")
    .map((s) => String(s).trim())
    .filter(Boolean);

  if (!company) return { error: "Company is required." };
  if (!transaction_date) return { error: "Date is required." };
  if (suppliers.length === 0) return { error: "Select at least one supplier." };

  let source: SourceMaterialRequest;
  try {
    source = await getDoc<SourceMaterialRequest>("Material Request", materialRequestName);
  } catch {
    return { error: "Could not load the source Material Request." };
  }
  if (source.docstatus !== 1) {
    return { error: "The source Material Request must be submitted first." };
  }
  if (source.items.length === 0) {
    return { error: "The source Material Request has no items to copy." };
  }

  const fields = {
    company,
    transaction_date,
    schedule_date,
    subject: "Request for Quotation",
    suppliers: suppliers.map((supplier) => ({ supplier })),
    items: source.items.map((i) => ({
      item_code: i.item_code,
      item_name: i.item_name,
      qty: i.qty,
      uom: i.uom,
      conversion_factor: 1,
      schedule_date: i.schedule_date,
      warehouse: i.warehouse,
      material_request: source.name,
      material_request_item: i.name,
    })),
  };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Request for Quotation", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/request-for-quotations");
  revalidatePath(`/buying/material-requests/${encodeURIComponent(materialRequestName)}`);
  redirect(`/buying/request-for-quotations/${encodeURIComponent(name)}`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitRfqAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Request for Quotation", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/request-for-quotations");
  revalidatePath(`/buying/request-for-quotations/${encodeURIComponent(name)}`);
  redirect(`/buying/request-for-quotations/${encodeURIComponent(name)}`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function cancelRfqAction(name: string): Promise<FormState> {
  try {
    await cancelDoc("Request for Quotation", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/request-for-quotations");
  revalidatePath(`/buying/request-for-quotations/${encodeURIComponent(name)}`);
  redirect(`/buying/request-for-quotations/${encodeURIComponent(name)}`);
}

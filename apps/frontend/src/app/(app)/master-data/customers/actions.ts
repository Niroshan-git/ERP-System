"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError, getDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData } from "@/lib/masterActions";
import { upsertCompanyRow, type PartyAccountRow } from "@/lib/financeDefaults";

export type FormState = { error?: string } | undefined;

// FIN-1G-D: `Party Account` row fields (docs/backend/06-accounting/account-determination.md §1/§6).
const PARTY_ACCOUNT_KEYS = ["account", "advance_account"];

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 409) return "A customer with that name already exists.";
    if (e.status === 403) return "Not allowed to save this customer.";
    return "ERPNext rejected this customer — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

function fieldsFromForm(formData: FormData) {
  return {
    customer_name: String(formData.get("customer_name") ?? "").trim(),
    customer_type: String(formData.get("customer_type") ?? ""),
    customer_group: String(formData.get("customer_group") ?? "") || undefined,
    territory: String(formData.get("territory") ?? "") || undefined,
    disabled: formData.get("disabled") ? 1 : 0,
  };
}

export async function createCustomerAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromForm(formData);
  if (!fields.customer_name) return { error: "Customer name is required." };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Customer", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/master-data/customers");
  redirect(`/master-data/customers/${encodeURIComponent(name)}`);
}

export async function updateCustomerAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromForm(formData);
  if (!fields.customer_name) return { error: "Customer name is required." };

  try {
    await updateDoc("Customer", name, fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/master-data/customers");
  revalidatePath(`/master-data/customers/${encodeURIComponent(name)}`);
  redirect(`/master-data/customers/${encodeURIComponent(name)}`);
}

/** `FIN-1G-D`. Same re-fetch-then-upsert-one-row pattern as `items/actions.ts`. */
export async function updateCustomerAccountingDefaultsAction(
  name: string,
  company: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, PARTY_ACCOUNT_KEYS);

  try {
    const customer = await getDoc<{ accounts?: PartyAccountRow[] }>("Customer", name);
    const accounts = upsertCompanyRow(customer.accounts, company, fields);
    await updateDoc("Customer", name, { accounts }, "update customer accounting defaults");
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath(`/master-data/customers/${encodeURIComponent(name)}`);
  redirect(
    `/master-data/customers/${encodeURIComponent(name)}?tab=accounting&company=${encodeURIComponent(company)}&saved=1`,
  );
}

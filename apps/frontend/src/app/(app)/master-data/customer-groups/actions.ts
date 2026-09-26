"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, getDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";
import { upsertCompanyRow, type PartyAccountRow } from "@/lib/financeDefaults";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = ["customer_group_name", "parent_customer_group", "default_price_list"];
const CHECKBOX_KEYS = ["is_group"];

// FIN-1G-D — same field list as customers/actions.ts's PARTY_ACCOUNT_KEYS (Customer Group shares
// the `Party Account` child-table doctype with Customer, fieldname `accounts`).
const PARTY_ACCOUNT_KEYS = ["account", "advance_account"];

export async function createCustomerGroupAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  if (!fields.customer_group_name) return { error: "Customer group name is required." };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Customer Group", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e, "customer group") };
  }

  revalidatePath("/master-data/customer-groups");
  redirect(`/master-data/customer-groups/${encodeURIComponent(name)}`);
}

export async function updateCustomerGroupAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  if (!fields.customer_group_name) return { error: "Customer group name is required." };

  try {
    await updateDoc("Customer Group", name, fields);
  } catch (e) {
    return { error: humanizeError(e, "customer group") };
  }

  revalidatePath("/master-data/customer-groups");
  revalidatePath(`/master-data/customer-groups/${encodeURIComponent(name)}`);
  redirect(`/master-data/customer-groups/${encodeURIComponent(name)}`);
}

/** `FIN-1G-D`. Same re-fetch-then-upsert-one-row pattern as `items/actions.ts`. */
export async function updateCustomerGroupAccountingDefaultsAction(
  name: string,
  company: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, PARTY_ACCOUNT_KEYS);

  try {
    const group = await getDoc<{ accounts?: PartyAccountRow[] }>("Customer Group", name);
    const accounts = upsertCompanyRow(group.accounts, company, fields);
    await updateDoc("Customer Group", name, { accounts }, "update customer group accounting defaults");
  } catch (e) {
    return { error: humanizeError(e, "customer group") };
  }

  revalidatePath(`/master-data/customer-groups/${encodeURIComponent(name)}`);
  redirect(
    `/master-data/customer-groups/${encodeURIComponent(name)}?tab=accounting&company=${encodeURIComponent(company)}&saved=1`,
  );
}

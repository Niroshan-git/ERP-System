"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = ["customer_group_name", "parent_customer_group", "default_price_list"];
const CHECKBOX_KEYS = ["is_group"];

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

  revalidatePath("/sales/customer-groups");
  redirect(`/sales/customer-groups/${encodeURIComponent(name)}`);
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

  revalidatePath("/sales/customer-groups");
  revalidatePath(`/sales/customer-groups/${encodeURIComponent(name)}`);
  redirect(`/sales/customer-groups/${encodeURIComponent(name)}`);
}

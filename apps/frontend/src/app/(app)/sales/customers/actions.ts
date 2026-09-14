"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError, updateDoc } from "@/lib/erpnext";

export type FormState = { error?: string } | undefined;

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

  revalidatePath("/sales/customers");
  redirect(`/sales/customers/${encodeURIComponent(name)}`);
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

  revalidatePath("/sales/customers");
  revalidatePath(`/sales/customers/${encodeURIComponent(name)}`);
  redirect(`/sales/customers/${encodeURIComponent(name)}`);
}

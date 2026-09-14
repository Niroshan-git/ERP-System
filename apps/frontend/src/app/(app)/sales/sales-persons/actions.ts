"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = ["sales_person_name", "parent_sales_person", "commission_rate", "employee"];
const CHECKBOX_KEYS = ["is_group", "enabled"];

export async function createSalesPersonAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  if (!fields.sales_person_name) return { error: "Sales person name is required." };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Sales Person", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e, "sales person") };
  }

  revalidatePath("/sales/sales-persons");
  redirect(`/sales/sales-persons/${encodeURIComponent(name)}`);
}

export async function updateSalesPersonAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  if (!fields.sales_person_name) return { error: "Sales person name is required." };

  try {
    await updateDoc("Sales Person", name, fields);
  } catch (e) {
    return { error: humanizeError(e, "sales person") };
  }

  revalidatePath("/sales/sales-persons");
  revalidatePath(`/sales/sales-persons/${encodeURIComponent(name)}`);
  redirect(`/sales/sales-persons/${encodeURIComponent(name)}`);
}

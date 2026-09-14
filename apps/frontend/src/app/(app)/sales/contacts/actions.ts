"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = ["first_name", "last_name", "email_id", "phone", "mobile_no", "company_name", "designation"];

export async function createContactAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS);
  if (!fields.first_name) return { error: "First name is required." };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Contact", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e, "contact") };
  }

  revalidatePath("/sales/contacts");
  redirect(`/sales/contacts/${encodeURIComponent(name)}`);
}

export async function updateContactAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS);
  if (!fields.first_name) return { error: "First name is required." };

  try {
    await updateDoc("Contact", name, fields);
  } catch (e) {
    return { error: humanizeError(e, "contact") };
  }

  revalidatePath("/sales/contacts");
  revalidatePath(`/sales/contacts/${encodeURIComponent(name)}`);
  redirect(`/sales/contacts/${encodeURIComponent(name)}`);
}

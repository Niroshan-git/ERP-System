"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = [
  "address_title",
  "address_type",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "country",
  "pincode",
  "email_id",
  "phone",
];
const CHECKBOX_KEYS = ["disabled"];

function validate(fields: Record<string, unknown>): string | undefined {
  if (!fields.address_type) return "Address type is required.";
  if (!fields.address_line1) return "Address line 1 is required.";
  if (!fields.city) return "City is required.";
  if (!fields.country) return "Country is required.";
  return undefined;
}

export async function createAddressAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  const error = validate(fields);
  if (error) return { error };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Address", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e, "address") };
  }

  revalidatePath("/sales/addresses");
  redirect(`/sales/addresses/${encodeURIComponent(name)}`);
}

export async function updateAddressAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  const error = validate(fields);
  if (error) return { error };

  try {
    await updateDoc("Address", name, fields);
  } catch (e) {
    return { error: humanizeError(e, "address") };
  }

  revalidatePath("/sales/addresses");
  revalidatePath(`/sales/addresses/${encodeURIComponent(name)}`);
  redirect(`/sales/addresses/${encodeURIComponent(name)}`);
}

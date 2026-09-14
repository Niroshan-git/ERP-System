"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = ["price_list_name", "currency"];
const CHECKBOX_KEYS = ["selling", "buying", "enabled"];

export async function createPriceListAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  if (!fields.price_list_name) return { error: "Price list name is required." };
  if (!fields.currency) return { error: "Currency is required." };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Price List", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e, "price list") };
  }

  revalidatePath("/sales/price-lists");
  redirect(`/sales/price-lists/${encodeURIComponent(name)}`);
}

export async function updatePriceListAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  if (!fields.price_list_name) return { error: "Price list name is required." };
  if (!fields.currency) return { error: "Currency is required." };

  try {
    await updateDoc("Price List", name, fields);
  } catch (e) {
    return { error: humanizeError(e, "price list") };
  }

  revalidatePath("/sales/price-lists");
  revalidatePath(`/sales/price-lists/${encodeURIComponent(name)}`);
  redirect(`/sales/price-lists/${encodeURIComponent(name)}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = ["territory_name", "parent_territory", "territory_manager"];
const CHECKBOX_KEYS = ["is_group"];

export async function createTerritoryAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  if (!fields.territory_name) return { error: "Territory name is required." };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Territory", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e, "territory") };
  }

  revalidatePath("/sales/territories");
  redirect(`/sales/territories/${encodeURIComponent(name)}`);
}

export async function updateTerritoryAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  if (!fields.territory_name) return { error: "Territory name is required." };

  try {
    await updateDoc("Territory", name, fields);
  } catch (e) {
    return { error: humanizeError(e, "territory") };
  }

  revalidatePath("/sales/territories");
  revalidatePath(`/sales/territories/${encodeURIComponent(name)}`);
  redirect(`/sales/territories/${encodeURIComponent(name)}`);
}

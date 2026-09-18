"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = ["item_group_name", "parent_item_group"];
const CHECKBOX_KEYS = ["is_group"];

export async function createItemGroupAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  if (!fields.item_group_name) return { error: "Item group name is required." };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Item Group", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e, "item group") };
  }

  revalidatePath("/master-data/item-groups");
  redirect(`/master-data/item-groups/${encodeURIComponent(name)}`);
}

export async function updateItemGroupAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);
  if (!fields.item_group_name) return { error: "Item group name is required." };

  try {
    await updateDoc("Item Group", name, fields);
  } catch (e) {
    return { error: humanizeError(e, "item group") };
  }

  revalidatePath("/master-data/item-groups");
  revalidatePath(`/master-data/item-groups/${encodeURIComponent(name)}`);
  redirect(`/master-data/item-groups/${encodeURIComponent(name)}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, getDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";
import { upsertCompanyRow, type ItemDefaultRow } from "@/lib/financeDefaults";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = ["item_group_name", "parent_item_group"];
const CHECKBOX_KEYS = ["is_group"];

// FIN-1G-D — same field list as items/actions.ts's ITEM_DEFAULT_KEYS (Item Group shares the
// `Item Default` child-table doctype with Item, fieldname `item_group_defaults`).
const ITEM_DEFAULT_KEYS = [
  "income_account",
  "expense_account",
  "default_cogs_account",
  "default_inventory_account",
  "buying_cost_center",
  "selling_cost_center",
  "default_discount_account",
  "default_provisional_account",
  "deferred_revenue_account",
  "deferred_expense_account",
  "expenses_added_to_stock_account",
  "expenses_added_to_stock_contra_account",
  "default_warehouse",
  "default_price_list",
  "default_supplier",
];

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

/** `FIN-1G-D`. Same re-fetch-then-upsert-one-row pattern as `items/actions.ts`. */
export async function updateItemGroupAccountingDefaultsAction(
  name: string,
  company: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, ITEM_DEFAULT_KEYS);

  try {
    const group = await getDoc<{ item_group_defaults?: ItemDefaultRow[] }>("Item Group", name);
    const item_group_defaults = upsertCompanyRow(group.item_group_defaults, company, fields);
    await updateDoc("Item Group", name, { item_group_defaults }, "update item group accounting defaults");
  } catch (e) {
    return { error: humanizeError(e, "item group") };
  }

  revalidatePath(`/master-data/item-groups/${encodeURIComponent(name)}`);
  redirect(
    `/master-data/item-groups/${encodeURIComponent(name)}?tab=accounting&company=${encodeURIComponent(company)}&saved=1`,
  );
}

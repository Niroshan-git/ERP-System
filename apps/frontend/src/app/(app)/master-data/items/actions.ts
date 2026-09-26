"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError, getDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData } from "@/lib/masterActions";
import { upsertCompanyRow, type ItemDefaultRow } from "@/lib/financeDefaults";

export type FormState = { error?: string } | undefined;

// FIN-1G-D: every field on one company's `Item Default` row (docs/backend/06-accounting/
// account-determination.md §1) — excludes the gated purchase_expense_account/_contra_account
// pair, same exclusion FIN-1G-C already applied at the Company level.
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

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 409) return "An item with that code already exists.";
    if (e.status === 403) return "Not allowed to save this item.";
    return "ERPNext rejected this item — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

export async function createItemAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const item_code = String(formData.get("item_code") ?? "").trim();
  const item_group = String(formData.get("item_group") ?? "").trim();
  const stock_uom = String(formData.get("stock_uom") ?? "").trim();

  if (!item_code) return { error: "Item code is required." };
  if (!item_group) return { error: "Item group is required." };
  if (!stock_uom) return { error: "Unit of measure is required." };

  const standardRateRaw = String(formData.get("standard_rate") ?? "").trim();

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Item", {
      item_code,
      item_name: String(formData.get("item_name") ?? "").trim() || item_code,
      item_group,
      stock_uom,
      is_stock_item: formData.get("is_stock_item") ? 1 : 0,
      standard_rate: standardRateRaw ? Number(standardRateRaw) : undefined,
      description: String(formData.get("description") ?? "").trim() || undefined,
      has_batch_no: formData.get("has_batch_no") ? 1 : 0,
      has_serial_no: formData.get("has_serial_no") ? 1 : 0,
      has_expiry_date: formData.get("has_expiry_date") ? 1 : 0,
      batch_number_series: String(formData.get("batch_number_series") ?? "").trim() || undefined,
      serial_no_series: String(formData.get("serial_no_series") ?? "").trim() || undefined,
    });
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/master-data/items");
  redirect(`/master-data/items/${encodeURIComponent(name)}`);
}

export async function updateItemAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const item_group = String(formData.get("item_group") ?? "").trim();
  const stock_uom = String(formData.get("stock_uom") ?? "").trim();
  if (!item_group) return { error: "Item group is required." };
  if (!stock_uom) return { error: "Unit of measure is required." };

  const standardRateRaw = String(formData.get("standard_rate") ?? "").trim();

  try {
    await updateDoc("Item", name, {
      item_name: String(formData.get("item_name") ?? "").trim() || name,
      item_group,
      stock_uom,
      is_stock_item: formData.get("is_stock_item") ? 1 : 0,
      disabled: formData.get("disabled") ? 1 : 0,
      standard_rate: standardRateRaw ? Number(standardRateRaw) : undefined,
      description: String(formData.get("description") ?? "").trim() || undefined,
      has_batch_no: formData.get("has_batch_no") ? 1 : 0,
      has_serial_no: formData.get("has_serial_no") ? 1 : 0,
      has_expiry_date: formData.get("has_expiry_date") ? 1 : 0,
      batch_number_series: String(formData.get("batch_number_series") ?? "").trim() || undefined,
      serial_no_series: String(formData.get("serial_no_series") ?? "").trim() || undefined,
    });
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/master-data/items");
  revalidatePath(`/master-data/items/${encodeURIComponent(name)}`);
  redirect(`/master-data/items/${encodeURIComponent(name)}`);
}

/**
 * `FIN-1G-D`. Re-fetches the Item fresh (rather than trusting a hidden-field snapshot) so this
 * read-modify-write only ever touches the one row for `company` — every other company's
 * `Item Default` row passes through `upsertCompanyRow` untouched.
 */
export async function updateItemAccountingDefaultsAction(
  name: string,
  company: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, ITEM_DEFAULT_KEYS);

  try {
    const item = await getDoc<{ item_defaults?: ItemDefaultRow[] }>("Item", name);
    const item_defaults = upsertCompanyRow(item.item_defaults, company, fields);
    await updateDoc("Item", name, { item_defaults }, "update item accounting defaults");
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath(`/master-data/items/${encodeURIComponent(name)}`);
  redirect(
    `/master-data/items/${encodeURIComponent(name)}?tab=accounting&company=${encodeURIComponent(company)}&saved=1`,
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";

export type FormState = { error?: string } | undefined;

// Every real, stored field on the Selling Settings DocType (Document Naming tab's
// "Configure Series" button and virtual field excluded — no real value to save there).
const TEXT_KEYS = [
  "cust_master_name",
  "customer_group",
  "territory",
  "selling_price_list",
  "maintain_same_rate_action",
  "role_to_override_stop_action",
  "so_required",
  "dn_required",
  "sales_update_frequency",
  "blanket_order_allowance",
];

const CHECKBOX_KEYS = [
  "fallback_to_default_price_list",
  "editable_price_list_rate",
  "maintain_same_sales_rate",
  "validate_selling_price",
  "editable_bundle_item_rates",
  "allow_negative_rates_for_items",
  "allow_multiple_items",
  "allow_against_multiple_purchase_orders",
  "hide_tax_id",
  "allow_sales_order_creation_for_expired_quotation",
  "dont_reserve_sales_order_qty_on_sales_return",
  "enable_cutoff_date_on_bulk_delivery_note_creation",
  "set_zero_rate_for_expired_batch",
  "allow_zero_qty_in_quotation",
  "allow_zero_qty_in_sales_order",
  "enable_tracking_sales_commissions",
  "enable_discount_accounting",
  "enable_utm",
  "use_legacy_js_reactivity",
  "allow_delivery_of_overproduced_qty",
  "deliver_secondary_items",
];

/**
 * Selling Settings is a Frappe "Single" — one document whose name always equals the
 * DocType name, so unlike every other actions.ts in this app there's no `name` param to
 * bind, just PUT straight to `/api/resource/Selling Settings/Selling Settings`.
 */
export async function updateSellingSettingsAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS, CHECKBOX_KEYS);

  try {
    await updateDoc("Selling Settings", "Selling Settings", fields);
  } catch (e) {
    return { error: humanizeError(e, "selling settings") };
  }

  revalidatePath("/sales/settings");
  redirect("/sales/settings?saved=1");
}

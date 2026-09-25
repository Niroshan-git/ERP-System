"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";

export type FormState = { error?: string } | undefined;

// Every Account/Warehouse/Cost Center default field this package puts on screen — the
// General/Sales & Receivables/Purchasing & Payables/Inventory/Manufacturing field list from
// docs/backend/06-accounting/account-determination.md §2, live-verified against the real
// Company doctype schema (fieldnames, labels, and Link `options` all confirmed, 2026-09-25).
// Fixed Asset fields, the Tax section (no such Company field exists), and the gated
// purchase_expense_account/purchase_expense_contra_account pair are deliberately excluded —
// out of `FIN-1G-C` scope per the mission brief.
const TEXT_KEYS = [
  // General
  "default_bank_account",
  "default_cash_account",
  "write_off_account",
  "default_discount_account",
  "round_off_account",
  "round_off_cost_center",
  "exchange_gain_loss_account",
  "unrealized_exchange_gain_loss_account",
  "cost_center",
  // Sales & Receivables
  "default_receivable_account",
  "default_income_account",
  "default_deferred_revenue_account",
  "default_advance_received_account",
  // Purchasing & Payables
  "default_payable_account",
  "default_expense_account",
  "service_expense_account",
  "stock_received_but_not_billed",
  "default_deferred_expense_account",
  "default_advance_paid_account",
  "default_provisional_account",
  // Inventory
  "default_inventory_account",
  "stock_adjustment_account",
  "expenses_added_to_stock_account",
  "expenses_added_to_stock_contra_account",
  // Manufacturing
  "default_wip_warehouse",
  "default_fg_warehouse",
  "default_scrap_warehouse",
  "default_operating_cost_account",
];

/**
 * `Company` is a real doctype (not a Single like Selling Settings), so unlike
 * `sales/settings/actions.ts` this action needs the target company's `name` bound in before
 * `useActionState` ever calls it — `page.tsx` supplies it via
 * `updateAccountDeterminationAction.bind(null, company)`, which is why `company` is the first
 * parameter here rather than living inside `formData`.
 *
 * Per `fieldsFromFormData`'s own contract, a field left blank in the form is omitted from the
 * PUT payload entirely (not sent as an explicit empty string) so an existing ERPNext value is
 * never accidentally clobbered by a blank input — the same "never clear via this shared
 * helper" behavior Selling Settings already has. Clearing a previously-set account/warehouse
 * default back to empty is not possible through this form; that's an existing limitation of
 * the shared `fieldsFromFormData` helper this package reuses as directed, not something new
 * introduced here.
 */
export async function updateAccountDeterminationAction(
  company: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS);

  try {
    await updateDoc("Company", company, fields);
  } catch (e) {
    return { error: humanizeError(e, "account determination settings") };
  }

  revalidatePath("/accounting/account-determination");
  redirect(`/accounting/account-determination?company=${encodeURIComponent(company)}&saved=1`);
}

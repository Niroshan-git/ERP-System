"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { callMethodWithResult, createDoc, deleteDoc, ErpNextError, getDoc, updateDoc } from "@/lib/erpnext";
import { getAccountDependencies } from "@/lib/accountDependencies";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this account.";
    if (e.status === 404) return "That account no longer exists.";
    if (e.status === 409) return "An account with that name already exists.";
    // ERPNext's own validation messages (Root cannot be edited, Parent account can not be a
    // ledger, Account with existing transaction cannot be converted to ledger, Account Number
    // already used, System In Use, etc. — all live-verified against ERPNext 16.34.2, 2026-09-24)
    // are already human-readable — prefer them over a generic fallback whenever present.
    return e.erpnextMessage ?? "ERPNext rejected this account — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * Field set live-verified against ERPNext 16.34.2's real `Account` controller
 * (`erpnext/accounts/doctype/account/account.py`, read directly off the live server,
 * 2026-09-24) — see `docs/backend/06-accounting/chart-of-accounts-bank-account.md` for the
 * full rule-by-rule citation. Two fields are deliberately excluded from every submitted
 * payload rather than merely hidden in the UI:
 *
 * - `root_type`/`report_type` — live-confirmed `set_root_and_report_type()` recomputes both
 *   from the parent on every save for a non-root account regardless of what's sent, and a
 *   root account can never be created or edited through this app (see below) — so there is
 *   never a case where a client-supplied value here would matter.
 * - `company` on edit — Account.company has no supported "move to another company" flow in
 *   ERPNext itself (Desk's own client script treats it as fixed after insert); omitted from
 *   `updateAccountAction`'s payload entirely so it's structurally impossible for this app to
 *   attempt it.
 *
 * `disabled` is intentionally never part of this field set at all — it's a dedicated
 * lifecycle action (`setAccountDisabledAction` below), not an edit-form field, so saving the
 * edit form can never silently flip an account's disabled state back to enabled as a side
 * effect of an unrelated save (the bug that would exist if this form both rendered and
 * omitted a checkbox for it).
 */
function buildAccountFields(formData: FormData, opts: { isEdit: boolean }) {
  const account_name = String(formData.get("account_name") ?? "").trim();
  const account_number = String(formData.get("account_number") ?? "").trim() || undefined;
  const company = String(formData.get("company") ?? "").trim();
  const parent_account = String(formData.get("parent_account") ?? "").trim();
  const is_group = formData.get("is_group") ? 1 : 0;
  const account_type = String(formData.get("account_type") ?? "").trim() || undefined;
  const account_category = String(formData.get("account_category") ?? "").trim() || undefined;
  const account_currency = String(formData.get("account_currency") ?? "").trim() || undefined;
  const balance_must_be = String(formData.get("balance_must_be") ?? "").trim() || undefined;
  const tax_rate = formData.get("tax_rate") ? Number(formData.get("tax_rate")) : undefined;
  // Freeze Account: live-verified `validate_frozen_accounts_modifier()` throws "You are not
  // authorized to set Frozen value" on ANY change to this field once a document exists,
  // because neither live Company (`Ceylon Stack`/`Ceylon Stack (Demo)`) has
  // `role_allowed_for_frozen_entries` configured — that check is unconditional in that case,
  // not role-dependent. It's a no-op on insert (no `doc_before_save` to compare against), so
  // this app only ever sends it on create; edit never includes it in the payload at all (see
  // AccountForm — the edit view shows it as a disabled/read-only field with an explanation).
  const freeze_account = opts.isEdit ? undefined : String(formData.get("freeze_account") ?? "").trim() || undefined;

  if (!account_name) throw new Error("Account name is required.");
  if (!company) throw new Error("Company is required.");
  if (!parent_account) {
    throw new Error("Parent account is required — every account must be created under an existing group account.");
  }

  return {
    account_name,
    account_number,
    company,
    parent_account,
    is_group,
    // Account Type/Currency only mean anything for a ledger (`Account.account_currency`'s own
    // `depends_on: eval:doc.is_group==0`, live-verified) — stripped for a group so a later
    // Ledger->Group conversion never trips `validate_group_or_ledger()`'s "Cannot covert to
    // Group because Account Type is selected" guard over a value this app itself set.
    account_type: is_group ? undefined : account_type,
    account_currency: is_group ? undefined : account_currency,
    account_category,
    balance_must_be,
    tax_rate,
    freeze_account,
  };
}

export async function createAccountAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: ReturnType<typeof buildAccountFields>;
  try {
    fields = buildAccountFields(formData, { isEdit: false });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Account", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/accounting/chart-of-accounts");
  redirect(`/accounting/chart-of-accounts/${encodeURIComponent(name)}?saved=1`);
}

/**
 * Renaming an Account (changing `account_name`/`account_number`) is NOT a plain field update
 * — live-verified 2026-09-24: a plain `PUT`/`doc.save()` with a new `account_name` updates
 * the field but leaves the document's own `name` (its ID, e.g. "Debtors - CS") stale, because
 * `autoname()` only runs on insert. ERPNext's own Desk UI routes every Account rename through
 * the whitelisted `update_account_number(name, account_name, account_number)` function
 * instead, which does the field update AND `frappe.rename_doc()` together, atomically. This
 * action mirrors that: it only calls that method when `account_name`/`account_number`
 * actually changed, then applies every other field via a normal `updateDoc` against the
 * (possibly new) resulting name. `update_account_number` also enforces `_ensure_idle_system()`
 * live-verified: it throws "System In Use" if any GL Entry was written in the last 5 minutes
 * tenant-wide — a real operational constraint on a busy tenant, surfaced via `humanizeError`
 * like any other ERPNext validation, not silently retried or swallowed.
 */
export async function updateAccountAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: ReturnType<typeof buildAccountFields>;
  try {
    fields = buildAccountFields(formData, { isEdit: true });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let currentName = name;
  try {
    const current = await getDoc<{ account_name: string; account_number?: string; parent_account?: string }>(
      "Account",
      name,
    );

    if (!current.parent_account) {
      return { error: "Root accounts can't be edited — ERPNext protects the 5 root accounts structurally." };
    }

    const nameChanged =
      fields.account_name !== current.account_name || (fields.account_number ?? "") !== (current.account_number ?? "");

    if (nameChanged) {
      const newName = await callMethodWithResult<string | null>(
        "erpnext.accounts.doctype.account.account.update_account_number",
        { name, account_name: fields.account_name, account_number: fields.account_number },
      );
      if (newName) currentName = newName;
    }

    // `account_name`/`account_number` were just handled above via `update_account_number` (or
    // deliberately left unchanged); `company` is never sent on edit (see this file's top
    // doc comment) — every other field is a normal PUT.
    await updateDoc("Account", currentName, {
      parent_account: fields.parent_account,
      is_group: fields.is_group,
      account_type: fields.account_type,
      account_currency: fields.account_currency,
      account_category: fields.account_category,
      balance_must_be: fields.balance_must_be,
      tax_rate: fields.tax_rate,
    });
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/accounting/chart-of-accounts");
  revalidatePath(`/accounting/chart-of-accounts/${encodeURIComponent(currentName)}`);
  redirect(`/accounting/chart-of-accounts/${encodeURIComponent(currentName)}?saved=1`);
}

/**
 * Dedicated Enable/Disable toggle, separate from the full edit form — same reasoning as
 * `cancelBomAction`/`deleteBankAccountAction`'s single-argument action precedent: a one-click
 * lifecycle action shouldn't require opening the edit form. Re-checks dependencies
 * server-side right before writing (defense in depth against a stale page — a root account
 * or a Company-default account must never be disabled even if the button somehow rendered).
 */
export async function setAccountDisabledAction(name: string, nextDisabled: boolean): Promise<FormState> {
  try {
    const doc = await getDoc<{ company: string; parent_account?: string }>("Account", name);
    if (!doc.parent_account) {
      return { error: "Root accounts can't be edited — ERPNext protects the 5 root accounts structurally." };
    }
    if (nextDisabled) {
      const deps = await getAccountDependencies(name, doc.company, doc.parent_account);
      if (!deps.canDisable) {
        return { error: deps.blockReasons[0] ?? "This account can't be disabled right now." };
      }
    }
    await updateDoc("Account", name, { disabled: nextDisabled ? 1 : 0 }, nextDisabled ? "disable Account" : "enable Account");
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/accounting/chart-of-accounts");
  revalidatePath(`/accounting/chart-of-accounts/${encodeURIComponent(name)}`);
  redirect(`/accounting/chart-of-accounts/${encodeURIComponent(name)}?saved=1`);
}

/**
 * Delete re-checks the same dependency summary the detail page uses to decide whether to
 * even render this action — defense in depth against a stale page, same precedent every
 * other guarded action in this file follows. ERPNext's own generic `check_if_doc_is_linked`
 * (source-confirmed, `frappe/model/delete_doc.py`: for `method="Delete"` it blocks on *any*
 * Link reference across the whole schema, draft or submitted, not just submitted ones — a
 * stricter rule than the Cancel-guard pattern `lib/connections.ts` documents elsewhere) plus
 * `Account.on_trash()`'s own GL-entry/child-account checks remain the real, final authority —
 * this pre-check only avoids showing the button in the first place for the handful of cases
 * this app can already explain in plain language.
 */
export async function deleteAccountAction(name: string): Promise<FormState> {
  try {
    const doc = await getDoc<{ company: string; parent_account?: string }>("Account", name);
    const deps = await getAccountDependencies(name, doc.company, doc.parent_account);
    if (!deps.canDelete) {
      return { error: deps.blockReasons[0] ?? "This account can't be deleted right now." };
    }
    await deleteDoc("Account", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/accounting/chart-of-accounts");
  redirect("/accounting/chart-of-accounts");
}

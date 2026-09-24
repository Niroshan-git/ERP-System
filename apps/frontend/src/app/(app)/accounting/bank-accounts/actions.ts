"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, deleteDoc, ErpNextError, getDoc, updateDoc } from "@/lib/erpnext";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this bank account.";
    if (e.status === 404) return "That bank account no longer exists.";
    // ERPNext's own validation messages (duplicate account link, missing Company for a
    // company account, delete blocked by a linked document via LinkExistsError, etc.) are
    // already human-readable — prefer them over a generic fallback whenever present.
    return e.erpnextMessage ?? "ERPNext rejected this bank account — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * `Bank Account.bank` is a mandatory Link to `Bank` (live-verified via `get_meta` on
 * ERPNext 16.34.2, 2026-09-24: `reqd: 1`), and the live tenant has zero `Bank` records —
 * FIN-0's flagged-but-unresolved question ("does Bank Account creation depend on Bank
 * existing first?") is confirmed yes. Rather than build a separate Bank master list/detail
 * CRUD screen to route around that (explicitly out of scope per the FIN-1 brief), this
 * resolves the typed bank name against an existing `Bank` record by exact name match — `Bank`
 * autonames as `field:bank_name` (also live-verified), so `getDoc("Bank", name)` is a direct
 * existence check, not a search — and transparently creates a minimal `Bank` record
 * (`bank_name` only, the doctype's only mandatory field) the first time a given bank name is
 * used. This is the smallest change that makes Bank Account usable from an empty tenant; it
 * intentionally does not expose a way to edit/delete a `Bank` record or browse the list of
 * banks created this way (`fetchLinkOptions("Bank")` in the create/edit pages covers "pick an
 * existing one," a `<datalist>` for autocomplete) — see
 * `docs/backend/06-accounting/chart-of-accounts-bank-account.md`.
 */
async function resolveBankName(bankNameInput: string): Promise<string> {
  const trimmed = bankNameInput.trim();
  try {
    const existing = await getDoc<{ name: string }>("Bank", trimmed);
    return existing.name;
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) {
      const created = await createDoc<{ name: string }>("Bank", { bank_name: trimmed });
      return created.name;
    }
    throw e;
  }
}

/**
 * Field set deliberately narrower than the full live `Bank Account` schema — omits
 * `account_type`/`account_subtype` (Link fields to `Bank Account Type`/`Bank Account Subtype`,
 * both zero live records, no screen to manage them, matching the same "don't build a whole
 * other master for an optional field with no data" call as the Bank get-or-create above),
 * `party_type`/`party` (Dynamic Link — customer/supplier-owned bank accounts are a real future
 * need but not the V1 blocker; FIN-1's blocker is company bank setup for Payment Entry, see
 * `finance-architecture.md` §12/§24), `statement_password` (Frappe `Password` fieldtype —
 * intentionally not exposed in a plain form; handling it correctly is its own scoped concern,
 * not folded into this package), and every integration/system field (`integration_id`,
 * `last_integration_date`, `mask` — the last of which, live-verified, is never actually
 * computed anywhere in ERPNext's Python or JS controllers on this version, so it isn't a
 * usable source of a masked display value either; see `lib/format.ts`'s `maskSensitive`).
 */
function buildBankAccountFields(formData: FormData) {
  const account_name = String(formData.get("account_name") ?? "").trim();
  const bank = String(formData.get("bank") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim() || undefined;
  const account = String(formData.get("account") ?? "").trim() || undefined;
  const branch_code = String(formData.get("branch_code") ?? "").trim() || undefined;
  const bank_account_no = String(formData.get("bank_account_no") ?? "").trim() || undefined;
  const iban = String(formData.get("iban") ?? "").trim() || undefined;
  const is_default = formData.get("is_default") ? 1 : 0;
  const is_company_account = formData.get("is_company_account") ? 1 : 0;
  const is_credit_card = formData.get("is_credit_card") ? 1 : 0;
  const disabled = formData.get("disabled") ? 1 : 0;

  if (!account_name) throw new Error("Account name is required.");
  if (!bank) throw new Error("Bank is required.");

  return {
    account_name,
    bank,
    company,
    account,
    branch_code,
    bank_account_no,
    iban,
    is_default,
    is_company_account,
    is_credit_card,
    disabled,
  };
}

export async function createBankAccountAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: ReturnType<typeof buildBankAccountFields>;
  try {
    fields = buildBankAccountFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const bankName = await resolveBankName(fields.bank);
    const doc = await createDoc<{ name: string }>("Bank Account", { ...fields, bank: bankName });
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/accounting/bank-accounts");
  redirect(`/accounting/bank-accounts/${encodeURIComponent(name)}`);
}

export async function updateBankAccountAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: ReturnType<typeof buildBankAccountFields>;
  try {
    fields = buildBankAccountFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    const bankName = await resolveBankName(fields.bank);
    await updateDoc("Bank Account", name, { ...fields, bank: bankName });
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/accounting/bank-accounts");
  revalidatePath(`/accounting/bank-accounts/${encodeURIComponent(name)}`);
  redirect(`/accounting/bank-accounts/${encodeURIComponent(name)}?saved=1`);
}

/**
 * `Bank Account.on_trash` (live-read from `bank_account.py`, 2026-09-24) only cleans up
 * linked Contact/Address rows and any `Bank Account Balance` snapshots — it does not itself
 * block on Payment Entry/GL links; Frappe's generic link-check (`LinkExistsError`) is what
 * would actually block a delete once a Bank Account has been used on a real transaction, and
 * its message surfaces via `humanizeError`'s `erpnextMessage` fallback like every other
 * delete-blocked case in this app.
 *
 * Takes only `name`, not `DocActionBar`'s full `(state, formData)` shape — same precedent
 * `cancelBomAction`/`cancelWorkOrderAction` set for a no-input action: `.bind(null, doc.name)`
 * on a single-argument function is still assignable to `DocActionBar`'s two-argument `action`
 * prop (a callback expecting more args always accepts a function declaring fewer), so there's
 * no need for unused `_prevState`/`_formData` parameters here.
 */
export async function deleteBankAccountAction(name: string): Promise<FormState> {
  try {
    await deleteDoc("Bank Account", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/accounting/bank-accounts");
  redirect("/accounting/bank-accounts");
}

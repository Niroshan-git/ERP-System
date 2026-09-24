import "server-only";
import { getCount, getDoc, listDocs } from "@/lib/erpnext";

/**
 * `Company`'s own "default account" fields (live-verified list, `frappe.get_meta("Account")`
 * + `Company` field dump, 2026-09-24) — `Account.validate_default_accounts_in_company()`
 * (read directly from `account.py` on the live server) blocks disabling or group-converting
 * any Account currently set as one of these on its Company. Mirrored here so the UI can
 * explain *why* an action is unavailable instead of only showing ERPNext's own error after a
 * failed attempt.
 */
const COMPANY_DEFAULT_ACCOUNT_FIELDS: { field: string; label: string }[] = [
  { field: "default_bank_account", label: "Default Bank Account" },
  { field: "default_cash_account", label: "Default Cash Account" },
  { field: "default_receivable_account", label: "Default Receivable Account" },
  { field: "default_payable_account", label: "Default Payable Account" },
  { field: "default_expense_account", label: "Default Expense Account" },
  { field: "default_income_account", label: "Default Income Account" },
  { field: "stock_received_but_not_billed", label: "Stock Received But Not Billed Account" },
  { field: "stock_adjustment_account", label: "Stock Adjustment Account" },
  { field: "write_off_account", label: "Write Off Account" },
  { field: "default_discount_account", label: "Default Payment Discount Account" },
  { field: "round_off_account", label: "Round Off Account" },
  { field: "unrealized_profit_loss_account", label: "Unrealized Profit / Loss Account" },
  { field: "exchange_gain_loss_account", label: "Exchange Gain / Loss Account" },
  { field: "unrealized_exchange_gain_loss_account", label: "Unrealized Exchange Gain / Loss Account" },
  { field: "default_deferred_revenue_account", label: "Default Deferred Revenue Account" },
  { field: "default_deferred_expense_account", label: "Default Deferred Expense Account" },
  { field: "accumulated_depreciation_account", label: "Accumulated Depreciation Account" },
  { field: "depreciation_expense_account", label: "Depreciation Expense Account" },
  { field: "disposal_account", label: "Gain/Loss Account on Asset Disposal" },
];

export type AccountDependencies = {
  isRoot: boolean;
  glEntryCount: number;
  childAccountCount: number;
  bankAccounts: string[];
  companyDefaultRoles: string[];
  /**
   * Best-effort, proactive-only summary — same "UI nicety, not the source of truth" precedent
   * `lib/connections.ts` documents for every one of its own entries. ERPNext's own generic
   * `check_if_doc_is_linked` (any Link field across the whole schema, not just the four
   * checks above) is the actual authority on delete; this only surfaces the handful of
   * dependencies this app can explain in plain language before the user even tries.
   */
  canDelete: boolean;
  canDisable: boolean;
  blockReasons: string[];
};

/**
 * Live-checks the handful of dependencies this app can explain in plain language before a
 * user attempts to delete or disable an Account — reused by both the detail page (to decide
 * whether to render the action at all) and the server actions themselves (defense in depth
 * against a stale page). Root accounts (`parent_account` unset) are always blocked outright:
 * live-verified 2026-09-24 that ERPNext's own `Account.validate_root_details()` throws
 * "Root cannot be edited." on *any* update to a root account, unconditionally — this app
 * mirrors that by never offering an edit/disable/delete affordance for one, rather than
 * letting the user hit that error after filling out a form.
 */
export async function getAccountDependencies(
  name: string,
  company: string,
  parentAccount: string | null | undefined,
): Promise<AccountDependencies> {
  const isRoot = !parentAccount;

  const [glEntryCount, childAccountCount, bankAccountRows, companyDoc] = await Promise.all([
    getCount("GL Entry", [["account", "=", name]]).catch(() => 0),
    getCount("Account", [["parent_account", "=", name]]).catch(() => 0),
    listDocs<{ name: string }>("Bank Account", { fields: ["name"], filters: [["account", "=", name]], limit: 50 }).catch(
      () => [] as { name: string }[],
    ),
    getDoc<Record<string, unknown>>("Company", company).catch(() => null),
  ]);

  const bankAccounts = bankAccountRows.map((b) => b.name);
  const companyDefaultRoles = companyDoc
    ? COMPANY_DEFAULT_ACCOUNT_FIELDS.filter((f) => companyDoc[f.field] === name).map((f) => f.label)
    : [];

  const blockReasons: string[] = [];
  if (isRoot) {
    blockReasons.push(
      "This is a root account for its company — ERPNext structurally protects the 5 root accounts from editing, disabling, or deletion.",
    );
  }
  if (glEntryCount > 0) {
    blockReasons.push(
      `${glEntryCount} General Ledger ${glEntryCount === 1 ? "entry references" : "entries reference"} this account — ERPNext keeps a financial account with any posted activity from being deleted.`,
    );
  }
  if (childAccountCount > 0) {
    blockReasons.push(
      `${childAccountCount} account${childAccountCount === 1 ? " is" : "s are"} nested under this one — delete or move those first.`,
    );
  }
  if (bankAccounts.length > 0) {
    blockReasons.push(`Linked to Bank Account${bankAccounts.length === 1 ? "" : "s"}: ${bankAccounts.join(", ")}.`);
  }
  if (companyDefaultRoles.length > 0) {
    blockReasons.push(`Set as ${company}'s ${companyDefaultRoles.join(", ")}.`);
  }

  return {
    isRoot,
    glEntryCount,
    childAccountCount,
    bankAccounts,
    companyDefaultRoles,
    canDelete: blockReasons.length === 0,
    canDisable: !isRoot && companyDefaultRoles.length === 0,
    blockReasons,
  };
}

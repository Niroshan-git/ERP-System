import "server-only";
import { listDocs } from "@/lib/erpnext";
import type { FieldSpec } from "@/components/MasterForm";

export type CompanyOptions = {
  companies: string[];
  company: string;
};

/**
 * Finance-module analog of `stockDefaults.ts`'s `getStockDefaults` — resolves the full list
 * of Company records plus a selected/default company, for pages (Chart of Accounts, Bank
 * Account create) that need a company selector rather than one fixed default. Two companies
 * exist live (`Ceylon Stack`, `Ceylon Stack (Demo)`) — `companyName` lets a caller (e.g. a
 * page's own `?company=` search param) pick one explicitly; falls back to the first company
 * alphabetically when omitted or invalid, same fallback rule `getStockDefaults` uses.
 */
export async function getCompanyOptions(companyName?: string): Promise<CompanyOptions> {
  const companies = await listDocs<{ name: string }>("Company", {
    fields: ["name"],
    limit: 20,
    orderBy: "name asc",
  });
  const companyNames = companies.map((c) => c.name);
  const company = (companyName && companyNames.includes(companyName) ? companyName : companyNames[0]) as
    | string
    | undefined;

  if (!company) {
    throw new Error("No Company exists in ERPNext yet.");
  }

  return { companies: companyNames, company };
}

/**
 * Company- and postability-scoped Link options for the Account Determination workspace
 * (`FIN-1G-C`). Deliberately narrower than `fetchLinkOptions("Account"/"Warehouse"/"Cost
 * Center")`: a Company-level account-default field should only ever offer postable leaf
 * accounts/warehouses/cost centers that actually belong to the company being configured, not
 * every group node or every company's records mixed together — verified live via
 * `get_doctype_fields` that all three doctypes carry `company` and `is_group`
 * (`docs/backend/06-accounting/account-determination.md` FIN-1G-C discovery).
 */
async function getScopedOptions(doctype: "Account" | "Warehouse" | "Cost Center", company: string): Promise<string[]> {
  const rows = await listDocs<{ name: string }>(doctype, {
    fields: ["name"],
    filters: [
      ["company", "=", company],
      ["is_group", "=", 0],
    ],
    limit: 500,
    orderBy: "name asc",
  });
  return rows.map((r) => r.name);
}

export function getScopedAccountOptions(company: string): Promise<string[]> {
  return getScopedOptions("Account", company);
}

export function getScopedWarehouseOptions(company: string): Promise<string[]> {
  return getScopedOptions("Warehouse", company);
}

export function getScopedCostCenterOptions(company: string): Promise<string[]> {
  return getScopedOptions("Cost Center", company);
}

/**
 * `Item Default` (fieldname `item_defaults` on Item, `item_group_defaults` on Item Group) and
 * `Party Account` (fieldname `accounts` on Customer/Customer Group/Supplier) rows — one row per
 * Company. Live-verified shape per `docs/backend/06-accounting/account-determination.md` §1
 * (`FIN-1G-A`/`FIN-1G-B`). `FIN-1G-D` scope: Item, Item Group, Customer, Customer Group, Supplier
 * only — Brand and Supplier Group are deferred (no existing frontend page to attach the UX to;
 * see this package's `PROGRESS.md`/`CLAUDE.md` entries).
 */
export type ItemDefaultRow = {
  [key: string]: unknown;
  name?: string;
  company: string;
  income_account?: string;
  expense_account?: string;
  default_cogs_account?: string;
  default_inventory_account?: string;
  buying_cost_center?: string;
  selling_cost_center?: string;
  default_discount_account?: string;
  default_provisional_account?: string;
  deferred_revenue_account?: string;
  deferred_expense_account?: string;
  expenses_added_to_stock_account?: string;
  expenses_added_to_stock_contra_account?: string;
  default_warehouse?: string;
  default_price_list?: string;
  default_supplier?: string;
};

export type PartyAccountRow = {
  [key: string]: unknown;
  name?: string;
  company: string;
  account?: string;
  advance_account?: string;
};

/** Finds the one row (if any) matching a given Company in a company-scoped child table. */
export function findCompanyRow<T extends { company?: string }>(
  rows: T[] | undefined,
  company: string,
): T | undefined {
  return (rows ?? []).find((r) => r.company === company);
}

/**
 * Builds the full child-table array to PUT back after editing one company's row — every other
 * company's row is passed through untouched (same array element, same `name`/`idx`), and a blank
 * submitted field keeps the row's existing value rather than clobbering it (same "never clear via
 * this shared helper" convention `fieldsFromFormData` already established for the Company-level
 * Account Determination form). Adds a new row (no `name`, so ERPNext creates it) if this company
 * has none yet.
 */
export function upsertCompanyRow<T extends { company?: string }>(
  rows: T[] | undefined,
  company: string,
  updates: Record<string, unknown>,
): T[] {
  const existing = rows ?? [];
  const changed = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
  const idx = existing.findIndex((r) => r.company === company);

  if (idx === -1) {
    return [...existing, { company, ...changed } as T];
  }
  return existing.map((r, i) => (i === idx ? { ...r, ...changed } : r));
}

/**
 * `FieldSpec[]` for one company's `Item Default` row (Item and Item Group share this exact field
 * list — same underlying child-table doctype, per §1 of the account-determination doc). Reuses
 * `MasterForm`'s existing `kind: "link"` rendering as the standardized Account/Cost Center/
 * Warehouse selector rather than introducing a new selector component. `purchase_expense_account`/
 * `purchase_expense_contra_account` are deliberately excluded — gated by
 * `Accounts Settings.book_stock_expense_gl_entries` (off by default, not mainline), the same
 * exclusion `FIN-1G-C` already applied to the equivalent Company-level pair.
 */
export function itemDefaultFieldSpecs(options: {
  accountOptions: string[];
  costCenterOptions: string[];
  warehouseOptions: string[];
  priceListOptions: string[] | null;
  supplierOptions: string[] | null;
}): FieldSpec[] {
  const account = (id: string, label: string): FieldSpec => ({ kind: "link", id, label, options: options.accountOptions });
  const costCenter = (id: string, label: string): FieldSpec => ({
    kind: "link",
    id,
    label,
    options: options.costCenterOptions,
  });

  return [
    account("income_account", "Default Income Account"),
    account("expense_account", "Default Expense Account"),
    account("default_cogs_account", "Default COGS Account"),
    account("default_inventory_account", "Default Inventory Account"),
    costCenter("buying_cost_center", "Default Buying Cost Center"),
    costCenter("selling_cost_center", "Default Selling Cost Center"),
    account("default_discount_account", "Default Discount Account"),
    account("default_provisional_account", "Default Provisional Account (Service)"),
    account("deferred_revenue_account", "Deferred Revenue Account"),
    account("deferred_expense_account", "Deferred Expense Account"),
    account("expenses_added_to_stock_account", "Expenses Added To Stock Account"),
    account("expenses_added_to_stock_contra_account", "Expenses Added To Stock Contra Account"),
    { kind: "link", id: "default_warehouse", label: "Default Warehouse", options: options.warehouseOptions },
    { kind: "link", id: "default_price_list", label: "Default Price List", options: options.priceListOptions },
    { kind: "link", id: "default_supplier", label: "Default Supplier", options: options.supplierOptions },
  ];
}

/**
 * `FieldSpec[]` for one company's `Party Account` row (Customer, Customer Group, and Supplier
 * all share this exact field list — same underlying child-table doctype, per §1/§6 of the
 * account-determination doc). `receivableLabel` lets the caller say "Receivable Account" vs.
 * "Payable Account" without duplicating the rest of the spec.
 */
export function partyAccountFieldSpecs(options: { accountOptions: string[]; receivableLabel: string }): FieldSpec[] {
  return [
    { kind: "link", id: "account", label: options.receivableLabel, options: options.accountOptions },
    { kind: "link", id: "advance_account", label: "Advance Account", options: options.accountOptions },
  ];
}

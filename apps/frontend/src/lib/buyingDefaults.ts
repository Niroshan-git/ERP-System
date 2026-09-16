import "server-only";
import { getDoc, listDocs } from "@/lib/erpnext";

export type BuyingDefaults = {
  companies: string[];
  company: string;
  currency: string;
  /** A non-group warehouse belonging to the company — same WarehouseRequired reasoning as
   * getSellingDefaults' own defaultWarehouse (see salesDefaults.ts), applied uniformly to
   * every Purchase Order / Purchase Receipt line since this app doesn't expose per-line
   * warehouse picking. */
  defaultWarehouse?: string;
  /**
   * Company's default payable account — Purchase Invoice's required `credit_to`.
   *
   * NOTE — inferred, not independently live-verified this session: the plan's own
   * Purchase Invoice header field list (drawn from the live DocType JSON) doesn't mention
   * `credit_to` at all, but Sales Invoice's already-verified real behavior needed the exact
   * mirror-image field (`debit_to`, resolved here the same way from
   * `Company.default_receivable_account`) to avoid ERPNext rejecting the doc at insert —
   * `credit_to` normally isn't auto-filled over a plain REST createDoc the way Desk's own
   * client-side `get_party_details` would fill it. Treated as necessary plumbing (same
   * category as debit_to/income_account/cost_center — resolved server-side, never exposed
   * on the form), not a guessed *business* field, but flagged here for live verification
   * against the real Company/Purchase Invoice DocType JSON before this is considered done.
   */
  defaultPayableAccount?: string;
  /**
   * Company's default expense account — falls back onto every Purchase Invoice line,
   * mirroring `defaultIncomeAccount` on the Sales side. Same inferred/unverified caveat as
   * `defaultPayableAccount` above — Purchase Receipt/Purchase Order need no such field
   * (neither posts to an expense account the way Purchase Invoice does), so this is only
   * ever read by purchase-invoices/actions.ts.
   */
  defaultExpenseAccount?: string;
  /** Company's default cost center — required on every Purchase Invoice line, same
   * `defaultCostCenter` shape as the Sales side. */
  defaultCostCenter?: string;
};

type CompanyDoc = {
  name: string;
  default_currency: string;
  default_payable_account?: string;
  default_expense_account?: string;
  cost_center?: string;
};

type WarehouseDoc = { name: string };

/**
 * Buying-cycle analog of getSellingDefaults (see salesDefaults.ts) — resolves the same
 * company/currency/accounting defaults for Purchase Order/Purchase Receipt/Purchase
 * Invoice. Same single-currency simplification: conversion_rate is always 1, no exchange-
 * rate lookup, no per-supplier/per-item-group account overrides — just the Company's own
 * defaults. Deliberately has no `buyingPriceList` field — unlike Sales Order/Sales Invoice,
 * the plan's own live-verified Purchase Order/Purchase Invoice header field lists don't
 * include a `buying_price_list` field at all, so this app doesn't resolve or send one.
 */
export async function getBuyingDefaults(companyName?: string): Promise<BuyingDefaults> {
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
    throw new Error("No Company exists in ERPNext yet — create one before raising purchasing documents.");
  }

  const companyDoc = await getDoc<CompanyDoc>("Company", company);

  const warehouses = await listDocs<WarehouseDoc>("Warehouse", {
    fields: ["name"],
    filters: [
      ["company", "=", company],
      ["is_group", "=", 0],
      ["disabled", "=", 0],
    ],
    limit: 20,
  });
  const defaultWarehouse = warehouses.find((w) => w.name.startsWith("Stores"))?.name ?? warehouses[0]?.name;

  return {
    companies: companyNames,
    company,
    currency: companyDoc.default_currency,
    defaultWarehouse,
    defaultPayableAccount: companyDoc.default_payable_account,
    defaultExpenseAccount: companyDoc.default_expense_account,
    defaultCostCenter: companyDoc.cost_center,
  };
}

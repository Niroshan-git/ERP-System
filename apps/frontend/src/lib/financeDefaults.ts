import "server-only";
import { listDocs } from "@/lib/erpnext";

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

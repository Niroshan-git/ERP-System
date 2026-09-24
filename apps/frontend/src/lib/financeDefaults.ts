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

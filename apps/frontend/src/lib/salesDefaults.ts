import "server-only";
import { getDoc, listDocs } from "@/lib/erpnext";

export type SellingDefaults = {
  companies: string[];
  company: string;
  currency: string;
  sellingPriceList: string;
  priceListCurrency: string;
  /** Company's default receivable account — Sales Invoice's required `debit_to`. */
  debitToAccount?: string;
  /** Company's default income account — falls back onto every Sales Invoice line. */
  defaultIncomeAccount?: string;
  /** Company's default cost center — required on every Sales Invoice line. */
  defaultCostCenter?: string;
  /** A non-group warehouse belonging to the company — see the warning below `getSellingDefaults`. */
  defaultWarehouse?: string;
};

type CompanyDoc = {
  name: string;
  default_currency: string;
  default_receivable_account?: string;
  default_income_account?: string;
  cost_center?: string;
};

type PriceListDoc = { name: string; currency: string };

type WarehouseDoc = { name: string };

/**
 * Resolves the same company/currency/price-list/accounting defaults ERPNext's
 * own Desk resolves client-side (frappe.model defaults, Selling Settings,
 * get_party_details) before a new Quotation/Sales Order/Sales Invoice can be
 * saved. Deliberately simplified for a single-currency business (see
 * apps/frontend/README.md): conversion_rate/plc_conversion_rate are always 1,
 * no exchange-rate lookup, no per-customer/per-item-group account overrides —
 * just the Company's own defaults.
 */
export async function getSellingDefaults(companyName?: string): Promise<SellingDefaults> {
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
    throw new Error("No Company exists in ERPNext yet — create one before raising sales documents.");
  }

  const companyDoc = await getDoc<CompanyDoc>("Company", company);

  const priceLists = await listDocs<PriceListDoc>("Price List", {
    fields: ["name", "currency"],
    filters: [
      ["selling", "=", 1],
      ["enabled", "=", 1],
    ],
    limit: 20,
  });
  const sellingPriceList = priceLists.find((p) => p.name === "Standard Selling") ?? priceLists[0];
  if (!sellingPriceList) {
    throw new Error("No enabled Selling Price List exists in ERPNext yet.");
  }

  // ERPNext's Sales Order controller rejects a stock item with no `warehouse` on its
  // line — normally auto-filled from the Item's own per-company default (Item Defaults),
  // but not every item has one configured for every company (confirmed live: it silently
  // worked for "Ceylon Stack" and threw `WarehouseRequired` for "Ceylon Stack (Demo)" on
  // the exact same code path). Resolving a company-level fallback warehouse here, applied
  // to every line uniformly, mirrors the existing income-account/cost-center pattern below.
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
    sellingPriceList: sellingPriceList.name,
    priceListCurrency: sellingPriceList.currency,
    debitToAccount: companyDoc.default_receivable_account,
    defaultIncomeAccount: companyDoc.default_income_account,
    defaultCostCenter: companyDoc.cost_center,
    defaultWarehouse,
  };
}

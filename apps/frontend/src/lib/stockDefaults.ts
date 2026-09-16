import "server-only";
import { listDocs } from "@/lib/erpnext";

export type StockDefaults = {
  companies: string[];
  company: string;
  /** Every non-group (`is_group=0`), non-disabled Warehouse belonging to the resolved
   * company — used to populate Stock Entry's from_warehouse/to_warehouse selects. Unlike
   * getBuyingDefaults'/getSellingDefaults' single `defaultWarehouse`, Stock Entry needs the
   * full list so the user can actually pick source/target warehouses themselves (this is
   * the one module where warehouse choice is the whole point of the document). */
  warehouses: string[];
};

/**
 * Stock-cycle analog of getBuyingDefaults/getSellingDefaults (see buyingDefaults.ts) —
 * simpler than either: no accounting fields needed since Stock Entry doesn't post to a
 * ledger account directly the way Purchase/Sales documents do.
 */
export async function getStockDefaults(companyName?: string): Promise<StockDefaults> {
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
    throw new Error("No Company exists in ERPNext yet — create one before raising stock documents.");
  }

  const warehouses = await listDocs<{ name: string }>("Warehouse", {
    fields: ["name"],
    filters: [
      ["company", "=", company],
      ["is_group", "=", 0],
      ["disabled", "=", 0],
    ],
    limit: 200,
    orderBy: "name asc",
  });

  return {
    companies: companyNames,
    company,
    warehouses: warehouses.map((w) => w.name),
  };
}

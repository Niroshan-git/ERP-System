import { Breadcrumb } from "@/components/Breadcrumb";
import { BomForm } from "@/components/BomForm";
import { getDoc, listDocs } from "@/lib/erpnext";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createBomAction } from "../actions";

/**
 * New BOM. Companies/currency default resolution mirrors getBuyingDefaults' own shape
 * (first company alphabetically, then that company's own default_currency) rather than a
 * bespoke "manufacturing defaults" helper — this is the only page that needs it so far.
 */
export default async function NewBomPage() {
  const [itemOptions, companies, warehouseOptions, operationOptions, workstationOptions, routingOptions, currencyOptions] =
    await Promise.all([
      listItemOptions(),
      listDocs<{ name: string }>("Company", { fields: ["name"], limit: 20, orderBy: "name asc" }),
      fetchLinkOptions("Warehouse"),
      fetchLinkOptions("Operation"),
      fetchLinkOptions("Workstation"),
      fetchLinkOptions("Routing"),
      fetchLinkOptions("Currency"),
    ]);

  const companyNames = companies.map((c) => c.name);
  const firstCompany = companyNames[0];
  const defaultCurrency = firstCompany
    ? (await getDoc<{ default_currency: string }>("Company", firstCompany)).default_currency
    : "";

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Master Data", href: "/master-data" },
          { label: "Bills of Materials", href: "/master-data/boms" },
          { label: "New" },
        ]}
      />
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New BOM</h1>
      <BomForm
        action={createBomAction}
        itemOptions={itemOptions}
        companies={companyNames}
        warehouseOptions={warehouseOptions ?? []}
        operationOptions={operationOptions ?? []}
        workstationOptions={workstationOptions ?? []}
        routingOptions={routingOptions ?? []}
        currencyOptions={currencyOptions ?? [defaultCurrency].filter(Boolean)}
        defaultCurrency={defaultCurrency}
        cancelHref="/master-data/boms"
      />
    </div>
  );
}

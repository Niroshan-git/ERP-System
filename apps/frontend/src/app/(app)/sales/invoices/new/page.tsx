import { SalesInvoiceForm } from "@/components/SalesInvoiceForm";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createSalesInvoiceAction } from "../actions";

export default async function NewSalesInvoicePage() {
  const [defaults, itemOptions, customers] = await Promise.all([
    getSellingDefaults(),
    listItemOptions(),
    fetchLinkOptions("Customer"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New sales invoice</h1>
      <SalesInvoiceForm
        action={createSalesInvoiceAction}
        itemOptions={itemOptions}
        customers={customers}
        companies={defaults.companies}
        currency={defaults.currency}
        sellingPriceList={defaults.sellingPriceList}
        debitToAccount={defaults.debitToAccount}
      />
    </div>
  );
}

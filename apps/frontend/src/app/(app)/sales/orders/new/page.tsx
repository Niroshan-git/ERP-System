import { SalesOrderForm } from "@/components/SalesOrderForm";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createSalesOrderAction } from "../actions";

export default async function NewSalesOrderPage() {
  const [defaults, itemOptions, customers] = await Promise.all([
    getSellingDefaults(),
    listItemOptions(),
    fetchLinkOptions("Customer"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New sales order</h1>
      <SalesOrderForm
        action={createSalesOrderAction}
        itemOptions={itemOptions}
        customers={customers}
        companies={defaults.companies}
        currency={defaults.currency}
        sellingPriceList={defaults.sellingPriceList}
      />
    </div>
  );
}

import { DeliveryNoteForm } from "@/components/DeliveryNoteForm";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createDeliveryNoteAction } from "../actions";

export default async function NewDeliveryNotePage() {
  const [defaults, itemOptions, customers] = await Promise.all([
    getSellingDefaults(),
    listItemOptions(),
    fetchLinkOptions("Customer"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New delivery note</h1>
      <DeliveryNoteForm
        action={createDeliveryNoteAction}
        itemOptions={itemOptions}
        customers={customers}
        companies={defaults.companies}
        currency={defaults.currency}
        sellingPriceList={defaults.sellingPriceList}
        defaultWarehouse={defaults.defaultWarehouse}
        warehouseOptions={defaults.warehouses}
      />
    </div>
  );
}

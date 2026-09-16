import { StockEntryForm } from "@/components/StockEntryForm";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { getStockDefaults } from "@/lib/stockDefaults";
import { createStockEntryAction } from "../actions";

export default async function NewStockEntryPage() {
  const [itemOptions, defaults] = await Promise.all([listItemOptions(), getStockDefaults()]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New stock entry</h1>
      <StockEntryForm
        action={createStockEntryAction}
        itemOptions={itemOptions}
        companies={defaults.companies}
        warehouses={defaults.warehouses}
      />
    </div>
  );
}

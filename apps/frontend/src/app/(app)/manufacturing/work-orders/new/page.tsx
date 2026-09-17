import { WorkOrderForm } from "@/components/WorkOrderForm";
import { listManufacturableItemOptions } from "@/lib/actions/itemLookup";
import { getStockDefaults } from "@/lib/stockDefaults";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createWorkOrderAction } from "../actions";

export default async function NewWorkOrderPage() {
  const [itemOptions, defaults, projectOptions, salesOrderOptions] = await Promise.all([
    listManufacturableItemOptions(),
    getStockDefaults(),
    fetchLinkOptions("Project"),
    fetchLinkOptions("Sales Order"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New Work Order</h1>
      <WorkOrderForm
        action={createWorkOrderAction}
        itemOptions={itemOptions}
        companies={defaults.companies}
        defaultCompany={defaults.company}
        warehouses={defaults.warehouses}
        projectOptions={projectOptions}
        salesOrderOptions={salesOrderOptions}
      />
    </div>
  );
}

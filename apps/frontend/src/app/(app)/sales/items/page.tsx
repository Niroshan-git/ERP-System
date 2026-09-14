import Link from "next/link";
import { listDocs } from "@/lib/erpnext";
import { ItemsTable, type ItemRow } from "@/components/ItemsTable";

export default async function ItemsPage() {
  const items = await listDocs<ItemRow>("Item", {
    fields: [
      "name",
      "item_name",
      "item_group",
      "stock_uom",
      "standard_rate",
      "disabled",
      "is_stock_item",
      "has_batch_no",
      "has_serial_no",
    ],
    limit: 200,
    orderBy: "modified desc",
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Items</h1>
        <Link
          href="/sales/items/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ItemsTable items={items} />
    </div>
  );
}

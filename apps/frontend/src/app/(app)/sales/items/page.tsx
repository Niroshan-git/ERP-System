import Link from "next/link";
import { listDocs } from "@/lib/erpnext";
import { StatusPill } from "@/components/StatusPill";

type ItemRow = {
  name: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
  disabled: 0 | 1;
};

export default async function ItemsPage() {
  const items = await listDocs<ItemRow>("Item", {
    fields: ["name", "item_name", "item_group", "stock_uom", "standard_rate", "disabled"],
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

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              <th className="px-4 py-2.5 font-semibold">Item code</th>
              <th className="px-4 py-2.5 font-semibold">Name</th>
              <th className="px-4 py-2.5 font-semibold">Group</th>
              <th className="px-4 py-2.5 font-semibold">UOM</th>
              <th className="px-4 py-2.5 font-semibold">Rate</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.name} className="border-b border-border last:border-0 hover:bg-canvas/60">
                <td className="px-4 py-2.5">
                  <Link href={`/sales/items/${encodeURIComponent(item.name)}`} className="font-mono text-signal hover:underline">
                    {item.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-graphite-900">{item.item_name}</td>
                <td className="px-4 py-2.5 text-graphite-500">{item.item_group}</td>
                <td className="px-4 py-2.5 text-graphite-500">{item.stock_uom}</td>
                <td className="px-4 py-2.5 font-mono tabular-nums text-graphite-500">
                  {item.standard_rate ? item.standard_rate.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-2.5">
                  {item.disabled ? (
                    <StatusPill label="Disabled" tone="neutral" />
                  ) : (
                    <StatusPill label="Active" tone="success" />
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-graphite-500">
                  No items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

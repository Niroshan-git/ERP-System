export type PickListLocationRow = {
  item_code: string;
  item_name: string;
  warehouse: string;
  qty: number;
  picked_qty: number;
  delivered_qty?: number;
  uom: string;
  sales_order?: string;
};

/** Read-only locations table for a Submitted/Cancelled Pick List — PickListPickedQtyEditor's
 * counterpart, same shape as LineItemsTable but for Pick List Item's own fields (no
 * rate/amount — Pick List is a stock document, not a valued one). */
export function PickListLocationsTable({ locations }: { locations: PickListLocationRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-canvas text-graphite-500">
            <th className="px-3 py-2 font-semibold">Item</th>
            <th className="px-3 py-2 font-semibold">Warehouse</th>
            <th className="px-3 py-2 font-semibold">Qty requested</th>
            <th className="px-3 py-2 font-semibold">Picked qty</th>
            <th className="px-3 py-2 font-semibold">Delivered qty</th>
            <th className="px-3 py-2 font-semibold">UOM</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((row, index) => (
            <tr key={index} className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-graphite-900">
                {row.item_code} — {row.item_name}
                {row.sales_order && <div className="font-mono text-xs text-graphite-500">from {row.sales_order}</div>}
              </td>
              <td className="px-3 py-2 font-mono text-graphite-500">{row.warehouse}</td>
              <td className="px-3 py-2 font-mono tabular-nums">{row.qty}</td>
              <td className="px-3 py-2 font-mono tabular-nums text-graphite-900">{row.picked_qty}</td>
              <td className="px-3 py-2 font-mono tabular-nums text-graphite-500">{row.delivered_qty ?? 0}</td>
              <td className="px-3 py-2 font-mono text-graphite-500">{row.uom}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { formatAmount } from "@/lib/format";

export type LineItemRow = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  /** Delivery-Note-only (SALES-DN-WH-1 / D9 fix) — the line's stock-moving warehouse.
   * Undefined for every other doctype using this table (Quotation/Sales Order/Sales
   * Invoice), which don't move stock; the column below only renders when at least one row
   * actually carries one. */
  warehouse?: string;
};

/** Read-only items table for Submitted/Cancelled document views — LineItemsEditor.tsx's counterpart. */
export function LineItemsTable({ items, currency, isReturn }: { items: LineItemRow[]; currency: string; isReturn?: boolean }) {
  const total = items.reduce((sum, row) => sum + row.amount, 0);
  const showWarehouseColumn = items.some((row) => row.warehouse);
  const columnCount = 4 + (showWarehouseColumn ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-canvas text-graphite-500">
            <th className="px-3 py-2 font-semibold">Item</th>
            <th className="px-3 py-2 text-right font-semibold">Qty</th>
            <th className="px-3 py-2 font-semibold">UOM</th>
            {showWarehouseColumn && <th className="px-3 py-2 font-semibold">Warehouse</th>}
            <th className="px-3 py-2 text-right font-semibold">Rate</th>
            <th className="px-3 py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => (
            <tr key={index} className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-graphite-900">
                {row.item_code} — {row.item_name}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">{isReturn ? Math.abs(row.qty) : row.qty}</td>
              <td className="px-3 py-2 font-mono text-graphite-500">{row.uom}</td>
              {showWarehouseColumn && (
                <td className="px-3 py-2 font-mono text-graphite-500">{row.warehouse || "—"}</td>
              )}
              <td className="px-3 py-2 text-right font-mono tabular-nums">{formatAmount(row.rate)}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-graphite-900">{formatAmount(isReturn ? Math.abs(row.amount) : row.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-canvas">
            <td colSpan={columnCount} className="px-3 py-2 text-right text-sm font-medium text-graphite-900">
              Total
            </td>
            <td className="px-3 py-2 text-right font-mono tabular-nums text-graphite-900">
              {formatAmount(isReturn ? Math.abs(total) : total)} {currency}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

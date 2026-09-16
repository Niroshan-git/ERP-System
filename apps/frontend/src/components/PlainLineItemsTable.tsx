export type PlainLineItemRow = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  /** "Required by" — shown only when provided (Material Request Item's / Request for
   * Quotation Item's own per-line `schedule_date`, confirmed via the live DocType JSON). */
  schedule_date?: string;
  /** Freeform extra label/value pairs shown under the item name — used for things like
   * ordered_qty/received_qty (Material Request) or the source Material Request back-
   * reference (Request for Quotation), which don't warrant their own dedicated column. */
  extra?: { label: string; value: string }[];
};

/**
 * Read-only items table for doctypes that carry no rate/amount at all (Material Request,
 * Request for Quotation — confirmed via their live DocType JSONs neither has a `rate`
 * field, unlike every Sales doctype and Supplier Quotation). LineItemsTable.tsx's shape
 * assumes rate/amount always exist, so it doesn't fit here — this is a real difference in
 * data shape, not a fork of the same table.
 */
export function PlainLineItemsTable({ items }: { items: PlainLineItemRow[] }) {
  const hasScheduleDate = items.some((i) => i.schedule_date);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-canvas text-graphite-500">
            <th className="px-3 py-2 font-semibold">Item</th>
            <th className="px-3 py-2 text-right font-semibold">Qty</th>
            <th className="px-3 py-2 font-semibold">UOM</th>
            {hasScheduleDate && <th className="px-3 py-2 font-semibold">Required by</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => (
            <tr key={index} className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-graphite-900">
                {row.item_code} — {row.item_name}
                {row.extra && row.extra.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-graphite-500">
                    {row.extra.map((e) => (
                      <span key={e.label}>
                        {e.label}: <span className="font-mono">{e.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">{row.qty}</td>
              <td className="px-3 py-2 font-mono text-graphite-500">{row.uom}</td>
              {hasScheduleDate && (
                <td className="px-3 py-2 font-mono text-graphite-500">{row.schedule_date || "—"}</td>
              )}
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={hasScheduleDate ? 4 : 3} className="px-3 py-6 text-center text-graphite-500">
                No items.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

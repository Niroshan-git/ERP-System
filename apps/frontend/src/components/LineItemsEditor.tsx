"use client";

import { useState, useTransition } from "react";
import { getItemLineDefaults, type ItemOption } from "@/lib/actions/itemLookup";

export type LineRow = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  /**
   * Set only when this row was copied from a specific Quotation Item row (via "Copy From
   * Quotation" on the New Sales Order page) and still represents that same line — cleared
   * by onItemChange below the moment the user swaps the item, since a swapped row no
   * longer really came from that Quotation line and must not be submitted as if it did.
   * Both fields are always set or cleared together; source_quotation becomes
   * `prevdoc_docname` on save (see orders/actions.ts's buildSalesOrderFields).
   */
  quotation_item?: string;
  source_quotation?: string;
};

const emptyRow: LineRow = { item_code: "", item_name: "", qty: 1, uom: "", rate: 0 };

/**
 * Editable Item child-table for Quotation/Sales Order/Sales Invoice. Submits
 * as a single hidden JSON field (`fieldName`) — the server action on the
 * other end parses it into ERPNext's `items` child-table rows. The rate
 * shown here is a starting point (Item.standard_rate, see itemLookup.ts) —
 * ERPNext itself is the source of truth for the saved totals, not the
 * running total shown here.
 */
export function LineItemsEditor({
  fieldName,
  itemOptions,
  initialRows,
  currency,
}: {
  fieldName: string;
  itemOptions: ItemOption[];
  initialRows?: LineRow[];
  currency: string;
}) {
  const [rows, setRows] = useState<LineRow[]>(initialRows?.length ? initialRows : [emptyRow]);
  const [isPending, startTransition] = useTransition();

  function updateRow(index: number, patch: Partial<LineRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function onItemChange(index: number, itemCode: string) {
    const option = itemOptions.find((o) => o.code === itemCode);
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        // Swapping the item invalidates any Quotation-line tag this row carried — it no
        // longer represents that source line and must not be sent as if it still did.
        const swapped = Boolean(row.quotation_item) && itemCode !== row.item_code;
        return {
          ...row,
          item_code: itemCode,
          item_name: option?.name ?? "",
          ...(swapped ? { quotation_item: undefined, source_quotation: undefined } : {}),
        };
      }),
    );
    startTransition(async () => {
      const defaults = await getItemLineDefaults(itemCode);
      if (defaults) {
        updateRow(index, { item_name: defaults.item_name, uom: defaults.uom, rate: defaults.rate });
      }
    });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const total = rows.reduce((sum, row) => sum + row.qty * row.rate, 0);

  return (
    <div>
      <input type="hidden" name={fieldName} value={JSON.stringify(rows)} readOnly />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              <th className="px-3 py-2 font-semibold">Item</th>
              <th className="px-3 py-2 font-semibold">Qty</th>
              <th className="px-3 py-2 font-semibold">UOM</th>
              <th className="px-3 py-2 font-semibold">Rate</th>
              <th className="px-3 py-2 font-semibold">Amount</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <select
                    value={row.item_code}
                    onChange={(e) => onItemChange(index, e.target.value)}
                    className="w-full min-w-40 rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  >
                    <option value="">Select…</option>
                    {itemOptions.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.code} — {opt.name}
                      </option>
                    ))}
                  </select>
                  {row.quotation_item && (
                    <p className="mt-1 font-mono text-xs text-graphite-500">
                      linked to {row.source_quotation}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.qty}
                    onChange={(e) => updateRow(index, { qty: Number(e.target.value) || 0 })}
                    className="w-20 rounded-md border border-border px-2 py-1.5 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </td>
                <td className="px-3 py-2 font-mono text-graphite-500">{row.uom || "—"}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.rate}
                    onChange={(e) => updateRow(index, { rate: Number(e.target.value) || 0 })}
                    className="w-28 rounded-md border border-border px-2 py-1.5 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </td>
                <td className="px-3 py-2 font-mono tabular-nums text-graphite-900">
                  {(row.qty * row.rate).toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                    className="text-xs text-alert hover:underline disabled:opacity-30"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={addRow} className="text-sm font-medium text-signal hover:underline">
          + Add row
        </button>
        <p className="font-mono text-sm tabular-nums text-graphite-500">
          Estimated total: {total.toFixed(2)} {currency}
          {isPending && " · loading item…"}
        </p>
      </div>
      <p className="mt-1 text-xs text-graphite-500">
        Rate defaults to the item&apos;s standard selling rate and is editable per line. ERPNext computes the saved
        total (including any taxes) on save — this estimate excludes taxes.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { getItemLineDefaults, type ItemOption } from "@/lib/actions/itemLookup";
import { formatAmount } from "@/lib/format";

export type OpportunityItemRow = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
};

/**
 * Opportunity Item line editor — deliberately not `LineItemsEditor` (Quotation/Sales
 * Order/Sales Invoice's shared editor), which is tightly coupled to batch/serial picking
 * and live Pricing Rule resolution, neither of which applies to a pre-sales product/service
 * interest line (`docs/backend/16-crm/crm-architecture.md` §5.2: `Opportunity Item` has no
 * tax/discount/pricing-rule fields at all — just `item_code`/`item_name`/`qty`/`uom`/`rate`/
 * `amount`, live-verified via `get_doctype_fields`). Items are optional on Opportunity (a
 * services-only SME deal may carry none) — this editor starts empty, not with one blank row.
 *
 * Emits the same hidden-JSON-field convention `LineItemsEditor` uses (`lib/lineRows.ts`'s
 * `parseLineRows` is reused server-side to parse it — its output shape is a superset of
 * what Opportunity Item needs, and extra optional keys this editor never sets are simply
 * absent from the parsed rows).
 */
export function OpportunityItemsEditor({
  fieldName = "items",
  itemOptions,
  initialRows = [],
  currency,
}: {
  fieldName?: string;
  itemOptions: ItemOption[];
  initialRows?: OpportunityItemRow[];
  currency: string;
}) {
  const [rows, setRows] = useState<OpportunityItemRow[]>(initialRows);

  function addRow() {
    setRows((prev) => [...prev, { item_code: "", item_name: "", qty: 1, uom: "", rate: 0 }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<OpportunityItemRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function onItemChange(index: number, itemCode: string) {
    if (!itemCode) {
      updateRow(index, { item_code: "", item_name: "" });
      return;
    }
    updateRow(index, { item_code: itemCode });
    const defaults = await getItemLineDefaults(itemCode);
    if (defaults) {
      updateRow(index, { item_name: defaults.item_name, uom: defaults.uom, rate: defaults.rate });
    }
  }

  const total = rows.reduce((sum, r) => sum + r.qty * r.rate, 0);

  return (
    <div className="space-y-3">
      <input type="hidden" name={fieldName} value={JSON.stringify(rows)} readOnly />

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-graphite-500">
              <tr>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-left">UOM</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-border">
                  <td className="px-3 py-2">
                    <select
                      value={row.item_code}
                      onChange={(e) => onItemChange(index, e.target.value)}
                      className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                    >
                      <option value="">Select item…</option>
                      {itemOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={row.qty}
                      onChange={(e) => updateRow(index, { qty: Number(e.target.value) || 0 })}
                      className="w-20 rounded-md border border-border bg-surface px-2 py-1.5 text-right text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.uom}
                      onChange={(e) => updateRow(index, { uom: e.target.value })}
                      className="w-20 rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={row.rate}
                      onChange={(e) => updateRow(index, { rate: Number(e.target.value) || 0 })}
                      className="w-24 rounded-md border border-border bg-surface px-2 py-1.5 text-right text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-graphite-900">{formatAmount(row.qty * row.rate)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-xs font-medium text-alert hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-medium">
                <td colSpan={4} className="px-3 py-2 text-right text-graphite-500">
                  Total
                </td>
                <td className="px-3 py-2 text-right text-graphite-900">
                  {formatAmount(total)} {currency}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-graphite-900 hover:bg-surface"
      >
        + Add item
      </button>
    </div>
  );
}

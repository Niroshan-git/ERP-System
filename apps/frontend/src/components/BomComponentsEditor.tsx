"use client";

import { useState, useTransition } from "react";
import { getItemLineDefaults, type ItemOption } from "@/lib/actions/itemLookup";
import { listBomsForItem } from "@/lib/actions/bomLookup";
import { formatAmount } from "@/lib/format";

export type BomComponentRow = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  source_warehouse?: string;
  operation?: string;
  bom_no?: string;
  allow_alternative_item?: boolean;
  /** Nested-BOM options for this row's own item — populated lazily the moment an item with
   * at least one active/submitted BOM of its own is picked, so the row can offer "use as
   * sub-assembly" without the user needing to know the nested BOM's name by heart. Reuses
   * `listBomsForItem` byte-for-byte (WorkOrderForm.tsx's own BOM-by-item lookup) rather than
   * a second, parallel implementation. */
  nestedBomOptions?: string[];
};

const emptyRow: BomComponentRow = { item_code: "", item_name: "", qty: 1, uom: "", rate: 0 };

/**
 * Editable `BOM Item` child-table — same hidden-JSON-field submission technique as
 * LineItemsEditor.tsx (that component isn't reused directly: its row shape and behavior are
 * Sales/Buying-specific — batch/serial picking, Pricing Rule resolution, per-line schedule
 * dates — none of which apply to a BOM component, which instead needs Source Warehouse,
 * Operation (only meaningful `with_operations`), and a nested-BOM pointer that
 * LineItemsEditor has no concept of at all).
 */
export function BomComponentsEditor({
  fieldName = "components",
  itemOptions,
  warehouseOptions,
  operationOptions,
  initialRows,
  currency,
  withOperations,
}: {
  fieldName?: string;
  itemOptions: ItemOption[];
  warehouseOptions: string[];
  /** `BOM Item.operation` is a plain Link -> Operation (confirmed via `get_doctype_fields`)
   * — not restricted to operations already added to the sibling BomOperationsEditor's rows
   * in the same document — so this offers the same global Operation master list that editor
   * itself selects from, not a cross-editor-derived subset. */
  operationOptions: string[];
  initialRows?: BomComponentRow[];
  currency: string;
  withOperations: boolean;
}) {
  const [rows, setRows] = useState<BomComponentRow[]>(initialRows?.length ? initialRows : [emptyRow]);
  const [, startTransition] = useTransition();

  function updateRow(index: number, patch: Partial<BomComponentRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function onItemChange(index: number, itemCode: string) {
    updateRow(index, { item_code: itemCode, item_name: "", bom_no: undefined, nestedBomOptions: undefined });
    if (!itemCode) return;
    startTransition(async () => {
      const [defaults, boms] = await Promise.all([getItemLineDefaults(itemCode), listBomsForItem(itemCode)]);
      if (defaults) {
        updateRow(index, { item_name: defaults.item_name, uom: defaults.uom, rate: defaults.rate });
      }
      if (boms.length > 0) {
        updateRow(index, { nestedBomOptions: boms.map((b) => b.name) });
      }
    });
  }

  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const total = rows.reduce((sum, row) => sum + row.qty * row.rate, 0);

  return (
    <div>
      <input
        type="hidden"
        name={fieldName}
        value={JSON.stringify(
          rows.map((r) => ({
            item_code: r.item_code,
            item_name: r.item_name,
            qty: r.qty,
            uom: r.uom,
            rate: r.rate,
            source_warehouse: r.source_warehouse,
            operation: r.operation,
            bom_no: r.bom_no,
            allow_alternative_item: r.allow_alternative_item,
          })),
        )}
        readOnly
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              <th className="px-3 py-2 font-semibold">Item</th>
              <th className="px-3 py-2 text-right font-semibold">Qty</th>
              <th className="px-3 py-2 font-semibold">UOM</th>
              <th className="px-3 py-2 text-right font-semibold">Rate</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
              <th className="px-3 py-2 font-semibold">Source Warehouse</th>
              {withOperations && <th className="px-3 py-2 font-semibold">Operation</th>}
              <th className="px-3 py-2 font-semibold">Nested BOM</th>
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
                  <label className="mt-1 flex items-center gap-1.5 text-xs text-graphite-500">
                    <input
                      type="checkbox"
                      checked={Boolean(row.allow_alternative_item)}
                      onChange={(e) => updateRow(index, { allow_alternative_item: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-border"
                    />
                    Allow alternative item
                  </label>
                </td>
                <td className="px-3 py-2 text-right">
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
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.rate}
                    onChange={(e) => updateRow(index, { rate: Number(e.target.value) || 0 })}
                    className="w-28 rounded-md border border-border px-2 py-1.5 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-graphite-900">
                  {formatAmount(row.qty * row.rate)}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.source_warehouse ?? ""}
                    onChange={(e) => updateRow(index, { source_warehouse: e.target.value || undefined })}
                    className="w-full min-w-36 rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  >
                    <option value="">—</option>
                    {warehouseOptions.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </td>
                {withOperations && (
                  <td className="px-3 py-2">
                    <select
                      value={row.operation ?? ""}
                      onChange={(e) => updateRow(index, { operation: e.target.value || undefined })}
                      className="w-full min-w-32 rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                    >
                      <option value="">—</option>
                      {operationOptions.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
                <td className="px-3 py-2">
                  {row.nestedBomOptions?.length ? (
                    <select
                      value={row.bom_no ?? ""}
                      onChange={(e) => updateRow(index, { bom_no: e.target.value || undefined })}
                      className="w-full min-w-36 rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                    >
                      <option value="">Not a sub-assembly</option>
                      {row.nestedBomOptions.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-graphite-500">—</span>
                  )}
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
          Estimated raw material cost: {formatAmount(total)} {currency}
        </p>
      </div>
      <p className="mt-1 text-xs text-graphite-500">
        Rate defaults to the item&apos;s standard rate and is editable per line. ERPNext computes
        the saved Raw Material Cost/Total Cost on save — this estimate is not the authoritative
        figure. &ldquo;Nested BOM&rdquo; only offers a component item&apos;s own existing active,
        submitted BOM(s) — this app never creates a nested BOM implicitly.
      </p>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { getItemLineDefaults, type ItemOption } from "@/lib/actions/itemLookup";
import { BatchSerialPicker, type BatchSerialEntry } from "@/components/BatchSerialPicker";
import { StockBadge } from "@/components/StockBadge";

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
  /**
   * Delivery-Note-only fields (Phase 2C/2D) — populated only when `defaultWarehouse` is
   * passed in below (i.e. only by DeliveryNoteForm; Quotation/Sales Order/Sales Invoice
   * never move stock so never set these). `warehouse` mirrors the uniform per-document
   * default this app applies server-side (see salesDefaults.ts); `has_batch_no`/
   * `has_serial_no` come from the resolved Item's own master flags; `batchSerialEntries`
   * is the confirmed BatchSerialPicker selection for this line, attached via the two-step
   * add_serial_batch_ledgers flow after the document itself is created — never sent as
   * part of the initial createDoc payload.
   */
  warehouse?: string;
  has_batch_no?: boolean;
  has_serial_no?: boolean;
  batchSerialEntries?: BatchSerialEntry[];
};

const emptyRow: LineRow = { item_code: "", item_name: "", qty: 1, uom: "", rate: 0 };

function batchSerialTotal(row: LineRow): number {
  return (row.batchSerialEntries ?? []).reduce((s, e) => s + (e.qty || 0), 0);
}

/**
 * Editable Item child-table for Quotation/Sales Order/Sales Invoice/Delivery Note. Submits
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
  defaultWarehouse,
}: {
  fieldName: string;
  itemOptions: ItemOption[];
  initialRows?: LineRow[];
  currency: string;
  /**
   * Set only by DeliveryNoteForm — the company's default warehouse, applied to every line
   * automatically (this app doesn't expose per-line warehouse picking, see the
   * WarehouseRequired note in salesDefaults.ts). Its presence is also what turns on the
   * batch/serial picker button and the live Bin stock badge below (Phase 2C/2D) — Delivery
   * Note is the only doctype in this app that actually moves stock.
   */
  defaultWarehouse?: string;
}) {
  const [rows, setRows] = useState<LineRow[]>(() => {
    const base = initialRows?.length ? initialRows : [emptyRow];
    return defaultWarehouse ? base.map((r) => ({ ...r, warehouse: r.warehouse ?? defaultWarehouse })) : base;
  });
  const [isPending, startTransition] = useTransition();
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  function updateRow(index: number, patch: Partial<LineRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function onItemChange(index: number, itemCode: string) {
    const option = itemOptions.find((o) => o.code === itemCode);
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const itemSwapped = itemCode !== row.item_code;
        // Swapping the item invalidates any Quotation-line tag this row carried — it no
        // longer represents that source line and must not be sent as if it still did.
        const swapped = Boolean(row.quotation_item) && itemSwapped;
        return {
          ...row,
          item_code: itemCode,
          item_name: option?.name ?? "",
          ...(swapped ? { quotation_item: undefined, source_quotation: undefined } : {}),
          // A swapped item is a different item master — its batch/serial flags and any
          // already-picked batch/serial selection no longer apply.
          ...(itemSwapped ? { has_batch_no: undefined, has_serial_no: undefined, batchSerialEntries: undefined } : {}),
        };
      }),
    );
    startTransition(async () => {
      const defaults = await getItemLineDefaults(itemCode);
      if (defaults) {
        updateRow(index, {
          item_name: defaults.item_name,
          uom: defaults.uom,
          rate: defaults.rate,
          has_batch_no: defaults.has_batch_no,
          has_serial_no: defaults.has_serial_no,
        });
      }
    });
  }

  function addRow() {
    setRows((prev) => [...prev, defaultWarehouse ? { ...emptyRow, warehouse: defaultWarehouse } : emptyRow]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const total = rows.reduce((sum, row) => sum + row.qty * row.rate, 0);
  const activePicker = pickerIndex !== null ? rows[pickerIndex] : undefined;

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
                  {defaultWarehouse && (row.has_batch_no || row.has_serial_no) && row.warehouse && (
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => setPickerIndex(index)}
                        disabled={row.qty <= 0}
                        className="text-xs font-medium text-signal hover:underline disabled:opacity-40"
                      >
                        {row.batchSerialEntries?.length ? "Edit batch/serial selection" : "Select batch/serial"}
                      </button>
                      {row.batchSerialEntries?.length ? (
                        <p className="mt-0.5 text-xs text-graphite-500">
                          {row.has_batch_no
                            ? `${row.batchSerialEntries.length} batch${row.batchSerialEntries.length > 1 ? "es" : ""} selected (${batchSerialTotal(row)} of ${row.qty})`
                            : `${row.batchSerialEntries.length} of ${row.qty} serials selected`}
                        </p>
                      ) : (
                        row.qty > 0 && <p className="mt-0.5 text-xs text-alert">Batch/serial not yet selected</p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.qty}
                    onChange={(e) => {
                      const qty = Number(e.target.value) || 0;
                      // A changed qty invalidates any already-confirmed batch/serial
                      // selection — its total no longer matches, so force a re-pick rather
                      // than silently submitting a stale, now-wrong allocation.
                      updateRow(index, { qty, ...(row.batchSerialEntries ? { batchSerialEntries: undefined } : {}) });
                    }}
                    className="w-20 rounded-md border border-border px-2 py-1.5 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                  {defaultWarehouse && (
                    <div className="mt-1">
                      <StockBadge itemCode={row.item_code} warehouse={row.warehouse} requestedQty={batchSerialTotal(row) || row.qty} />
                    </div>
                  )}
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

      {activePicker && pickerIndex !== null && (
        <BatchSerialPicker
          open
          onClose={() => setPickerIndex(null)}
          onConfirm={(entries) => updateRow(pickerIndex, { batchSerialEntries: entries })}
          itemCode={activePicker.item_code}
          itemName={activePicker.item_name}
          warehouse={activePicker.warehouse ?? ""}
          qty={activePicker.qty}
          hasBatchNo={Boolean(activePicker.has_batch_no)}
          hasSerialNo={Boolean(activePicker.has_serial_no)}
          initialEntries={activePicker.batchSerialEntries}
        />
      )}
    </div>
  );
}

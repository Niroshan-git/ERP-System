"use client";

import { useState } from "react";
import { formatAmount } from "@/lib/format";

export type BomOperationRow = {
  operation: string;
  workstation?: string;
  time_in_mins: number;
  batch_size?: number;
  hour_rate?: number;
  description?: string;
};

const emptyRow: BomOperationRow = { operation: "", time_in_mins: 0 };

/**
 * Editable `BOM Operation` child-table, shown only when the header's "With Operations" is
 * checked. Operation/Workstation are plain `<select>`s over `fetchLinkOptions("Operation"
 * | "Workstation")` — real ERPNext masters, reused as link-option dropdowns per this
 * package's own scope boundary (no independent Operation/Workstation master-management
 * screens are built here). `hour_rate` is the BOM's own transaction-currency rate (see
 * lib/bomRows.ts's parseBomOperationRows doc comment).
 */
export function BomOperationsEditor({
  fieldName = "operations",
  operationOptions,
  workstationOptions,
  initialRows,
  currency,
}: {
  fieldName?: string;
  operationOptions: string[];
  workstationOptions: string[];
  initialRows?: BomOperationRow[];
  currency: string;
}) {
  const [rows, setRows] = useState<BomOperationRow[]>(initialRows?.length ? initialRows : [emptyRow]);

  function updateRow(index: number, patch: Partial<BomOperationRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const totalCost = rows.reduce((sum, row) => sum + ((row.time_in_mins || 0) / 60) * (row.hour_rate || 0), 0);

  return (
    <div>
      <input type="hidden" name={fieldName} value={JSON.stringify(rows)} readOnly />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              <th className="px-3 py-2 font-semibold">Operation</th>
              <th className="px-3 py-2 font-semibold">Workstation</th>
              <th className="px-3 py-2 text-right font-semibold">Time (mins)</th>
              <th className="px-3 py-2 text-right font-semibold">Batch Size</th>
              <th className="px-3 py-2 text-right font-semibold">Hourly Rate</th>
              <th className="px-3 py-2 font-semibold">Description</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <select
                    value={row.operation}
                    onChange={(e) => updateRow(index, { operation: e.target.value })}
                    className="w-full min-w-32 rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  >
                    <option value="">Select…</option>
                    {operationOptions.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.workstation ?? ""}
                    onChange={(e) => updateRow(index, { workstation: e.target.value || undefined })}
                    className="w-full min-w-32 rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  >
                    <option value="">—</option>
                    {workstationOptions.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.time_in_mins}
                    onChange={(e) => updateRow(index, { time_in_mins: Number(e.target.value) || 0 })}
                    className="w-24 rounded-md border border-border px-2 py-1.5 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.batch_size ?? ""}
                    onChange={(e) => updateRow(index, { batch_size: Number(e.target.value) || undefined })}
                    className="w-20 rounded-md border border-border px-2 py-1.5 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.hour_rate ?? ""}
                    onChange={(e) => updateRow(index, { hour_rate: Number(e.target.value) || undefined })}
                    className="w-24 rounded-md border border-border px-2 py-1.5 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.description ?? ""}
                    onChange={(e) => updateRow(index, { description: e.target.value || undefined })}
                    className="w-full min-w-32 rounded-md border border-border px-2 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
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
          Estimated operating cost: {formatAmount(totalCost)} {currency}
        </p>
      </div>
      <p className="mt-1 text-xs text-graphite-500">
        Operation and Workstation are existing ERPNext masters — this app does not manage them
        directly. ERPNext computes the saved Operating Cost/Total Cost on save; this estimate is
        not the authoritative figure.
      </p>
    </div>
  );
}

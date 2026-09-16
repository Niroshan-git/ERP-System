"use client";

import { useEffect, useState, useTransition } from "react";
import { getAutoBatchSerialData, type AutoBatchRow, type AutoSerialRow } from "@/lib/actions/batchSerialLookup";

export type BatchSerialEntry = { batch_no?: string; serial_no?: string; qty: number };

/**
 * Full multi-batch/serial picker for one Delivery Note line — the SAP B1-style "Batch/
 * Serial Selection" window, built on ERPNext's own real `get_auto_data` (FIFO auto-suggest)
 * rather than the simpler `use_serial_batch_fields` shortcut (see the Phase 2 plan's Design
 * Decisions for why). One line can legitimately span several batches or many serials.
 *
 * On open, requests a generously larger qty than the line actually needs (browseQty) so the
 * same FIFO-ordered response doubles as both "what's available to browse" and the source for
 * a pre-filled FIFO default selection — not a second, separate typeahead against raw
 * Batch/Serial No records. The user can then add/remove batch rows (editable qty each) or
 * check/uncheck individual serials; Confirm is only enabled once the total exactly equals
 * the line's qty.
 */
export function BatchSerialPicker({
  open,
  onClose,
  onConfirm,
  itemCode,
  itemName,
  warehouse,
  qty,
  hasBatchNo,
  hasSerialNo,
  initialEntries,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (entries: BatchSerialEntry[]) => void;
  itemCode: string;
  itemName: string;
  warehouse: string;
  qty: number;
  hasBatchNo: boolean;
  hasSerialNo: boolean;
  initialEntries?: BatchSerialEntry[];
}) {
  const [loading, startLoading] = useTransition();
  const [availableBatches, setAvailableBatches] = useState<AutoBatchRow[]>([]);
  const [availableSerials, setAvailableSerials] = useState<AutoSerialRow[]>([]);
  const [batchQtys, setBatchQtys] = useState<Record<string, number>>({});
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || qty <= 0 || !itemCode || !warehouse) return;
    const browseQty = Math.max(qty * 3, qty + 50);

    startLoading(async () => {
      setError(null);
      setLoadError(null);
      try {
        if (hasBatchNo) {
          const rows = (await getAutoBatchSerialData({
            item_code: itemCode,
            warehouse,
            qty: browseQty,
            has_batch_no: true,
            has_serial_no: false,
          })) as AutoBatchRow[];
          setAvailableBatches(rows);

          if (initialEntries?.some((e) => e.batch_no)) {
            setBatchQtys(Object.fromEntries(initialEntries.filter((e) => e.batch_no).map((e) => [e.batch_no as string, e.qty])));
          } else {
            // FIFO pre-fill: walk the already-FIFO-ordered rows, taking just enough of each
            // to cover the line's qty.
            const prefill: Record<string, number> = {};
            let remaining = qty;
            for (const row of rows) {
              if (remaining <= 0) break;
              const take = Math.min(row.qty, remaining);
              if (take > 0) prefill[row.batch_no] = take;
              remaining -= take;
            }
            setBatchQtys(prefill);
          }
        } else if (hasSerialNo) {
          const rows = (await getAutoBatchSerialData({
            item_code: itemCode,
            warehouse,
            qty: browseQty,
            has_batch_no: false,
            has_serial_no: true,
          })) as AutoSerialRow[];
          setAvailableSerials(rows);

          const prefill = initialEntries?.some((e) => e.serial_no)
            ? new Set(initialEntries.filter((e) => e.serial_no).map((e) => e.serial_no as string))
            : new Set(rows.slice(0, qty).map((r) => r.serial_no));
          setSelectedSerials(prefill);
        }
      } catch {
        setLoadError("Could not load available batches/serials from ERPNext — try again.");
      }
    });
    // initialEntries intentionally excluded — only meant to seed the very first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemCode, warehouse, qty, hasBatchNo, hasSerialNo]);

  if (!open) return null;

  const batchTotal = Object.values(batchQtys).reduce((s, v) => s + (v || 0), 0);
  const serialTotal = selectedSerials.size;
  const total = hasBatchNo ? batchTotal : serialTotal;
  const valid = Math.abs(total - qty) < 1e-6;

  function updateBatchQty(batchNo: string, value: number, max: number) {
    const clamped = Math.min(Math.max(value, 0), max);
    setBatchQtys((prev) => ({ ...prev, [batchNo]: clamped }));
  }

  function addBatchRow(batchNo: string, max: number) {
    setBatchQtys((prev) => (batchNo in prev ? prev : { ...prev, [batchNo]: Math.min(Math.max(qty - batchTotal, 0), max) }));
  }

  function removeBatchRow(batchNo: string) {
    setBatchQtys((prev) => {
      const next = { ...prev };
      delete next[batchNo];
      return next;
    });
  }

  function toggleSerial(serialNo: string) {
    setSelectedSerials((prev) => {
      const next = new Set(prev);
      if (next.has(serialNo)) next.delete(serialNo);
      else next.add(serialNo);
      return next;
    });
  }

  function confirm() {
    if (!valid) {
      setError(
        hasBatchNo
          ? `Selected batch quantity (${batchTotal}) must equal the line quantity (${qty}).`
          : `Selected serial numbers (${serialTotal}) must equal the line quantity (${qty}).`,
      );
      return;
    }
    const entries: BatchSerialEntry[] = hasBatchNo
      ? Object.entries(batchQtys)
          .filter(([, v]) => v > 0)
          .map(([batch_no, v]) => ({ batch_no, qty: v }))
      : Array.from(selectedSerials).map((serial_no) => ({ serial_no, qty: 1 }));
    onConfirm(entries);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-4 shadow-lg">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-graphite-900">
              {hasBatchNo ? "Select batches" : "Select serial numbers"} — {itemCode}
            </p>
            <p className="text-xs text-graphite-500">
              {itemName} · warehouse <span className="font-mono">{warehouse}</span> · need{" "}
              <span className="font-mono">{qty}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-sm text-graphite-500 hover:underline">
            Close
          </button>
        </div>

        {loading && <p className="text-sm text-graphite-500">Loading available {hasBatchNo ? "batches" : "serial numbers"}…</p>}
        {loadError && <p className="text-sm text-alert">{loadError}</p>}

        {!loading && !loadError && hasBatchNo && (
          <div className="space-y-2">
            {availableBatches.length === 0 && (
              <p className="text-sm text-alert">No available batches found for this item in this warehouse.</p>
            )}
            {availableBatches.length > 0 && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-graphite-500">
                    <th className="py-1 font-semibold">Batch</th>
                    <th className="py-1 text-right font-semibold">Available</th>
                    <th className="py-1 font-semibold">Expiry</th>
                    <th className="py-1 text-right font-semibold">Take</th>
                    <th className="py-1" />
                  </tr>
                </thead>
                <tbody>
                  {availableBatches.map((row) => {
                    const selected = row.batch_no in batchQtys;
                    return (
                      <tr key={row.batch_no} className="border-b border-border last:border-0">
                        <td className="py-1.5 font-mono">{row.batch_no}</td>
                        <td className="py-1.5 text-right font-mono tabular-nums text-graphite-500">{row.qty}</td>
                        <td className="py-1.5 font-mono text-xs text-graphite-500">{row.expiry_date ?? "—"}</td>
                        <td className="py-1.5 text-right">
                          {selected ? (
                            <input
                              type="number"
                              min="0"
                              max={row.qty}
                              step="any"
                              value={batchQtys[row.batch_no]}
                              onChange={(e) => updateBatchQty(row.batch_no, Number(e.target.value) || 0, row.qty)}
                              className="w-20 rounded-md border border-border px-2 py-1 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => addBatchRow(row.batch_no, row.qty)}
                              className="text-xs font-medium text-signal hover:underline"
                            >
                              + Add
                            </button>
                          )}
                        </td>
                        <td className="py-1.5">
                          {selected && (
                            <button type="button" onClick={() => removeBatchRow(row.batch_no)} className="text-xs text-alert hover:underline">
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!loading && !loadError && hasSerialNo && (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {availableSerials.length === 0 && (
              <p className="text-sm text-alert">No available serial numbers found for this item in this warehouse.</p>
            )}
            {availableSerials.map((row) => (
              <label key={row.serial_no} className="flex items-center gap-2 border-b border-border py-1 text-sm last:border-0">
                <input type="checkbox" checked={selectedSerials.has(row.serial_no)} onChange={() => toggleSerial(row.serial_no)} />
                <span className="font-mono">{row.serial_no}</span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <p className={`font-mono text-sm tabular-nums ${valid ? "text-graphite-500" : "text-alert"}`}>
            Selected: {total} / {qty}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={loading || Boolean(loadError)}
              className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
            >
              Confirm
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-alert">{error}</p>}
      </div>
    </div>
  );
}

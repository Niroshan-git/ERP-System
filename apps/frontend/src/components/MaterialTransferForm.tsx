"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import { StockBadge } from "@/components/StockBadge";
import { getItemLineDefaults, type ItemOption } from "@/lib/actions/itemLookup";
import type { TransferMaterialRow } from "@/lib/actions/workOrderTransfer";

export type TransferFormState = { error?: string } | undefined;

export type RequiredMaterialRow = TransferMaterialRow & {
  required_qty: number;
  requiresBatchOrSerial: boolean;
};

type AdditionalRow = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  s_warehouse: string;
  reason: string;
};

const inputClass =
  "w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm font-mono focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";
const selectClass =
  "w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";
const cell = "px-3 py-2";

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Review-and-submit screen for Material Transfer for Manufacture. Required-material rows
 * come pre-filled from ERPNext's own `make_stock_entry` (see workOrderTransfer.ts) — this
 * component only lets the user narrow the "Transfer Now" qty (partial transfer, capped at
 * what ERPNext itself proposed) and change the source warehouse per row; it never invents
 * its own outstanding-qty math. "+ Add Material" appends a Work-Order-specific extra line —
 * visually tagged ADDITIONAL, never merged into the required-materials table as if it were
 * BOM-standard. ERPNext's own submit-time validation remains the final authority throughout
 * (see this component's error rendering — ERPNext's real message is always shown verbatim).
 */
export function MaterialTransferForm({
  workOrder,
  rows,
  itemOptions,
  warehouses,
  saveDraftAction,
  submitAction,
}: {
  // Display-only — company/bom_no/use_multi_level_bom/fg_completed_qty aren't sent from here
  // any more; actions.ts re-derives them server-side from a fresh make_stock_entry call keyed
  // off the route's own Work Order (see actions.ts's buildStockEntryFields doc comment).
  workOrder: {
    name: string;
    production_item: string;
    item_name?: string;
    qty: number;
    bom_no: string;
    wip_warehouse: string;
  };
  rows: RequiredMaterialRow[];
  itemOptions: ItemOption[];
  warehouses: string[];
  saveDraftAction: (state: TransferFormState, formData: FormData) => Promise<TransferFormState>;
  submitAction: (state: TransferFormState, formData: FormData) => Promise<TransferFormState>;
}) {
  const [draftState, draftFormAction, isDraftPending] = useActionState<TransferFormState, FormData>(
    saveDraftAction,
    undefined,
  );
  const [submitState, submitFormAction, isSubmitPending] = useActionState<TransferFormState, FormData>(
    submitAction,
    undefined,
  );

  // Keyed by row index, not item_code — Work Order Item duplicates (two required_items rows
  // sharing an item_code) are a live-confirmed real possibility (see PROGRESS.md's Package 4
  // investigation, item substitution leaving a duplicate row). Keying this state by item_code
  // would silently collapse both rows onto one entry, losing one row's qty/warehouse the
  // moment either was edited (governance-closure code-review finding, CX-MFG-006).
  const [qtyByIndex, setQtyByIndex] = useState<Record<number, number>>(() =>
    Object.fromEntries(rows.map((r, i) => [i, r.qty])),
  );
  const [warehouseByIndex, setWarehouseByIndex] = useState<Record<number, string>>(() =>
    Object.fromEntries(rows.map((r, i) => [i, r.s_warehouse ?? ""])),
  );

  const [additionalRows, setAdditionalRows] = useState<AdditionalRow[]>([]);
  const [newItemCode, setNewItemCode] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newWarehouse, setNewWarehouse] = useState("");
  const [newReason, setNewReason] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isLookupPending, startLookupTransition] = useTransition();

  function addMaterial() {
    setAddError(null);
    if (!newItemCode) {
      setAddError("Pick an item first.");
      return;
    }
    if (!newWarehouse) {
      setAddError("Pick a source warehouse.");
      return;
    }
    if (newQty <= 0) {
      setAddError("Quantity must be greater than zero.");
      return;
    }
    if (rows.some((r) => r.item_code === newItemCode) || additionalRows.some((r) => r.item_code === newItemCode)) {
      setAddError("This item is already on the transfer.");
      return;
    }
    startLookupTransition(async () => {
      const defaults = await getItemLineDefaults(newItemCode);
      if (!defaults) {
        setAddError("Could not look up this item.");
        return;
      }
      if (defaults.has_batch_no || defaults.has_serial_no) {
        setAddError(
          `${newItemCode} requires ${defaults.has_batch_no ? "batch" : "serial"} allocation — not supported in this transfer screen yet.`,
        );
        return;
      }
      setAdditionalRows((prev) => [
        ...prev,
        {
          item_code: newItemCode,
          item_name: defaults.item_name,
          qty: newQty,
          uom: defaults.uom,
          stock_uom: defaults.uom,
          conversion_factor: 1,
          s_warehouse: newWarehouse,
          reason: newReason.trim(),
        },
      ]);
      setNewItemCode("");
      setNewQty(1);
      setNewReason("");
    });
  }

  function removeAdditional(itemCode: string) {
    setAdditionalRows((prev) => prev.filter((r) => r.item_code !== itemCode));
  }

  // A row with qty > 0 but no source warehouse selected would otherwise be silently dropped
  // from the submitted payload (parseTransferRows on the server filters it out too) — flagged
  // here instead so the user sees why a quantity they set isn't being transferred, rather than
  // it vanishing without explanation.
  const missingWarehouseRows = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r, i }) => !r.requiresBatchOrSerial && (qtyByIndex[i] ?? 0) > 0 && !(warehouseByIndex[i] || ""))
    .map(({ r }) => r);

  // Only item_code/qty/s_warehouse — the user's actual choices. item_name/uom/stock_uom/
  // conversion_factor, company, bom_no, and to_warehouse are no longer sent: actions.ts now
  // re-derives all of that server-side from a fresh make_stock_entry / Item lookup keyed off
  // the route's own Work Order, rather than trusting a client-round-tripped copy of ERPNext's
  // own computed values (governance-closure code-review finding).
  const requiredForSubmit = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r, i }) => !r.requiresBatchOrSerial && (qtyByIndex[i] ?? 0) > 0 && warehouseByIndex[i])
    .map(({ r, i }) => ({
      item_code: r.item_code,
      qty: round4(qtyByIndex[i] ?? 0),
      s_warehouse: warehouseByIndex[i] ?? "",
    }));

  const additionalForSubmit = additionalRows.map((r) => ({
    item_code: r.item_code,
    qty: round4(r.qty),
    s_warehouse: r.s_warehouse,
  }));

  const itemsJson = useMemo(
    () => JSON.stringify([...requiredForSubmit, ...additionalForSubmit]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qtyByIndex, warehouseByIndex, additionalRows],
  );

  const remarks = useMemo(() => {
    const withReason = additionalRows.filter((r) => r.reason);
    if (withReason.length === 0) return "";
    return withReason.map((r) => `Additional material ${r.item_code} (${r.qty} ${r.uom}): ${r.reason}`).join(" | ");
  }, [additionalRows]);

  const sourceWarehouses = new Set(requiredForSubmit.map((r) => r.s_warehouse).filter(Boolean));
  const fromSummary = sourceWarehouses.size === 1 ? [...sourceWarehouses][0] : sourceWarehouses.size === 0 ? "—" : "Multiple warehouses";

  const totalRowCount = requiredForSubmit.length + additionalForSubmit.length;
  const today = new Date().toISOString().slice(0, 10);

  // Plain JSX elements (not a nested component function — react-hooks/static-components
  // flags a component declared inside render, since it'd remount and lose state every
  // render). Rendered into both forms below so Save Draft / Submit Transfer each post the
  // same payload without duplicating the field list by hand.
  const hiddenFields = (
    <>
      <input type="hidden" name="posting_date" value={today} />
      <input type="hidden" name="remarks" value={remarks} />
      <input type="hidden" name="items" value={itemsJson} />
    </>
  );

  return (
    <div className="max-w-5xl space-y-6">
      <div className="rounded-xl border border-border bg-surface p-4">
        <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="text-graphite-500">Production Item</dt>
            <dd className="text-graphite-900">{workOrder.item_name || workOrder.production_item}</dd>
          </div>
          <div>
            <dt className="text-graphite-500">Production Qty</dt>
            <dd className="font-mono text-graphite-900">{workOrder.qty}</dd>
          </div>
          <div>
            <dt className="text-graphite-500">BOM</dt>
            <dd className="font-mono text-graphite-900">{workOrder.bom_no || "—"}</dd>
          </div>
          <div>
            <dt className="text-graphite-500">WIP Warehouse</dt>
            <dd className="text-graphite-900">{workOrder.wip_warehouse || "—"}</dd>
          </div>
        </dl>
        {!workOrder.wip_warehouse && (
          <p className="mt-2 text-xs text-alert">
            No WIP warehouse resolved for this Work Order — ERPNext will reject a transfer without one.
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-graphite-900">Material Requirement</p>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-canvas text-graphite-500">
                <th className={`${cell} font-semibold`}>Item</th>
                <th className={`${cell} text-right font-semibold`}>Required</th>
                <th className={`${cell} text-right font-semibold`}>Transferred</th>
                <th className={`${cell} text-right font-semibold`}>Remaining</th>
                <th className={`${cell} font-semibold`}>Source Warehouse</th>
                <th className={`${cell} font-semibold`}>Available</th>
                <th className={`${cell} text-right font-semibold`}>Transfer Now</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const remaining = round4(r.required_qty - r.transferred_qty);
                const warehouse = warehouseByIndex[i] ?? "";
                const qty = qtyByIndex[i] ?? 0;
                return (
                  <tr key={`${r.item_code}-${i}`} className="border-b border-border last:border-0 align-top">
                    <td className={cell}>
                      <div className="text-graphite-900">
                        {r.item_code} — {r.item_name}
                      </div>
                      {r.requiresBatchOrSerial && (
                        <p className="mt-1 text-xs text-alert">
                          Requires batch/serial allocation — not supported here yet. Transfer this item via Stock
                          Entry directly.
                        </p>
                      )}
                    </td>
                    <td className={`${cell} text-right font-mono tabular-nums`}>
                      {r.required_qty} {r.uom}
                    </td>
                    <td className={`${cell} text-right font-mono tabular-nums`}>{r.transferred_qty}</td>
                    <td className={`${cell} text-right font-mono tabular-nums`}>{remaining}</td>
                    <td className={cell}>
                      <select
                        className={selectClass}
                        value={warehouse}
                        disabled={r.requiresBatchOrSerial}
                        onChange={(e) => setWarehouseByIndex((prev) => ({ ...prev, [i]: e.target.value }))}
                      >
                        <option value="">Select…</option>
                        {warehouses.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={cell}>
                      <StockBadge itemCode={r.item_code} warehouse={warehouse} requestedQty={qty} />
                    </td>
                    <td className={`${cell} text-right`}>
                      <input
                        type="number"
                        min={0}
                        max={r.qty}
                        step="any"
                        disabled={r.requiresBatchOrSerial}
                        value={qty}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(r.qty, Number(e.target.value) || 0));
                          setQtyByIndex((prev) => ({ ...prev, [i]: v }));
                        }}
                        className={`${inputClass} text-right`}
                      />
                      <p className="mt-1 text-xs text-graphite-500">of {r.qty} allowed</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {additionalRows.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-graphite-900">Additional Materials</p>
          <div className="overflow-x-auto rounded-xl border border-alert/40 bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-canvas text-graphite-500">
                  <th className={`${cell} font-semibold`}>Item</th>
                  <th className={`${cell} text-right font-semibold`}>Qty</th>
                  <th className={`${cell} font-semibold`}>Source Warehouse</th>
                  <th className={`${cell} font-semibold`}>Reason</th>
                  <th className={cell} />
                </tr>
              </thead>
              <tbody>
                {additionalRows.map((r) => (
                  <tr key={r.item_code} className="border-b border-border last:border-0">
                    <td className={cell}>
                      <span className="mr-2 rounded bg-alert/10 px-1.5 py-0.5 text-xs font-semibold text-alert">
                        ADDITIONAL
                      </span>
                      {r.item_code} — {r.item_name}
                    </td>
                    <td className={`${cell} text-right font-mono tabular-nums`}>
                      {r.qty} {r.uom}
                    </td>
                    <td className={cell}>{r.s_warehouse}</td>
                    <td className={`${cell} text-graphite-500`}>{r.reason || "—"}</td>
                    <td className={cell}>
                      <button
                        type="button"
                        onClick={() => removeAdditional(r.item_code)}
                        className="text-xs text-alert hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-xs text-graphite-500">
            Not part of the standard BOM for this Work Order — the master BOM is never changed.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-graphite-900">+ Add Material</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <select
            className={selectClass}
            value={newItemCode}
            onChange={(e) => setNewItemCode(e.target.value)}
          >
            <option value="">Search item…</option>
            {itemOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.code} — {opt.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            step="any"
            value={newQty}
            onChange={(e) => setNewQty(Number(e.target.value) || 0)}
            className={`${inputClass} text-right`}
            placeholder="Qty"
          />
          <select className={selectClass} value={newWarehouse} onChange={(e) => setNewWarehouse(e.target.value)}>
            <option value="">Source warehouse…</option>
            {warehouses.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Reason (optional)"
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={addMaterial}
          disabled={isLookupPending}
          className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-graphite-900 hover:bg-canvas disabled:opacity-60"
        >
          {isLookupPending ? "Checking…" : "+ Add Material"}
        </button>
        {addError && <p className="mt-2 text-sm text-alert">{addError}</p>}
      </div>

      <div className="rounded-xl border border-border bg-canvas p-4">
        <p className="mb-2 text-sm font-semibold text-graphite-900">Review</p>
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <dt className="text-graphite-500">From</dt>
            <dd className="text-graphite-900">{fromSummary}</dd>
          </div>
          <div>
            <dt className="text-graphite-500">To</dt>
            <dd className="text-graphite-900">{workOrder.wip_warehouse || "—"}</dd>
          </div>
          <div>
            <dt className="text-graphite-500">Materials</dt>
            <dd className="font-mono text-graphite-900">{requiredForSubmit.length}</dd>
          </div>
          <div>
            <dt className="text-graphite-500">Additional</dt>
            <dd className="font-mono text-graphite-900">{additionalForSubmit.length}</dd>
          </div>
        </dl>
        {totalRowCount === 0 && missingWarehouseRows.length === 0 && (
          <p className="mt-3 text-sm text-alert">
            Every quantity is zero — nothing would be transferred. Set at least one Transfer Now quantity above.
          </p>
        )}
        {missingWarehouseRows.length > 0 && (
          <p className="mt-3 text-sm text-alert">
            {missingWarehouseRows.map((r) => r.item_code).join(", ")} — quantity is set but no source warehouse is
            selected, so {missingWarehouseRows.length === 1 ? "it" : "they"} will not be included in this transfer.
          </p>
        )}
      </div>

      {(draftState?.error || submitState?.error) && (
        <p className="text-sm text-alert">{draftState?.error || submitState?.error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/manufacturing/work-orders/${encodeURIComponent(workOrder.name)}`}
          className="text-sm text-graphite-500 hover:underline"
        >
          Cancel
        </Link>

        <form action={draftFormAction}>
          {hiddenFields}
          <button
            type="submit"
            disabled={isDraftPending || isSubmitPending || totalRowCount === 0}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-graphite-900 hover:bg-canvas disabled:opacity-60"
          >
            {isDraftPending ? "Saving…" : "Save Draft"}
          </button>
        </form>

        <form action={submitFormAction}>
          {hiddenFields}
          <button
            type="submit"
            disabled={isDraftPending || isSubmitPending || totalRowCount === 0}
            className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
          >
            {isSubmitPending ? "Transferring…" : "Submit Transfer"}
          </button>
        </form>
      </div>
    </div>
  );
}

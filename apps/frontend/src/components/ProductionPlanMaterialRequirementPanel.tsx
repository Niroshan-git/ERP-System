"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getMaterialRequirementsPreview,
  saveMaterialRequirementsAction,
  type MaterialRequirementOptions,
} from "@/lib/actions/productionPlanPlanning";
import type { ProductionPlanMaterialRequestPlanItemRowInput } from "@/lib/productionPlanRows";

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";
const labelClass = "mb-1 block text-sm font-medium text-graphite-900";
const cell = "px-3 py-2";
const plainTableWrap = "overflow-x-auto rounded-xl border border-border bg-surface";
const plainTableHead = "border-b border-border bg-canvas text-graphite-500";

function describeError(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}

/**
 * Draft-only "Get Items for Purchase Only" step (PP-4) — see
 * `lib/actions/productionPlanPlanning.ts` for exactly why this calls a different ERPNext
 * boundary than the sub-assembly panel (pure calculation, not a document-bound method) and why
 * it reads sub-assembly rows off the *saved* document rather than this page's own state — save
 * the Sub-Assemblies tab first if raw materials should explode through it. Required Qty is
 * ERPNext&apos;s own computed shortage figure; this never recalculates it.
 */
export function ProductionPlanMaterialRequirementPanel({
  name,
  warehouses,
  initialOptions,
  initialRows,
}: {
  name: string;
  warehouses: string[];
  initialOptions: MaterialRequirementOptions;
  initialRows: ProductionPlanMaterialRequestPlanItemRowInput[];
}) {
  const router = useRouter();
  const [options, setOptions] = useState<MaterialRequirementOptions>(initialOptions);
  const [rows, setRows] = useState<ProductionPlanMaterialRequestPlanItemRowInput[]>(initialRows);
  const [hasPreview, setHasPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runGet() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await getMaterialRequirementsPreview(name, options);
        setRows(result);
        setHasPreview(true);
        if (result.length === 0) {
          setNotice(
            `No Material Requirements were calculated. Warehouse ${options.for_warehouse} may already have ` +
              "sufficient projected stock for every raw material — enable “Consider Projected Qty (RM)” " +
              "if this should instead show the full gross requirement regardless of stock on hand.",
          );
        }
      } catch (e) {
        setError(describeError(e));
      }
    });
  }

  function runSave() {
    setError(null);
    startTransition(async () => {
      try {
        await saveMaterialRequirementsAction(name, options, rows);
        setNotice("Material Requirements saved.");
        router.refresh();
      } catch (e) {
        setError(describeError(e));
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-graphite-500">
        Required Qty is ERPNext&apos;s own computed shortage figure — not recalculated by this app. Running
        &quot;Get Items for Purchase Only&quot; only previews the result; nothing is saved until you click Save
        below. This is the single-warehouse &quot;Purchase Only&quot; scope — multi-location transfer sourcing is
        not available here.
      </p>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-graphite-900">Material Requirement Options</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className={labelClass} htmlFor="pp-for-warehouse">
              For Warehouse
            </label>
            <select
              id="pp-for-warehouse"
              className={inputClass}
              value={options.for_warehouse}
              onChange={(e) => setOptions((o) => ({ ...o, for_warehouse: e.target.value }))}
            >
              <option value="">Select…</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 pb-2">
            <input
              id="pp-ignore-existing-ordered-qty"
              type="checkbox"
              checked={Boolean(options.ignore_existing_ordered_qty)}
              onChange={(e) => setOptions((o) => ({ ...o, ignore_existing_ordered_qty: e.target.checked ? 1 : 0 }))}
            />
            <label htmlFor="pp-ignore-existing-ordered-qty" className="text-sm text-graphite-900">
              Consider Projected Qty (RM)
            </label>
          </div>
          <div className="flex items-end gap-2 pb-2">
            <input
              id="pp-include-non-stock"
              type="checkbox"
              checked={Boolean(options.include_non_stock_items)}
              onChange={(e) => setOptions((o) => ({ ...o, include_non_stock_items: e.target.checked ? 1 : 0 }))}
            />
            <label htmlFor="pp-include-non-stock" className="text-sm text-graphite-900">
              Include Non Stock Items
            </label>
          </div>
          <div className="flex items-end gap-2 pb-2">
            <input
              id="pp-consider-min-order-qty"
              type="checkbox"
              checked={Boolean(options.consider_minimum_order_qty)}
              onChange={(e) => setOptions((o) => ({ ...o, consider_minimum_order_qty: e.target.checked ? 1 : 0 }))}
            />
            <label htmlFor="pp-consider-min-order-qty" className="text-sm text-graphite-900">
              Consider Minimum Order Qty
            </label>
          </div>
          <div className="flex items-end gap-2 pb-2">
            <input
              id="pp-include-safety-stock"
              type="checkbox"
              checked={Boolean(options.include_safety_stock)}
              onChange={(e) => setOptions((o) => ({ ...o, include_safety_stock: e.target.checked ? 1 : 0 }))}
            />
            <label htmlFor="pp-include-safety-stock" className="text-sm text-graphite-900">
              Include Safety Stock
            </label>
          </div>
        </div>
        <button
          type="button"
          onClick={runGet}
          disabled={isPending || !options.for_warehouse}
          className="mt-4 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-50"
        >
          {isPending ? "Working…" : "Get Items for Purchase Only"}
        </button>
        {!options.for_warehouse && <p className="mt-2 text-xs text-graphite-500">Select a For Warehouse first.</p>}
      </div>

      {error && <div className="rounded-md border border-alert/30 bg-alert/5 px-3 py-2 text-sm text-alert">{error}</div>}
      {notice && !error && (
        <div className="rounded-md border border-border bg-canvas px-3 py-2 text-sm text-graphite-500">{notice}</div>
      )}

      <div className={plainTableWrap}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={plainTableHead}>
              <th className={`${cell} font-semibold`}>Item</th>
              <th className={`${cell} font-semibold`}>Warehouse</th>
              <th className={`${cell} text-right font-semibold`}>Required Qty</th>
              <th className={`${cell} text-right font-semibold`}>Available Qty</th>
              <th className={`${cell} text-right font-semibold`}>Safety Stock</th>
              <th className={`${cell} font-semibold`}>Type</th>
              <th className={`${cell} font-semibold`}>From BOM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className={`${cell} font-mono`}>{row.item_code}</td>
                <td className={cell}>{row.warehouse || "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>
                  {row.quantity} {row.uom || ""}
                </td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{row.actual_qty ?? "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{row.safety_stock ?? "—"}</td>
                <td className={`${cell} text-graphite-500`}>{row.material_request_type || "—"}</td>
                <td className={`${cell} font-mono text-xs text-graphite-500`}>{row.from_bom || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-graphite-500">
                  {hasPreview
                    ? "No material requirement rows."
                    : "No material requirement rows saved yet — run “Get Items for Purchase Only”."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={runSave}
        disabled={isPending}
        className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-graphite-900 hover:bg-canvas disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save Material Requirements"}
      </button>
    </div>
  );
}

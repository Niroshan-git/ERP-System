"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getSubAssemblyItemsPreview,
  saveSubAssemblyItemsAction,
  type SubAssemblyOptions,
} from "@/lib/actions/productionPlanPlanning";
import type { ProductionPlanSubAssemblyItemRowInput } from "@/lib/productionPlanRows";

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
 * Draft-only "Get Sub Assembly Items" step (PP-4) on the Production Plan detail page — see
 * `lib/actions/productionPlanPlanning.ts` for exactly what the native ERPNext call does and
 * doesn't persist. Two explicit steps, matching Desk's own two-step nature (native call mutates
 * only the in-memory doc; a separate Save is what actually keeps the result) — never auto-saves.
 */
export function ProductionPlanSubAssemblyPanel({
  name,
  warehouses,
  initialOptions,
  initialRows,
}: {
  name: string;
  warehouses: string[];
  initialOptions: SubAssemblyOptions;
  initialRows: ProductionPlanSubAssemblyItemRowInput[];
}) {
  const router = useRouter();
  const [options, setOptions] = useState<SubAssemblyOptions>(initialOptions);
  const [rows, setRows] = useState<ProductionPlanSubAssemblyItemRowInput[]>(initialRows);
  const [hasPreview, setHasPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const needsWarehouse = Boolean(options.skip_available_sub_assembly_item) && !options.sub_assembly_warehouse;

  function runGet() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await getSubAssemblyItemsPreview(name, options);
        setRows(result);
        setHasPreview(true);
        if (result.length === 0) {
          setNotice(
            "No sub-assembly items were generated. Either this Finished Goods BOM has no sub-assembly " +
              "components, or (if “Consider Projected Qty” is checked) existing stock at the Sub " +
              "Assembly Warehouse already covers the requirement.",
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
        await saveSubAssemblyItemsAction(name, options, rows);
        setNotice("Sub-assembly items saved.");
        router.refresh();
      } catch (e) {
        setError(describeError(e));
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-graphite-500">
        Generated entirely by ERPNext&apos;s own server-side BOM explosion — not recomputed here. Running
        &quot;Get Sub Assembly Items&quot; only previews the result; nothing is saved until you click Save below.
      </p>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-graphite-900">Sub-Assembly Options</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className={labelClass} htmlFor="pp-sub-assembly-warehouse">
              Sub Assembly Warehouse
            </label>
            <select
              id="pp-sub-assembly-warehouse"
              className={inputClass}
              value={options.sub_assembly_warehouse ?? ""}
              onChange={(e) => setOptions((o) => ({ ...o, sub_assembly_warehouse: e.target.value || undefined }))}
            >
              <option value="">—</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 pb-2">
            <input
              id="pp-skip-available"
              type="checkbox"
              checked={Boolean(options.skip_available_sub_assembly_item)}
              onChange={(e) => setOptions((o) => ({ ...o, skip_available_sub_assembly_item: e.target.checked ? 1 : 0 }))}
            />
            <label htmlFor="pp-skip-available" className="text-sm text-graphite-900">
              Consider Projected Qty in Calculation
            </label>
          </div>
          <div className="flex items-end gap-2 pb-2">
            <input
              id="pp-combine-sub-items"
              type="checkbox"
              checked={Boolean(options.combine_sub_items)}
              onChange={(e) => setOptions((o) => ({ ...o, combine_sub_items: e.target.checked ? 1 : 0 }))}
            />
            <label htmlFor="pp-combine-sub-items" className="text-sm text-graphite-900">
              Consolidate Sub Assembly Items
            </label>
          </div>
        </div>
        {needsWarehouse && (
          <p className="mt-2 text-xs text-alert">
            Select a Sub Assembly Warehouse — required when &quot;Consider Projected Qty&quot; is checked.
          </p>
        )}
        <button
          type="button"
          onClick={runGet}
          disabled={isPending || needsWarehouse}
          className="mt-4 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-50"
        >
          {isPending ? "Working…" : "Get Sub Assembly Items"}
        </button>
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
              <th className={`${cell} font-semibold`}>Parent Item</th>
              <th className={`${cell} font-semibold`}>BOM</th>
              <th className={`${cell} font-semibold`}>Type of Manufacturing</th>
              <th className={`${cell} text-right font-semibold`}>Required Qty</th>
              <th className={`${cell} text-right font-semibold`}>Qty to Order</th>
              <th className={`${cell} font-semibold`}>Warehouse</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className={`${cell} font-mono`}>{row.production_item}</td>
                <td className={cell}>{row.parent_item_code || "—"}</td>
                <td className={`${cell} font-mono`}>{row.bom_no || "—"}</td>
                <td className={`${cell} text-graphite-500`}>{row.type_of_manufacturing || "—"}</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>
                  {row.required_qty ?? "—"} {row.uom || ""}
                </td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{row.qty ?? "—"}</td>
                <td className={cell}>{row.fg_warehouse || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-graphite-500">
                  {hasPreview ? "No sub-assembly rows." : "No sub-assembly rows saved yet — run “Get Sub Assembly Items”."}
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
        {isPending ? "Saving…" : "Save Sub-Assembly Items"}
      </button>
    </div>
  );
}

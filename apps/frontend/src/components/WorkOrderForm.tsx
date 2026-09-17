"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import { getBomDetails, listBomsForItem, type BomDetail, type BomOption } from "@/lib/actions/bomLookup";
import type { ManufacturableItemOption } from "@/lib/actions/itemLookup";
import { PlainLineItemsTable, type PlainLineItemRow } from "@/components/PlainLineItemsTable";
import { StockBadge } from "@/components/StockBadge";

export type WorkOrderFormState = { error?: string } | undefined;

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";
const labelClass = "mb-1 block text-sm font-medium text-graphite-900";

/** Rounds away float noise from qty * factor scaling (e.g. 3 * (2/1) = 6.000000000000001). */
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Picks a warehouse whose name contains `needle` — see the doc comment on the
 * pre-defaulting rule this implements (a frontend-only UI convenience, not business logic;
 * Manufacturing Settings carries no default WIP/FG/source warehouse to read instead). */
function matchWarehouse(warehouses: string[], needle: string): string {
  return warehouses.find((w) => w.includes(needle)) ?? "";
}

/**
 * Work Order create form. Production Item is restricted to manufacturable items
 * (`default_bom` set — see listManufacturableItemOptions). Selecting an item looks up its
 * active BOMs and auto-selects one when unambiguous; selecting a BOM fetches its header
 * `quantity` + `items`/`operations` for a read-only, client-scaled preview. No submit/cancel
 * here and no BOM explosion — ERPNext itself builds `required_items`/`operations`
 * server-side from `bom_no`+`qty` on insert (see actions.ts's doc comment).
 */
export function WorkOrderForm({
  action,
  itemOptions,
  companies,
  defaultCompany,
  warehouses,
  projectOptions,
  salesOrderOptions,
}: {
  action: (state: WorkOrderFormState, formData: FormData) => Promise<WorkOrderFormState>;
  itemOptions: ManufacturableItemOption[];
  companies: string[];
  defaultCompany: string;
  warehouses: string[];
  projectOptions: string[] | null;
  salesOrderOptions: string[] | null;
}) {
  const [state, formAction, isPending] = useActionState<WorkOrderFormState, FormData>(action, undefined);
  const [isBomPending, startBomTransition] = useTransition();

  const [productionItem, setProductionItem] = useState("");
  const [bomOptions, setBomOptions] = useState<BomOption[]>([]);
  const [bomNo, setBomNo] = useState("");
  const [bomDetail, setBomDetail] = useState<BomDetail>(null);
  const [qty, setQty] = useState(1);
  const [company, setCompany] = useState(defaultCompany);
  const [useMultiLevelBom, setUseMultiLevelBom] = useState(false);

  const [sourceWarehouse, setSourceWarehouse] = useState(() => matchWarehouse(warehouses, "Stores"));
  const [wipWarehouse, setWipWarehouse] = useState(() => matchWarehouse(warehouses, "Work In Progress"));
  const [fgWarehouse, setFgWarehouse] = useState(() => matchWarehouse(warehouses, "Finished Goods"));

  function loadBomsForItem(itemCode: string) {
    startBomTransition(async () => {
      const boms = await listBomsForItem(itemCode);
      setBomOptions(boms);
      const preferred = boms.find((b) => b.is_default) ?? (boms.length === 1 ? boms[0] : undefined);
      if (preferred) {
        setBomNo(preferred.name);
        const detail = await getBomDetails(preferred.name);
        setBomDetail(detail);
      } else {
        setBomNo("");
        setBomDetail(null);
      }
    });
  }

  function onItemChange(code: string) {
    setProductionItem(code);
    setBomOptions([]);
    setBomNo("");
    setBomDetail(null);
    if (code) loadBomsForItem(code);
  }

  function onBomChange(name: string) {
    setBomNo(name);
    setBomDetail(null);
    if (!name) return;
    startBomTransition(async () => {
      const detail = await getBomDetails(name);
      setBomDetail(detail);
    });
  }

  // Flat client-side scaling against the BOM's own top-level `items` only — not multi-level
  // explosion (see this component's doc comment / bomLookup.ts).
  const scaledMaterials = useMemo(() => {
    if (!bomDetail) return [];
    const factor = qty / (bomDetail.quantity || 1);
    return bomDetail.items.map((i) => ({ ...i, requiredQty: round4(i.qty * factor) }));
  }, [bomDetail, qty]);

  const materialRows: PlainLineItemRow[] = scaledMaterials.map((m) => ({
    item_code: m.item_code,
    item_name: m.item_name || m.item_code,
    qty: m.requiredQty,
    uom: m.uom,
  }));

  return (
    <form action={formAction} className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="production_item" className={labelClass}>
            Production Item
          </label>
          <select
            id="production_item"
            name="production_item"
            required
            value={productionItem}
            onChange={(e) => onItemChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Select…</option>
            {itemOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.code} — {opt.name}
              </option>
            ))}
          </select>
          {itemOptions.length === 0 && (
            <p className="mt-1 text-xs text-graphite-500">
              No item has a default BOM yet — create and mark a BOM as default for an item first.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="bom_no" className={labelClass}>
            BOM
          </label>
          <select
            id="bom_no"
            name="bom_no"
            required
            disabled={!productionItem}
            value={bomNo}
            onChange={(e) => onBomChange(e.target.value)}
            className={`${inputClass} disabled:bg-canvas disabled:text-graphite-500`}
          >
            <option value="">{isBomPending ? "Loading…" : "Select…"}</option>
            {bomOptions.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
                {b.is_default ? " (default)" : ""}
              </option>
            ))}
          </select>
          {productionItem && !isBomPending && bomOptions.length === 0 && (
            <p className="mt-1 text-xs text-alert">No active, submitted BOM found for this item.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="qty" className={labelClass}>
            Quantity
          </label>
          <input
            type="number"
            id="qty"
            name="qty"
            min="0"
            step="any"
            required
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 0)}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <label htmlFor="company" className={labelClass}>
            Company
          </label>
          <select
            id="company"
            name="company"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
          >
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-graphite-900">
            <input
              type="checkbox"
              name="use_multi_level_bom"
              checked={useMultiLevelBom}
              onChange={(e) => setUseMultiLevelBom(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Use multi-level BOM
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="planned_start_date" className={labelClass}>
            Planned start
          </label>
          <input
            type="datetime-local"
            id="planned_start_date"
            name="planned_start_date"
            required
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <label htmlFor="planned_end_date" className={labelClass}>
            Planned end
          </label>
          <input type="datetime-local" id="planned_end_date" name="planned_end_date" className={`${inputClass} font-mono`} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-graphite-900">Source / Reference</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="project" className={labelClass}>
              Project
            </label>
            {projectOptions ? (
              <select id="project" name="project" defaultValue="" className={inputClass}>
                <option value="">None</option>
                {projectOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : (
              <input id="project" name="project" placeholder="Optional" className={inputClass} />
            )}
          </div>
          <div>
            <label htmlFor="sales_order" className={labelClass}>
              Sales Order
            </label>
            {salesOrderOptions ? (
              <select id="sales_order" name="sales_order" defaultValue="" className={inputClass}>
                <option value="">None</option>
                {salesOrderOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input id="sales_order" name="sales_order" placeholder="Optional" className={inputClass} />
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-graphite-900">Warehouses</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="source_warehouse" className={labelClass}>
              Source Warehouse
            </label>
            <select
              id="source_warehouse"
              name="source_warehouse"
              value={sourceWarehouse}
              onChange={(e) => setSourceWarehouse(e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="wip_warehouse" className={labelClass}>
              WIP Warehouse
            </label>
            <select
              id="wip_warehouse"
              name="wip_warehouse"
              value={wipWarehouse}
              onChange={(e) => setWipWarehouse(e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fg_warehouse" className={labelClass}>
              Target Warehouse
            </label>
            <select
              id="fg_warehouse"
              name="fg_warehouse"
              value={fgWarehouse}
              onChange={(e) => setFgWarehouse(e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-1 text-xs text-graphite-500">
          Pre-selected by matching warehouse names — all three are editable and optional.
        </p>
      </div>

      {bomDetail && (
        <div>
          <p className="mb-2 text-sm font-semibold text-graphite-900">
            Materials required (scaled to {qty} of {bomDetail.quantity} on {bomDetail.name})
          </p>
          <PlainLineItemsTable items={materialRows} />
        </div>
      )}

      {bomDetail && bomDetail.operations.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-graphite-900">Operations (from {bomDetail.name})</p>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-canvas text-graphite-500">
                  <th className="px-3 py-2 font-semibold">Operation</th>
                  <th className="px-3 py-2 font-semibold">Workstation</th>
                  <th className="px-3 py-2 text-right font-semibold">Time (mins)</th>
                </tr>
              </thead>
              <tbody>
                {bomDetail.operations.map((op, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-graphite-900">{op.operation}</td>
                    <td className="px-3 py-2 text-graphite-500">{op.workstation || "—"}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{op.time_in_mins ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bomDetail && sourceWarehouse && scaledMaterials.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-graphite-900">Material Readiness — {sourceWarehouse}</p>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-canvas text-graphite-500">
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 text-right font-semibold">Required</th>
                  <th className="px-3 py-2 text-right font-semibold">Available</th>
                </tr>
              </thead>
              <tbody>
                {scaledMaterials.map((m) => (
                  <tr key={m.item_code} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-graphite-900">
                      {m.item_code} — {m.item_name}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{m.requiredQty}</td>
                    <td className="px-3 py-2 text-right">
                      <StockBadge itemCode={m.item_code} warehouse={sourceWarehouse} requestedQty={m.requiredQty} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {state?.error && <p className="text-sm text-alert">{state.error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create"}
        </button>
        <Link href="/manufacturing/work-orders" className="text-sm text-graphite-500 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

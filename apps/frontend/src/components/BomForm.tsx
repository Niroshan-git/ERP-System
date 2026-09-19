"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { getItemLineDefaults, type ItemOption } from "@/lib/actions/itemLookup";
import { BomComponentsEditor, type BomComponentRow } from "@/components/BomComponentsEditor";
import { BomOperationsEditor, type BomOperationRow } from "@/components/BomOperationsEditor";

export type BomFormState = { error?: string } | undefined;

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal disabled:bg-canvas disabled:text-graphite-500";
const labelClass = "mb-1 block text-sm font-medium text-graphite-900";
const checkboxRow = "flex items-center gap-2 text-sm text-graphite-900";

/**
 * BOM header + Components + (conditionally) Operations. Used for both create
 * (`/master-data/boms/new`) and Draft-only edit (inline on the BOM detail page when
 * `docstatus === 0`) — same shape `PurchaseOrderForm`/`SalesOrderForm` already establish
 * for their own create/edit reuse. `item` is disabled once `initial` is supplied (editing
 * an existing BOM) — this app's own frontend-side safety choice, not an independently
 * live-verified ERPNext restriction (BOM.item carries no schema flag preventing a change),
 * since a BOM's finished item is treated as its identity by every reference to it
 * (Item.default_bom, Work Order's bom_no, nested BOM Item.bom_no).
 */
export function BomForm({
  action,
  itemOptions,
  companies,
  warehouseOptions,
  operationOptions,
  workstationOptions,
  routingOptions,
  currencyOptions,
  defaultCurrency,
  cancelHref,
  initial,
}: {
  action: (state: BomFormState, formData: FormData) => Promise<BomFormState>;
  itemOptions: ItemOption[];
  companies: string[];
  warehouseOptions: string[];
  operationOptions: string[];
  workstationOptions: string[];
  routingOptions: string[];
  currencyOptions: string[];
  defaultCurrency: string;
  /** Where "Cancel" navigates — the BOM list for create, the BOM's own detail page for edit. */
  cancelHref: string;
  initial?: {
    item: string;
    item_name: string;
    company: string;
    quantity: number;
    uom: string;
    currency: string;
    conversion_rate: number;
    with_operations: boolean;
    is_active: boolean;
    is_default: boolean;
    routing?: string;
    transfer_material_against?: string;
    allow_alternative_item: boolean;
    is_phantom_bom: boolean;
    track_semi_finished_goods: boolean;
    inspection_required: boolean;
    default_source_warehouse?: string;
    default_target_warehouse?: string;
    components: BomComponentRow[];
    operations: BomOperationRow[];
  };
}) {
  const [state, formAction, isPending] = useActionState<BomFormState, FormData>(action, undefined);
  const [, startTransition] = useTransition();

  const [itemCode, setItemCode] = useState(initial?.item ?? "");
  const [itemName, setItemName] = useState(initial?.item_name ?? "");
  const [uom, setUom] = useState(initial?.uom ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency);
  const [withOperations, setWithOperations] = useState(Boolean(initial?.with_operations));

  function onItemChange(code: string) {
    setItemCode(code);
    const option = itemOptions.find((o) => o.code === code);
    setItemName(option?.name ?? "");
    if (!code) return;
    startTransition(async () => {
      const defaults = await getItemLineDefaults(code);
      if (defaults) setUom(defaults.uom);
    });
  }

  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      <input type="hidden" name="item_name" value={itemName} readOnly />

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-graphite-900">General Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="item" className={labelClass}>
              Item to Manufacture
            </label>
            {/* A disabled <select> submits no value at all — a hidden input carries the
                real value through on edit, while the visible select stays disabled so the
                user can see but not change it. */}
            {initial && <input type="hidden" name="item" value={itemCode} />}
            <select
              id="item"
              name={initial ? undefined : "item"}
              required
              disabled={Boolean(initial)}
              value={itemCode}
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
            {initial && (
              <p className="mt-1 text-xs text-graphite-500">
                The finished item of an existing BOM can&apos;t be changed here — create a new BOM instead.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="company" className={labelClass}>
              Company
            </label>
            <select id="company" name="company" required defaultValue={initial?.company ?? companies[0]} className={inputClass}>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quantity" className={labelClass}>
              Quantity (Output Qty)
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="0.000001"
              step="any"
              required
              defaultValue={initial?.quantity ?? 1}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label htmlFor="uom" className={labelClass}>
              UOM
            </label>
            <input type="text" id="uom" name="uom" value={uom} readOnly className={`${inputClass} font-mono bg-canvas text-graphite-500`} />
            <p className="mt-1 text-xs text-graphite-500">Follows the selected item&apos;s own stock UOM.</p>
          </div>
          <div>
            <label htmlFor="currency" className={labelClass}>
              Currency
            </label>
            <select id="currency" name="currency" required value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
              {currencyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="conversion_rate" className={labelClass}>
              Conversion Rate
            </label>
            <input
              type="number"
              id="conversion_rate"
              name="conversion_rate"
              min="0.000001"
              step="any"
              required
              defaultValue={initial?.conversion_rate ?? 1}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-graphite-900">Configuration</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <label className={checkboxRow}>
            <input
              type="checkbox"
              name="with_operations"
              checked={withOperations}
              onChange={(e) => setWithOperations(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            With Operations
          </label>
          <label className={checkboxRow}>
            <input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? true} className="h-4 w-4 rounded border-border" />
            Is Active
          </label>
          <label className={checkboxRow}>
            <input type="checkbox" name="is_default" defaultChecked={initial?.is_default ?? false} className="h-4 w-4 rounded border-border" />
            Is Default
          </label>
          <label className={checkboxRow}>
            <input
              type="checkbox"
              name="allow_alternative_item"
              defaultChecked={initial?.allow_alternative_item ?? false}
              className="h-4 w-4 rounded border-border"
            />
            Allow Alternative Item
          </label>
          <label className={checkboxRow}>
            <input
              type="checkbox"
              name="is_phantom_bom"
              defaultChecked={initial?.is_phantom_bom ?? false}
              className="h-4 w-4 rounded border-border"
            />
            Is Phantom BOM
          </label>
          <label className={checkboxRow}>
            <input
              type="checkbox"
              name="track_semi_finished_goods"
              defaultChecked={initial?.track_semi_finished_goods ?? false}
              className="h-4 w-4 rounded border-border"
            />
            Track Semi Finished Goods
          </label>
          <label className={checkboxRow}>
            <input
              type="checkbox"
              name="inspection_required"
              defaultChecked={initial?.inspection_required ?? false}
              className="h-4 w-4 rounded border-border"
            />
            Quality Inspection Required
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="routing" className={labelClass}>
              Routing
            </label>
            <select id="routing" name="routing" defaultValue={initial?.routing ?? ""} className={inputClass}>
              <option value="">—</option>
              {routingOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="transfer_material_against" className={labelClass}>
              Transfer Material Against
            </label>
            <select
              id="transfer_material_against"
              name="transfer_material_against"
              defaultValue={initial?.transfer_material_against ?? "Work Order"}
              className={inputClass}
            >
              <option value="Work Order">Work Order</option>
              <option value="Job Card">Job Card</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-graphite-900">Warehouses</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="default_source_warehouse" className={labelClass}>
              Default Source Warehouse
            </label>
            <select
              id="default_source_warehouse"
              name="default_source_warehouse"
              defaultValue={initial?.default_source_warehouse ?? ""}
              className={inputClass}
            >
              <option value="">—</option>
              {warehouseOptions.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="default_target_warehouse" className={labelClass}>
              Default Target Warehouse
            </label>
            <select
              id="default_target_warehouse"
              name="default_target_warehouse"
              defaultValue={initial?.default_target_warehouse ?? ""}
              className={inputClass}
            >
              <option value="">—</option>
              {warehouseOptions.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Components</h2>
        <BomComponentsEditor
          itemOptions={itemOptions}
          warehouseOptions={warehouseOptions}
          operationOptions={operationOptions}
          initialRows={initial?.components}
          currency={currency}
          withOperations={withOperations}
        />
      </div>

      {/*
       * Always mounted, only visually hidden via the `hidden` attribute when "With
       * Operations" is off — NOT `{withOperations && <BomOperationsEditor />}`. That
       * conditional-mount version was tried first and unmounts the editor entirely on
       * every toggle-off, which destroys its internal row state (React discards a
       * component's state when it unmounts): a user who types a few Operations rows,
       * then unchecks "With Operations" for any reason, then rechecks it, would silently
       * lose everything they'd entered. Safe to keep mounted regardless of the toggle —
       * `buildBomFields` (actions.ts) already ignores the "operations" field entirely
       * server-side whenever `with_operations` is unchecked, so a hidden, populated
       * editor never leaks rows into a BOM that shouldn't have any.
       */}
      <div hidden={!withOperations}>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Operations</h2>
        <BomOperationsEditor
          operationOptions={operationOptions}
          workstationOptions={workstationOptions}
          initialRows={initial?.operations}
          currency={currency}
        />
      </div>

      {state?.error && <p className="text-sm text-alert">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Link href={cancelHref} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-graphite-900 hover:bg-canvas">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save BOM"}
        </button>
      </div>
    </form>
  );
}

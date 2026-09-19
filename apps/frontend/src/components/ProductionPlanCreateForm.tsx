"use client";

import { useActionState, useState, useTransition } from "react";
import { listBomsForItem, type BomOption } from "@/lib/actions/bomLookup";
import {
  getFinishedGoods,
  getOpenSalesOrders,
  getPendingMaterialRequests,
  type ProductionPlanDraft,
  type ProductionPlanItemDraftRow,
} from "@/lib/actions/productionPlanCreate";

export type ProductionPlanFormState = { error?: string } | undefined;

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";
const labelClass = "mb-1 block text-sm font-medium text-graphite-900";
const cell = "px-3 py-2";
const plainTableWrap = "overflow-x-auto rounded-xl border border-border bg-surface";
const plainTableHead = "border-b border-border bg-canvas text-graphite-500";

const SALES_ORDER_STATUS_OPTIONS = ["", "To Deliver and Bill", "To Bill", "To Deliver"];

function emptyDraft(company: string): ProductionPlanDraft {
  return {
    company,
    posting_date: new Date().toISOString().slice(0, 10),
    get_items_from: "Sales Order",
    combine_items: 0,
    sales_orders: [],
    material_requests: [],
    po_items: [],
    prod_plan_references: [],
  };
}

/** `getOpenSalesOrders`/`getPendingMaterialRequests`/`getFinishedGoods` already unwrap
 * `ErpNextError` into a plain `Error` with ERPNext's own human-readable message server-side
 * (see `productionPlanCreate.ts`'s `callAndHumanize`) — `ErpNextError` itself can't cross the
 * Server Function boundary into this Client Component, only `Error.message` survives. */
function describeError(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}

/**
 * Production Plan create wizard (PP-2). Three native ERPNext round-trips, in the same order
 * Desk's own form uses, each via `run_doc_method` against the in-progress (never-saved)
 * document — see `lib/actions/productionPlanCreate.ts`'s doc comments for exactly which
 * native method each step calls and why: (1) set header/filter fields, (2) "Get Sales
 * Orders"/"Get Material Request" — pulls eligible demand into `sales_orders`/
 * `material_requests`, wholesale replace not append, matching native `add_so_in_table`/
 * `add_mr_in_table`; (3) "Get Finished Goods" — explodes that demand into `po_items` (native
 * `combine_so_items`, handles the `combine_items` merge case automatically). Only `bom_no`,
 * `planned_qty`, `warehouse`, and `planned_start_date` are user-editable on the resulting
 * `po_items` rows before save — every other field (item_code, pending_qty, sales_order
 * back-reference, ...) is what ERPNext itself resolved, left alone rather than second-guessed.
 * "Save as Draft" persists exactly that accumulated state — no submit, no downstream action.
 */
export function ProductionPlanCreateForm({
  action,
  companies,
  defaultCompany,
  customerOptions,
  warehouses,
  projectOptions,
}: {
  action: (state: ProductionPlanFormState, formData: FormData) => Promise<ProductionPlanFormState>;
  companies: string[];
  defaultCompany: string;
  customerOptions: string[] | null;
  warehouses: string[];
  projectOptions: string[] | null;
}) {
  const [state, formAction, isSaving] = useActionState<ProductionPlanFormState, FormData>(action, undefined);
  const [isFetchPending, startFetchTransition] = useTransition();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [bomOptionsByItem, setBomOptionsByItem] = useState<Record<string, BomOption[]>>({});

  const [draft, setDraft] = useState<ProductionPlanDraft>(() => emptyDraft(defaultCompany));

  function setHeader<K extends keyof ProductionPlanDraft>(key: K, value: ProductionPlanDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function runFetch(label: string, call: (d: ProductionPlanDraft) => Promise<ProductionPlanDraft>) {
    setFetchError(null);
    startFetchTransition(async () => {
      try {
        const updated = await call(draft);
        setDraft(updated);
        if (updated.get_items_from === "Sales Order" && updated.sales_orders.length === 0) {
          setFetchError("No open Sales Orders matched these filters.");
        } else if (updated.get_items_from === "Material Request" && updated.material_requests.length === 0) {
          setFetchError("No pending Material Requests matched these filters.");
        }
      } catch (e) {
        setFetchError(`${label}: ${describeError(e)}`);
      }
    });
  }

  function getDemand() {
    if (draft.get_items_from === "Sales Order") {
      runFetch("Get Sales Orders", getOpenSalesOrders);
    } else {
      runFetch("Get Material Request", getPendingMaterialRequests);
    }
  }

  function getFinished() {
    runFetch("Get Finished Goods", getFinishedGoods);
  }

  function updatePoItem(index: number, patch: Partial<ProductionPlanItemDraftRow>) {
    setDraft((d) => ({
      ...d,
      po_items: d.po_items.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function loadBomOptions(itemCode: string) {
    if (bomOptionsByItem[itemCode]) return;
    startFetchTransition(async () => {
      const boms = await listBomsForItem(itemCode);
      setBomOptionsByItem((m) => ({ ...m, [itemCode]: boms }));
    });
  }

  const demandRows =
    draft.get_items_from === "Sales Order"
      ? draft.sales_orders.map((r) => ({ key: r.sales_order, label: r.sales_order, sub: r.customer }))
      : draft.material_requests.map((r) => ({ key: r.material_request, label: r.material_request, sub: undefined }));

  const canGetFinishedGoods = demandRows.length > 0;

  return (
    <form action={formAction} className="max-w-5xl space-y-6">
      <input type="hidden" name="company" value={draft.company} />
      <input type="hidden" name="posting_date" value={draft.posting_date} />
      <input type="hidden" name="get_items_from" value={draft.get_items_from} />
      <input type="hidden" name="combine_items" value={draft.combine_items ? "on" : ""} />
      <input type="hidden" name="sales_orders" value={JSON.stringify(draft.sales_orders)} />
      <input type="hidden" name="material_requests" value={JSON.stringify(draft.material_requests)} />
      <input type="hidden" name="po_items" value={JSON.stringify(draft.po_items)} />
      <input type="hidden" name="prod_plan_references" value={JSON.stringify(draft.prod_plan_references)} />

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-graphite-900">1. Company &amp; demand source</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className={labelClass} htmlFor="pp-company">
              Company
            </label>
            <select
              id="pp-company"
              className={inputClass}
              value={draft.company}
              onChange={(e) => setHeader("company", e.target.value)}
            >
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="pp-posting-date">
              Posting Date
            </label>
            <input
              id="pp-posting-date"
              type="date"
              className={inputClass}
              value={draft.posting_date}
              onChange={(e) => setHeader("posting_date", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="pp-get-items-from">
              Get Items From
            </label>
            <select
              id="pp-get-items-from"
              className={inputClass}
              value={draft.get_items_from}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  get_items_from: e.target.value as ProductionPlanDraft["get_items_from"],
                  sales_orders: [],
                  material_requests: [],
                  po_items: [],
                  prod_plan_references: [],
                }))
              }
            >
              <option value="Sales Order">Sales Order</option>
              <option value="Material Request">Material Request</option>
            </select>
          </div>
          {draft.get_items_from === "Sales Order" && (
            <div className="flex items-end gap-2 pb-2">
              <input
                id="pp-combine-items"
                type="checkbox"
                checked={Boolean(draft.combine_items)}
                onChange={(e) => setHeader("combine_items", e.target.checked ? 1 : 0)}
              />
              <label htmlFor="pp-combine-items" className="text-sm text-graphite-900">
                Consolidate Sales Order Items
              </label>
            </div>
          )}
        </div>

        <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-graphite-500">
          Filter criteria (optional — narrows which {draft.get_items_from === "Sales Order" ? "Sales Orders" : "Material Requests"} are pulled in)
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className={labelClass} htmlFor="pp-item-code">
              Item Code
            </label>
            <input
              id="pp-item-code"
              className={inputClass}
              value={draft.item_code ?? ""}
              onChange={(e) => setHeader("item_code", e.target.value)}
            />
          </div>
          {draft.get_items_from === "Sales Order" && (
            <>
              <div>
                <label className={labelClass} htmlFor="pp-customer">
                  Customer
                </label>
                <select
                  id="pp-customer"
                  className={inputClass}
                  value={draft.customer ?? ""}
                  onChange={(e) => setHeader("customer", e.target.value)}
                >
                  <option value="">Any</option>
                  {(customerOptions ?? []).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="pp-project">
                  Project
                </label>
                <select
                  id="pp-project"
                  className={inputClass}
                  value={draft.project ?? ""}
                  onChange={(e) => setHeader("project", e.target.value)}
                >
                  <option value="">Any</option>
                  {(projectOptions ?? []).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="pp-so-status">
                  Sales Order Status
                </label>
                <select
                  id="pp-so-status"
                  className={inputClass}
                  value={draft.sales_order_status ?? ""}
                  onChange={(e) => setHeader("sales_order_status", e.target.value)}
                >
                  {SALES_ORDER_STATUS_OPTIONS.map((s) => (
                    <option key={s || "any"} value={s}>
                      {s || "Any"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="pp-from-date">
                  From Date
                </label>
                <input
                  id="pp-from-date"
                  type="date"
                  className={inputClass}
                  value={draft.from_date ?? ""}
                  onChange={(e) => setHeader("from_date", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="pp-to-date">
                  To Date
                </label>
                <input
                  id="pp-to-date"
                  type="date"
                  className={inputClass}
                  value={draft.to_date ?? ""}
                  onChange={(e) => setHeader("to_date", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="pp-from-delivery-date">
                  From Delivery Date
                </label>
                <input
                  id="pp-from-delivery-date"
                  type="date"
                  className={inputClass}
                  value={draft.from_delivery_date ?? ""}
                  onChange={(e) => setHeader("from_delivery_date", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="pp-to-delivery-date">
                  To Delivery Date
                </label>
                <input
                  id="pp-to-delivery-date"
                  type="date"
                  className={inputClass}
                  value={draft.to_delivery_date ?? ""}
                  onChange={(e) => setHeader("to_delivery_date", e.target.value)}
                />
              </div>
            </>
          )}
          {draft.get_items_from === "Material Request" && (
            <div>
              <label className={labelClass} htmlFor="pp-warehouse">
                Warehouse
              </label>
              <select
                id="pp-warehouse"
                className={inputClass}
                value={draft.warehouse ?? ""}
                onChange={(e) => setHeader("warehouse", e.target.value)}
              >
                <option value="">Any</option>
                {warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={getDemand}
          disabled={isFetchPending || !draft.company}
          className="mt-4 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-50"
        >
          {isFetchPending ? "Fetching…" : draft.get_items_from === "Sales Order" ? "Get Sales Orders" : "Get Material Request"}
        </button>
      </div>

      {fetchError && (
        <div className="rounded-md border border-alert/30 bg-alert/5 px-3 py-2 text-sm text-alert">{fetchError}</div>
      )}

      {demandRows.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-graphite-900">
            2. {draft.get_items_from === "Sales Order" ? "Sales Orders" : "Material Requests"} ({demandRows.length})
          </h2>
          <div className={plainTableWrap}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={plainTableHead}>
                  <th className={`${cell} font-semibold`}>{draft.get_items_from}</th>
                  {draft.get_items_from === "Sales Order" && <th className={`${cell} font-semibold`}>Customer</th>}
                </tr>
              </thead>
              <tbody>
                {demandRows.map((r) => (
                  <tr key={r.key} className="border-b border-border last:border-0">
                    <td className={`${cell} font-mono`}>{r.label}</td>
                    {draft.get_items_from === "Sales Order" && <td className={cell}>{r.sub || "—"}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={getFinished}
            disabled={isFetchPending || !canGetFinishedGoods}
            className="mt-4 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-50"
          >
            {isFetchPending ? "Fetching…" : "Get Finished Goods"}
          </button>
        </div>
      )}

      {draft.po_items.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-graphite-900">3. Finished Goods ({draft.po_items.length})</h2>
          <p className="mb-3 text-xs text-graphite-500">
            Item, Planned Qty and Warehouse come from ERPNext&apos;s own pending-quantity calculation. BOM defaults to
            the item&apos;s resolved BOM — change it below if another active BOM should be used instead.
          </p>
          <div className={plainTableWrap}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={plainTableHead}>
                  <th className={`${cell} font-semibold`}>Item</th>
                  <th className={`${cell} font-semibold`}>BOM</th>
                  <th className={`${cell} text-right font-semibold`}>Planned Qty</th>
                  <th className={`${cell} font-semibold`}>Warehouse</th>
                  <th className={`${cell} font-semibold`}>Planned Start</th>
                </tr>
              </thead>
              <tbody>
                {draft.po_items.map((row, i) => (
                  <tr key={`${row.item_code}-${i}`} className="border-b border-border last:border-0">
                    <td className={cell}>
                      <div className="font-mono">{row.item_code}</div>
                      {row.description && <div className="text-xs text-graphite-500">{row.description}</div>}
                    </td>
                    <td className={cell}>
                      <select
                        className={inputClass}
                        value={row.bom_no}
                        onFocus={() => loadBomOptions(row.item_code)}
                        onChange={(e) => updatePoItem(i, { bom_no: e.target.value })}
                      >
                        <option value={row.bom_no}>{row.bom_no}</option>
                        {(bomOptionsByItem[row.item_code] ?? [])
                          .filter((b) => b.name !== row.bom_no)
                          .map((b) => (
                            <option key={b.name} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className={`${cell} text-right`}>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className={`${inputClass} text-right`}
                        value={row.planned_qty}
                        onChange={(e) => updatePoItem(i, { planned_qty: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className={cell}>
                      <select
                        className={inputClass}
                        value={row.warehouse ?? ""}
                        onChange={(e) => updatePoItem(i, { warehouse: e.target.value })}
                      >
                        <option value="">—</option>
                        {warehouses.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={cell}>
                      <input
                        type="date"
                        className={inputClass}
                        value={(row.planned_start_date ?? "").slice(0, 10)}
                        onChange={(e) => updatePoItem(i, { planned_start_date: e.target.value })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {state?.error && <div className="rounded-md border border-alert/30 bg-alert/5 px-3 py-2 text-sm text-alert">{state.error}</div>}

      <button
        type="submit"
        disabled={isSaving || draft.po_items.length === 0}
        className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-graphite-900 hover:bg-canvas disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save as Draft"}
      </button>
    </form>
  );
}

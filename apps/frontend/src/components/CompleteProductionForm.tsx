"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ManufactureItemRow } from "@/lib/actions/workOrderManufacture";

export type ProductionFormState = { error?: string } | undefined;

const cell = "px-3 py-2";
const plainTableWrap = "overflow-x-auto rounded-xl border border-border bg-surface";
const plainTableHead = "border-b border-border bg-canvas text-graphite-500";

/**
 * Review-and-submit screen for a Manufacture Stock Entry (MFG-CLOSE-1). Unlike
 * `MaterialTransferForm`, every row here is read-only: ERPNext's own `make_stock_entry`
 * (`purpose: "Manufacture"`) computes raw-material consumption, the finished-goods row, and any
 * scrap/co-product rows entirely from the BOM scaled to `fgCompletedQty` — there is no per-row
 * client editing surface and no "additional item" concept for this purpose (source-confirmed,
 * see `workOrderManufacture.ts`'s doc comment). The only real user input is the production
 * quantity, chosen on the page above this component (which re-previews via a full page
 * navigation — `?qty=`) and optional remarks; both forms below submit the exact same
 * server-computed `items` the page already fetched, re-verified fresh server-side in
 * `actions.ts` regardless.
 */
export function CompleteProductionForm({
  workOrder,
  items,
  fgCompletedQty,
  processLossQty,
  saveDraftAction,
  submitAction,
}: {
  workOrder: {
    name: string;
    production_item: string;
    item_name?: string;
    qty: number;
    producedQty: number;
    bom_no: string;
    fromWarehouse: string | null;
    toWarehouse: string | null;
  };
  items: ManufactureItemRow[];
  fgCompletedQty: number;
  processLossQty: number;
  saveDraftAction: (state: ProductionFormState, formData: FormData) => Promise<ProductionFormState>;
  submitAction: (state: ProductionFormState, formData: FormData) => Promise<ProductionFormState>;
}) {
  const [draftState, draftFormAction, isDraftPending] = useActionState<ProductionFormState, FormData>(
    saveDraftAction,
    undefined,
  );
  const [submitState, submitFormAction, isSubmitPending] = useActionState<ProductionFormState, FormData>(
    submitAction,
    undefined,
  );
  const [remarks, setRemarks] = useState("");

  const finishedGoodRows = items.filter((r) => r.is_finished_item);
  const scrapRows = items.filter((r) => !r.is_finished_item && r.secondary_item_type === "Scrap");
  const rawMaterialRows = items.filter((r) => !r.is_finished_item && r.secondary_item_type !== "Scrap");

  const today = new Date().toISOString().slice(0, 10);

  // Plain JSX, not a nested component function (react-hooks/static-components — see
  // MaterialTransferForm.tsx's identical note). Rendered into both forms so Save Draft / Submit
  // Production each post the same payload without duplicating the field list.
  const hiddenFields = (
    <>
      <input type="hidden" name="posting_date" value={today} />
      <input type="hidden" name="remarks" value={remarks} />
      <input type="hidden" name="fg_completed_qty" value={fgCompletedQty} />
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
            <dt className="text-graphite-500">Work Order Qty</dt>
            <dd className="font-mono text-graphite-900">{workOrder.qty}</dd>
          </div>
          <div>
            <dt className="text-graphite-500">Produced So Far</dt>
            <dd className="font-mono text-graphite-900">{workOrder.producedQty}</dd>
          </div>
          <div>
            <dt className="text-graphite-500">Completing Now</dt>
            <dd className="font-mono font-semibold text-signal">{fgCompletedQty}</dd>
          </div>
          <div>
            <dt className="text-graphite-500">BOM</dt>
            <dd className="font-mono text-graphite-900">
              <Link href={`/master-data/boms/${encodeURIComponent(workOrder.bom_no)}`} className="text-signal hover:underline">
                {workOrder.bom_no}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-graphite-500">From</dt>
            <dd className="text-graphite-900">{workOrder.fromWarehouse || "—"}</dd>
          </div>
          <div>
            <dt className="text-graphite-500">To</dt>
            <dd className="text-graphite-900">{workOrder.toWarehouse || "—"}</dd>
          </div>
          {processLossQty > 0 && (
            <div>
              <dt className="text-graphite-500">Process Loss</dt>
              <dd className="font-mono text-alert">{processLossQty}</dd>
            </div>
          )}
        </dl>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-graphite-900">Raw Materials to Consume</p>
        <div className={plainTableWrap}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={plainTableHead}>
                <th className={`${cell} font-semibold`}>Item</th>
                <th className={`${cell} text-right font-semibold`}>Qty</th>
                <th className={`${cell} font-semibold`}>Source Warehouse</th>
              </tr>
            </thead>
            <tbody>
              {rawMaterialRows.map((r, i) => (
                <tr key={`${r.item_code}-${i}`} className="border-b border-border last:border-0">
                  <td className={cell}>
                    <span className="text-graphite-900">
                      {r.item_code} — {r.item_name}
                    </span>
                  </td>
                  <td className={`${cell} text-right font-mono tabular-nums`}>
                    {r.qty} {r.uom}
                  </td>
                  <td className={cell}>{r.s_warehouse || "—"}</td>
                </tr>
              ))}
              {rawMaterialRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-graphite-500">
                    No raw materials on this production entry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-xs text-graphite-500">
          Computed by ERPNext from the BOM — quantities, warehouses, and valuation are not editable here.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-graphite-900">Finished Good to Receive</p>
        <div className={plainTableWrap}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={plainTableHead}>
                <th className={`${cell} font-semibold`}>Item</th>
                <th className={`${cell} text-right font-semibold`}>Qty</th>
                <th className={`${cell} font-semibold`}>Target Warehouse</th>
              </tr>
            </thead>
            <tbody>
              {finishedGoodRows.map((r, i) => (
                <tr key={`${r.item_code}-${i}`} className="border-b border-border last:border-0">
                  <td className={cell}>
                    <span className="text-graphite-900">
                      {r.item_code} — {r.item_name}
                    </span>
                  </td>
                  <td className={`${cell} text-right font-mono tabular-nums`}>
                    {r.qty} {r.uom}
                  </td>
                  <td className={cell}>{r.t_warehouse || "—"}</td>
                </tr>
              ))}
              {finishedGoodRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-alert">
                    ERPNext did not propose a finished-goods row — do not submit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {scrapRows.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-graphite-900">Scrap</p>
          <div className={plainTableWrap}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={plainTableHead}>
                  <th className={`${cell} font-semibold`}>Item</th>
                  <th className={`${cell} text-right font-semibold`}>Qty</th>
                  <th className={`${cell} font-semibold`}>Target Warehouse</th>
                </tr>
              </thead>
              <tbody>
                {scrapRows.map((r, i) => (
                  <tr key={`${r.item_code}-${i}`} className="border-b border-border last:border-0">
                    <td className={cell}>
                      <span className="mr-2 rounded bg-alert/10 px-1.5 py-0.5 text-xs font-semibold text-alert">
                        SCRAP
                      </span>
                      {r.item_code} — {r.item_name}
                    </td>
                    <td className={`${cell} text-right font-mono tabular-nums`}>
                      {r.qty} {r.uom}
                    </td>
                    <td className={cell}>{r.t_warehouse || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-semibold text-graphite-900">Remarks (optional)</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
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
            disabled={isDraftPending || isSubmitPending}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-graphite-900 hover:bg-canvas disabled:opacity-60"
          >
            {isDraftPending ? "Saving…" : "Save Draft"}
          </button>
        </form>

        <form action={submitFormAction}>
          {hiddenFields}
          <button
            type="submit"
            disabled={isDraftPending || isSubmitPending}
            className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
          >
            {isSubmitPending ? "Completing…" : "Submit Production"}
          </button>
        </form>
      </div>
    </div>
  );
}

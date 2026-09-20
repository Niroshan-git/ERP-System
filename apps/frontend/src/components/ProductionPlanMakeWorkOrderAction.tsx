"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { makeWorkOrderAction, type MakeWorkOrderResult } from "@/lib/actions/productionPlanWorkOrder";

function describeError(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}

/**
 * "Make Work Order" (PP-5) — delegates entirely to ERPNext's native `make_work_order` (see
 * `lib/actions/productionPlanWorkOrder.ts` for exactly what that does and doesn't do). One click
 * generates Work Orders — and, if any sub-assembly row is Subcontract-typed, a consolidated
 * Purchase Order — for all outstanding quantity on this plan, matching Desk's own single-click
 * behavior: no per-row selection dialog exists natively (`production_plan.js`'s own handler is
 * a bare `frappe.call({ method: "make_work_order", doc: frm.doc })`, nothing more).
 *
 * The page that renders this only does so when the Production Plan is Submitted and not
 * Completed/Closed — the same Desk-UI convention `production_plan.js refresh()` uses, not a
 * backend-enforced rule. The server action itself only enforces `docstatus === 1`, since that's
 * the one thing ERPNext's own code actually checks.
 */
export function ProductionPlanMakeWorkOrderAction({ name }: { name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MakeWorkOrderResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      try {
        const outcome = await makeWorkOrderAction(name);
        setResult(outcome);
        setConfirming(false);
        router.refresh();
      } catch (e) {
        setError(describeError(e));
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {!confirming ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setResult(null);
            setConfirming(true);
          }}
          disabled={isPending}
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
        >
          Make Work Order
        </button>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
          <span className="text-graphite-900">
            Generate Work Orders (ERPNext-native) for all outstanding quantity on this plan?
          </span>
          <button
            type="button"
            onClick={run}
            disabled={isPending}
            className="rounded-md bg-signal px-3 py-1.5 text-xs font-medium text-white hover:bg-signal/90 disabled:opacity-60"
          >
            {isPending ? "Working…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-graphite-900 hover:bg-canvas disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <div className="max-w-md rounded-md border border-alert/30 bg-alert/5 px-3 py-2 text-right text-sm text-alert">
          {error}
        </div>
      )}

      {result && !error && (
        <div className="max-w-md rounded-md border border-border bg-canvas px-3 py-2 text-right text-sm">
          {result.workOrders.length === 0 ? (
            <p className="text-graphite-500">
              No Work Orders were required — all outstanding quantity on this plan is already
              covered by existing Work Orders.
            </p>
          ) : (
            <div>
              <p className="mb-1 text-graphite-900">{result.workOrders.length} Work Order(s) created:</p>
              <ul className="space-y-0.5">
                {result.workOrders.map((wo) => (
                  <li key={wo}>
                    <Link
                      href={`/manufacturing/work-orders/${encodeURIComponent(wo)}`}
                      className="font-mono text-signal hover:underline"
                    >
                      {wo}
                    </Link>
                  </li>
                ))}
              </ul>
              {/* Live-confirmed 2026-09-20 (PP-5): ERPNext's own pending-quantity calculation for
                  this action only nets out *Submitted* Work Orders — a Draft one (the state every
                  Work Order created here starts in) does not count. Clicking "Make Work Order"
                  again before submitting the one(s) just created will generate another full-qty
                  Work Order for the same row, not skip it. This is native ERPNext behavior, not a
                  Ceylon Stack bug — surfaced here since Desk itself gives no such warning. */}
              <p className="mt-2 text-alert">
                These are created as Draft. Submit them (or cancel this plan) before running Make
                Work Order again — ERPNext only excludes Submitted Work Orders from this
                calculation, so re-running it now would create duplicates for the same quantity.
              </p>
            </div>
          )}
          {result.purchaseOrders && result.purchaseOrders.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-graphite-900">
                {result.purchaseOrders.length} subcontracting Purchase Order(s) were also created
                (Subcontract-type sub-assembly rows):
              </p>
              <ul className="space-y-0.5">
                {result.purchaseOrders.map((po) => (
                  <li key={po}>
                    <Link
                      href={`/buying/purchase-orders/${encodeURIComponent(po)}`}
                      className="font-mono text-signal hover:underline"
                    >
                      {po}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

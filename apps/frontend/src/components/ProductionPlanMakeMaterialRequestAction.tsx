"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  makeMaterialRequestAction,
  type MakeMaterialRequestResult,
} from "@/lib/actions/productionPlanMaterialRequest";

function describeError(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}

/**
 * "Make Material Request" (PP-6) — delegates entirely to ERPNext's native `make_material_request`
 * (see `lib/actions/productionPlanMaterialRequest.ts` for exactly what that does and doesn't do).
 * One click generates Material Requests — grouped by (Sales Order, Material Request Type) — for
 * all outstanding requirement quantity on this plan's `mr_items`, matching Desk's own single-click
 * behavior: no per-row selection dialog exists natively.
 *
 * The Draft-vs-submit choice mirrors Desk's own `frappe.confirm("Do you want to submit the
 * material request")` dialog exactly — this app is not inventing a new capability, just
 * reproducing the same native choice with the tradeoff spelled out, since Desk's dialog gives no
 * such explanation.
 *
 * **Why the tradeoff matters (source-confirmed, `erpnext/stock/doctype/material_request/
 * material_request.py`):** `Material Request Plan Item.requested_qty` — the field
 * `make_material_request` nets against on every call (`quantity − requested_qty`) — is only
 * incremented by `Material Request.on_submit()` (via `update_requested_qty_in_production_plan()`,
 * wired through `hooks.py`'s `doc_events`). A Draft Material Request never triggers that hook.
 * Concretely: choosing "Keep as Draft" and then clicking this action again before submitting the
 * Material Request(s) it just created will generate a full duplicate for the same requirement —
 * not a smaller top-up, not a skip — because `requested_qty` never moved. Choosing "Submit
 * immediately" runs `on_submit()` in the same request, updating `requested_qty` right away, so a
 * second click correctly sees the demand as covered. This is the same class of native
 * duplicate-generation gap PP-5 found for Work Order (`get_committed_quantities()` only counting
 * Submitted rows) — surfaced here as an honest warning rather than a client-side locking
 * framework, per the same package-brief instruction PP-5 followed.
 */
export function ProductionPlanMakeMaterialRequestAction({ name }: { name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MakeMaterialRequestResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(submit: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        const outcome = await makeMaterialRequestAction(name, submit);
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
          Make Material Request
        </button>
      ) : (
        <div className="flex max-w-md flex-col gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
          <span className="text-graphite-900">
            Generate Material Request(s) (ERPNext-native) for all outstanding requirement quantity
            on this plan&apos;s Material Requirements?
          </span>
          <p className="text-xs text-graphite-500">
            <strong>Keep as Draft</strong> is reversible, but re-running this action before
            submitting the created Material Request(s) will duplicate the requested quantity —
            ERPNext only updates the requested-qty counter on submit.{" "}
            <strong>Submit immediately</strong> avoids that duplicate risk but creates a real
            Submitted business document right away.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-graphite-900 hover:bg-canvas disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => run(false)}
              disabled={isPending}
              className="rounded-md border border-signal px-3 py-1.5 text-xs font-medium text-signal hover:bg-signal/10 disabled:opacity-60"
            >
              {isPending ? "Working…" : "Keep as Draft"}
            </button>
            <button
              type="button"
              onClick={() => run(true)}
              disabled={isPending}
              className="rounded-md bg-signal px-3 py-1.5 text-xs font-medium text-white hover:bg-signal/90 disabled:opacity-60"
            >
              {isPending ? "Working…" : "Submit immediately"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-md rounded-md border border-alert/30 bg-alert/5 px-3 py-2 text-right text-sm text-alert">
          {error}
        </div>
      )}

      {result && !error && (
        <div className="max-w-md rounded-md border border-border bg-canvas px-3 py-2 text-right text-sm">
          {result.materialRequests.length === 0 ? (
            <p className="text-graphite-500">
              No Material Requests were created — all requirement quantity on this plan is already
              covered by existing Material Requests.
            </p>
          ) : (
            <div>
              <p className="mb-1 text-graphite-900">
                {result.materialRequests.length} Material Request(s) created (
                {result.submitted ? "Submitted" : "Draft"}):
              </p>
              <ul className="space-y-0.5">
                {result.materialRequests.map((mr) => (
                  <li key={mr}>
                    <Link
                      href={`/buying/material-requests/${encodeURIComponent(mr)}`}
                      className="font-mono text-signal hover:underline"
                    >
                      {mr}
                    </Link>
                  </li>
                ))}
              </ul>
              {!result.submitted && (
                <p className="mt-2 text-alert">
                  These are Draft. Submit them (or cancel this plan) before running Make Material
                  Request again — re-running it now would create duplicates for the same
                  requirement quantity (ERPNext only counts submitted requests as already
                  requested).
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

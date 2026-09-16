"use client";

import { useActionState, useState } from "react";
import { LineItemsEditor, type LineRow } from "@/components/LineItemsEditor";
import type { ItemOption } from "@/lib/actions/itemLookup";

export type StockEntryFormState = { error?: string } | undefined;

const PURPOSES = ["Material Issue", "Material Receipt", "Material Transfer"] as const;
type Purpose = (typeof PURPOSES)[number];

/**
 * Bespoke form for Stock Entry (one of the two new components this build adds — see the
 * plan). Purpose drives which warehouse field(s) show and how LineItemsEditor behaves:
 *
 * - Rate: shown only for Material Receipt (`showRate`) — Material Issue/Transfer let
 *   ERPNext compute `basic_rate` itself from existing stock valuation, so showing an
 *   editable Rate column for those would be misleading (see actions.ts's doc comment for
 *   the full reasoning).
 * - Batch/serial picker: LineItemsEditor only shows its picker button when a
 *   `defaultWarehouse` is passed in. That's passed for Material Issue/Material Transfer
 *   (the source warehouse — allocating *existing* stock out) and deliberately withheld for
 *   Material Receipt (new stock has no existing batches/serials to allocate against; a
 *   FIFO/auto-suggest picker doesn't make sense for inbound stock). Inbound batch/serial
 *   capture is out of scope for v1 rather than force-fit into a picker built for the
 *   opposite direction — see PROGRESS.md.
 * - The line items table itself remounts (`key={purpose}-${fromWarehouse}`) whenever
 *   purpose or the source warehouse changes, so a mid-edit purpose switch always starts
 *   from a clean set of rows re-initialized against the *current* warehouse default,
 *   instead of silently keeping stale rows tagged with a no-longer-relevant warehouse.
 */
export function StockEntryForm({
  action,
  itemOptions,
  companies,
  warehouses,
  initial,
}: {
  action: (state: StockEntryFormState, formData: FormData) => Promise<StockEntryFormState>;
  itemOptions: ItemOption[];
  companies: string[];
  warehouses: string[];
  initial?: {
    company: string;
    posting_date: string;
    purpose: string;
    from_warehouse?: string;
    to_warehouse?: string;
    items: LineRow[];
  };
}) {
  const [state, formAction, isPending] = useActionState<StockEntryFormState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  const [purpose, setPurpose] = useState<Purpose>((initial?.purpose as Purpose) || "Material Issue");
  const [fromWarehouse, setFromWarehouse] = useState(initial?.from_warehouse ?? "");
  const [toWarehouse, setToWarehouse] = useState(initial?.to_warehouse ?? "");

  const needsFrom = purpose === "Material Issue" || purpose === "Material Transfer";
  const needsTo = purpose === "Material Receipt" || purpose === "Material Transfer";
  const showRate = purpose === "Material Receipt";
  // Source warehouse is the only one LineItemsEditor's single `defaultWarehouse` prop can
  // reach — see this component's own doc comment and actions.ts's warehouse-wiring note.
  const lineDefaultWarehouse = needsFrom ? fromWarehouse || undefined : undefined;

  return (
    <form action={formAction} className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="company" className="mb-1 block text-sm font-medium text-graphite-900">
            Company
          </label>
          <select
            id="company"
            name="company"
            required
            defaultValue={initial?.company ?? companies[0]}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          >
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="posting_date" className="mb-1 block text-sm font-medium text-graphite-900">
            Posting date
          </label>
          <input
            type="date"
            id="posting_date"
            name="posting_date"
            required
            defaultValue={initial?.posting_date ?? today}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
      </div>

      <div>
        <label htmlFor="purpose" className="mb-1 block text-sm font-medium text-graphite-900">
          Purpose
        </label>
        <select
          id="purpose"
          name="purpose"
          required
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as Purpose)}
          className="w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        >
          {PURPOSES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {needsFrom && (
          <div>
            <label htmlFor="from_warehouse" className="mb-1 block text-sm font-medium text-graphite-900">
              Source warehouse
            </label>
            <select
              id="from_warehouse"
              name="from_warehouse"
              required
              value={fromWarehouse}
              onChange={(e) => setFromWarehouse(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            >
              <option value="">Select…</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        )}
        {needsTo && (
          <div>
            <label htmlFor="to_warehouse" className="mb-1 block text-sm font-medium text-graphite-900">
              Target warehouse
            </label>
            <select
              id="to_warehouse"
              name="to_warehouse"
              required
              value={toWarehouse}
              onChange={(e) => setToWarehouse(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            >
              <option value="">Select…</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {purpose === "Material Transfer" && (
        <p className="text-xs text-graphite-500">
          Target warehouse is applied to every line uniformly — this app doesn&apos;t yet offer
          per-line target-warehouse picking.
        </p>
      )}

      <div>
        <p className="mb-1 text-sm font-medium text-graphite-900">Items</p>
        <LineItemsEditor
          key={`${purpose}:${fromWarehouse}`}
          fieldName="items"
          itemOptions={itemOptions}
          initialRows={initial?.items}
          currency=""
          defaultWarehouse={lineDefaultWarehouse}
          showRate={showRate}
        />
      </div>
      {purpose === "Material Receipt" && (
        <p className="text-xs text-graphite-500">
          Batch/serial capture for received stock isn&apos;t offered in this form yet — add
          batches/serials via the Batches/Serial Nos screens afterward if needed.
        </p>
      )}

      {state?.error && <p className="text-sm text-alert">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

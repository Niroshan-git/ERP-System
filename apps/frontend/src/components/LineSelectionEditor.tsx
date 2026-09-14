"use client";

import { useActionState, useState } from "react";

export type SelectableLineRow = {
  /** The source child-table row's own `name` (Quotation Item's/Sales Order Item's docname) —
   * carried back to the caller so it can re-derive item data itself, not trust the client. */
  reference: string;
  item_code: string;
  item_name: string;
  uom: string;
  rate: number;
  /** The line's own original qty, shown for context only. */
  originalQty: number;
  /** original qty minus whatever's already been fulfilled (ordered/invoiced) against this line —
   * computed server-side from ERPNext's own real fields before this component ever renders. */
  remainingQty: number;
  /** Optional label for which source document this row came from (e.g. a Quotation name) —
   * only meaningful/shown when rows are combined from more than one source document, like
   * CopyFromQuotationPanel's multi-quotation selection. Unset for the single-source Phase 1
   * routes, which don't need it. */
  sourceLabel?: string;
};

/** One selected row, qty > 0 only — returned to the caller in "confirm" mode. */
export type ConfirmedLineRow = {
  reference: string;
  item_code: string;
  item_name: string;
  uom: string;
  rate: number;
  qty: number;
  /** Carried straight through from the matching SelectableLineRow's sourceLabel, so a
   * confirm-mode caller combining rows from more than one source document (e.g.
   * CopyFromQuotationPanel's multi-quotation selection) knows which source each
   * confirmed row actually came from. */
  sourceLabel?: string;
};

type SelectionState = { error?: string } | undefined;

async function noopSelectionAction(): Promise<SelectionState> {
  return undefined;
}

type SubmitModeProps = {
  mode?: "submit";
  /** Server action this form posts to — the Phase 1 "select lines, then ERPNext-create
   * immediately" flow (/sales/quotations/[name]/create-order, /sales/orders/[name]/create-invoice). */
  action: (state: SelectionState, formData: FormData) => Promise<SelectionState>;
};

type ConfirmModeProps = {
  mode: "confirm";
  /** Local, synchronous callback instead of a server action — used when the selection just
   * needs to populate an in-progress form the user hasn't saved yet (the "Copy From
   * Quotation" flow on the New Sales Order page), not create anything in ERPNext directly. */
  onConfirm: (rows: ConfirmedLineRow[]) => void;
};

type LineSelectionEditorProps = (SubmitModeProps | ConfirmModeProps) & {
  rows: SelectableLineRow[];
  currency: string;
  submitLabel: string;
  pendingLabel?: string;
};

/**
 * Sibling to LineItemsEditor.tsx, for the "select which lines & how much" step in front of a
 * partial-fulfillment flow. Item/UOM/rate are read-only here — only qty is editable, capped at
 * each line's own remainingQty. Rows already fully fulfilled (remainingQty <= 0) are shown
 * disabled rather than hidden, so it's clear the line isn't being silently dropped.
 *
 * Two modes:
 * - "submit" (default) — owns its own <form>/useActionState and posts straight to an ERPNext-
 *   creating server action, same as before. Always the entire content of its own dedicated page.
 * - "confirm" — no <form> of its own (so it can be nested inside a caller's own <form>, e.g.
 *   SalesOrderForm's "Copy From Quotation" panel, without invalid nested-<form> HTML), and
 *   "submitLabel" just calls `onConfirm` with the selected rows directly instead of posting
 *   anywhere.
 */
export function LineSelectionEditor(props: LineSelectionEditorProps) {
  const { rows, currency, submitLabel } = props;
  const isConfirmMode = props.mode === "confirm";
  const pendingLabel = props.pendingLabel ?? "Working…";

  // Always called unconditionally (rules of hooks) — in confirm mode it's never actually
  // triggered, since the form has no `action` and the button is type="button".
  const [state, formAction, isPending] = useActionState<SelectionState, FormData>(
    isConfirmMode ? noopSelectionAction : props.action,
    undefined,
  );

  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(rows.map((r) => [r.reference, Math.max(r.remainingQty, 0)])),
  );

  function updateQty(reference: string, value: number, max: number) {
    const clamped = Math.min(Math.max(value, 0), max);
    setQtys((prev) => ({ ...prev, [reference]: clamped }));
  }

  const selection: ConfirmedLineRow[] = rows
    .map((r) => ({
      reference: r.reference,
      item_code: r.item_code,
      item_name: r.item_name,
      uom: r.uom,
      rate: r.rate,
      sourceLabel: r.sourceLabel,
      qty: qtys[r.reference] ?? 0,
    }))
    .filter((r) => r.qty > 0);

  const total = selection.reduce((sum, r) => sum + r.qty * r.rate, 0);

  const table = (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-canvas text-graphite-500">
            <th className="px-3 py-2 font-semibold">Item</th>
            <th className="px-3 py-2 font-semibold">Original qty</th>
            <th className="px-3 py-2 font-semibold">Remaining</th>
            <th className="px-3 py-2 font-semibold">Qty to take</th>
            <th className="px-3 py-2 font-semibold">Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const remaining = Math.max(row.remainingQty, 0);
            const fulfilled = remaining <= 0;
            return (
              <tr key={row.reference} className={`border-b border-border last:border-0 ${fulfilled ? "opacity-50" : ""}`}>
                <td className="px-3 py-2 text-graphite-900">
                  {row.item_code} — {row.item_name}
                  {fulfilled && <span className="ml-2 text-xs text-graphite-500">(fully fulfilled)</span>}
                  {row.sourceLabel && (
                    <div className="font-mono text-xs text-graphite-500">from {row.sourceLabel}</div>
                  )}
                </td>
                <td className="px-3 py-2 font-mono tabular-nums text-graphite-500">{row.originalQty}</td>
                <td className="px-3 py-2 font-mono tabular-nums text-graphite-500">{remaining}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max={remaining}
                      step="any"
                      disabled={fulfilled}
                      value={qtys[row.reference] ?? 0}
                      onChange={(e) => updateQty(row.reference, Number(e.target.value) || 0, remaining)}
                      className="w-24 rounded-md border border-border px-2 py-1.5 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal disabled:bg-canvas disabled:text-graphite-500"
                    />
                    <span className="font-mono text-xs text-graphite-500">{row.uom}</span>
                  </div>
                </td>
                <td className="px-3 py-2 font-mono tabular-nums text-graphite-500">{row.rate.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const footer = (
    <>
      <p className="font-mono text-sm tabular-nums text-graphite-500">
        Estimated total: {total.toFixed(2)} {currency}
      </p>
      <p className="text-xs text-graphite-500">
        Rate and item details come from the source document and aren&apos;t editable here — only quantity, capped at
        what&apos;s actually left on each line.{" "}
        {isConfirmMode
          ? "You can still add, remove, or edit lines after applying this to the order below."
          : "ERPNext computes the saved total on save."}
      </p>

      {!isConfirmMode && state?.error && <p className="text-sm text-alert">{state.error}</p>}

      <button
        type={isConfirmMode ? "button" : "submit"}
        onClick={isConfirmMode ? () => props.onConfirm(selection) : undefined}
        disabled={(!isConfirmMode && isPending) || selection.length === 0}
        className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
      >
        {!isConfirmMode && isPending ? pendingLabel : submitLabel}
      </button>
    </>
  );

  if (isConfirmMode) {
    // No <form> here — this renders inside the caller's own <form> (SalesOrderForm), and
    // HTML doesn't allow nested <form> elements.
    return (
      <div className="max-w-3xl space-y-4">
        {table}
        {footer}
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-3xl space-y-4">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(selection.map(({ reference, qty }) => ({ reference, qty })))}
        readOnly
      />
      {table}
      {footer}
    </form>
  );
}

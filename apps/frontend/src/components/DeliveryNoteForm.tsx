"use client";

import { useActionState } from "react";
import { LineItemsEditor, type LineRow } from "@/components/LineItemsEditor";
import type { ItemOption } from "@/lib/actions/itemLookup";

export type DeliveryNoteFormState = { error?: string } | undefined;

/**
 * Mirrors SalesInvoiceForm.tsx's shape almost exactly — Delivery Note's own transaction
 * date field is `posting_date` (confirmed live via the DocType meta), same as Sales
 * Invoice, not `transaction_date`/`delivery_date` like Sales Order. `warehouse` is still a
 * single, uniform per-document default (see delivery-notes/actions.ts's
 * buildDeliveryNoteFields, same pattern as buildSalesOrderFields) — this app doesn't offer
 * per-line warehouse picking — but that default is now threaded down into every
 * LineItemsEditor row (`defaultWarehouse` below) so the Phase 2C/2D batch/serial picker and
 * live Bin stock badge know which warehouse to query.
 */
export function DeliveryNoteForm({
  action,
  itemOptions,
  customers,
  companies,
  currency,
  sellingPriceList,
  defaultWarehouse,
  initial,
}: {
  action: (state: DeliveryNoteFormState, formData: FormData) => Promise<DeliveryNoteFormState>;
  itemOptions: ItemOption[];
  customers: string[] | null;
  companies: string[];
  currency: string;
  sellingPriceList: string;
  /** The company's default warehouse (see salesDefaults.ts) — threaded down to
   * LineItemsEditor so it can default each line's `warehouse` and turn on the batch/serial
   * picker + live stock badge (Phase 2C/2D). */
  defaultWarehouse?: string;
  initial?: {
    customer: string;
    posting_date: string;
    company: string;
    items: LineRow[];
  };
}) {
  const [state, formAction, isPending] = useActionState<DeliveryNoteFormState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form id="delivery-note-form" action={formAction} className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="customer" className="mb-1 block text-sm font-medium text-graphite-900">
            Customer
          </label>
          {customers ? (
            <select
              id="customer"
              name="customer"
              required
              defaultValue={initial?.customer ?? ""}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            >
              <option value="">Select…</option>
              {customers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="customer"
              name="customer"
              required
              defaultValue={initial?.customer}
              placeholder="Must match an existing Customer"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          )}
        </div>

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
          className="w-40 rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-graphite-900">Items</p>
        <LineItemsEditor
          fieldName="items"
          itemOptions={itemOptions}
          initialRows={initial?.items}
          currency={currency}
          defaultWarehouse={defaultWarehouse}
        />
      </div>

      <p className="text-xs text-graphite-500">
        Price list <span className="font-mono">{sellingPriceList}</span> · warehouse is applied to every line from
        the company&apos;s own default automatically on save.
      </p>

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

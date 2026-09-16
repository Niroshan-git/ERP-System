"use client";

import { useActionState } from "react";
import { LineItemsEditor, type LineRow } from "@/components/LineItemsEditor";
import type { ItemOption } from "@/lib/actions/itemLookup";

type FormState = { error?: string } | undefined;

export function CreateSupplierQuotationForm({
  action,
  suppliers,
  itemOptions,
  initialItems,
  currencies,
  defaultCurrency,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  suppliers: string[];
  itemOptions: ItemOption[];
  initialItems: LineRow[];
  currencies: string[] | null;
  defaultCurrency?: string;
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="supplier" className="mb-1 block text-sm font-medium text-graphite-900">
            Supplier
          </label>
          <select
            id="supplier"
            name="supplier"
            required
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          >
            <option value="">Select…</option>
            {suppliers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="currency" className="mb-1 block text-sm font-medium text-graphite-900">
            Currency
          </label>
          {currencies ? (
            <select
              id="currency"
              name="currency"
              required
              defaultValue={defaultCurrency ?? currencies[0] ?? ""}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="currency"
              name="currency"
              required
              defaultValue={defaultCurrency ?? ""}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="transaction_date" className="mb-1 block text-sm font-medium text-graphite-900">
            Date
          </label>
          <input
            type="date"
            id="transaction_date"
            name="transaction_date"
            required
            defaultValue={today}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div>
          <label htmlFor="valid_till" className="mb-1 block text-sm font-medium text-graphite-900">
            Valid till
          </label>
          <input
            type="date"
            id="valid_till"
            name="valid_till"
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div>
          <label htmlFor="conversion_rate" className="mb-1 block text-sm font-medium text-graphite-900">
            Conversion rate
          </label>
          <input
            type="number"
            step="any"
            min="0"
            id="conversion_rate"
            name="conversion_rate"
            required
            defaultValue={1}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-graphite-900">
          Items — enter the rate the supplier actually quoted for each line
        </p>
        <LineItemsEditor
          fieldName="items"
          itemOptions={itemOptions}
          initialRows={initialItems}
          currency={defaultCurrency ?? ""}
        />
      </div>

      {state?.error && <p className="text-sm text-alert">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save Supplier Quotation"}
      </button>
    </form>
  );
}

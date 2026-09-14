"use client";

import { useActionState } from "react";
import { LineItemsEditor, type LineRow } from "@/components/LineItemsEditor";
import type { ItemOption } from "@/lib/actions/itemLookup";

export type QuotationFormState = { error?: string } | undefined;

const ORDER_TYPES = ["Sales", "Maintenance", "Shopping Cart"];

/**
 * quotation_to is always hardcoded to "Customer" by the server action — this
 * tool is Sales-only, not Leads, so it's never exposed as a field here.
 */
export function QuotationForm({
  action,
  itemOptions,
  customers,
  companies,
  currency,
  sellingPriceList,
  initial,
}: {
  action: (state: QuotationFormState, formData: FormData) => Promise<QuotationFormState>;
  itemOptions: ItemOption[];
  customers: string[] | null;
  companies: string[];
  currency: string;
  sellingPriceList: string;
  initial?: {
    party_name: string;
    transaction_date: string;
    valid_till?: string;
    order_type: string;
    company: string;
    items: LineRow[];
  };
}) {
  const [state, formAction, isPending] = useActionState<QuotationFormState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form id="quotation-form" action={formAction} className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="party_name" className="mb-1 block text-sm font-medium text-graphite-900">
            Customer
          </label>
          {customers ? (
            <select
              id="party_name"
              name="party_name"
              required
              defaultValue={initial?.party_name ?? ""}
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
              id="party_name"
              name="party_name"
              required
              defaultValue={initial?.party_name}
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
            defaultValue={initial?.transaction_date ?? today}
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
            defaultValue={initial?.valid_till ?? ""}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div>
          <label htmlFor="order_type" className="mb-1 block text-sm font-medium text-graphite-900">
            Order type
          </label>
          <select
            id="order_type"
            name="order_type"
            required
            defaultValue={initial?.order_type ?? "Sales"}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          >
            {ORDER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-graphite-900">Items</p>
        <LineItemsEditor fieldName="items" itemOptions={itemOptions} initialRows={initial?.items} currency={currency} />
      </div>

      <p className="text-xs text-graphite-500">
        Price list <span className="font-mono">{sellingPriceList}</span> · currency and conversion rates follow the
        selected company&apos;s own defaults automatically on save.
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

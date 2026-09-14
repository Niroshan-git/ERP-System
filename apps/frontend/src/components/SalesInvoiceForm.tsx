"use client";

import { useActionState } from "react";
import { LineItemsEditor, type LineRow } from "@/components/LineItemsEditor";
import type { ItemOption } from "@/lib/actions/itemLookup";

export type SalesInvoiceFormState = { error?: string } | undefined;

/**
 * debit_to/income_account/cost_center are resolved server-side from
 * getSellingDefaults() (see actions.ts) and applied uniformly — not exposed
 * as fields here, per the Sales Invoice spec.
 */
export function SalesInvoiceForm({
  action,
  itemOptions,
  customers,
  companies,
  currency,
  sellingPriceList,
  debitToAccount,
  initial,
}: {
  action: (state: SalesInvoiceFormState, formData: FormData) => Promise<SalesInvoiceFormState>;
  itemOptions: ItemOption[];
  customers: string[] | null;
  companies: string[];
  currency: string;
  sellingPriceList: string;
  debitToAccount?: string;
  initial?: {
    customer: string;
    posting_date: string;
    company: string;
    items: LineRow[];
  };
}) {
  const [state, formAction, isPending] = useActionState<SalesInvoiceFormState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form id="sales-invoice-form" action={formAction} className="max-w-3xl space-y-4">
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
        <LineItemsEditor fieldName="items" itemOptions={itemOptions} initialRows={initial?.items} currency={currency} />
      </div>

      <p className="text-xs text-graphite-500">
        Price list <span className="font-mono">{sellingPriceList}</span> · receivable account{" "}
        <span className="font-mono">{debitToAccount ?? "not configured"}</span> · income account and cost center are
        applied to every line from the company&apos;s own defaults automatically on save.
      </p>
      {!debitToAccount && (
        <p className="text-sm text-alert">
          Company has no default receivable account configured in ERPNext — set one before invoicing.
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

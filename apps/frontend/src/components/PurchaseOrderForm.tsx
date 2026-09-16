"use client";

import { useActionState, useState } from "react";
import { LineItemsEditor, type LineRow } from "@/components/LineItemsEditor";
import type { ItemOption } from "@/lib/actions/itemLookup";

export type PurchaseOrderFormState = { error?: string } | undefined;

/**
 * Mirrors SalesOrderForm.tsx's shape, minus everything out of scope for this build: no
 * "Copy From" panel (Purchase Order is standalone-creatable only in this app — see
 * purchase-orders/new/page.tsx's own doc comment), no pricingContext (Pricing Rule
 * resolution is a Selling-only concept in this app so far), no DiscountFields (not among
 * the live-verified Purchase Order fields this build was scoped against). `currency`/
 * `conversion_rate`/`warehouse` are resolved server-side from getBuyingDefaults() and
 * applied uniformly, same pattern as buildSalesOrderFields — not exposed as fields here.
 *
 * Adds `showScheduleDate` on LineItemsEditor — Purchase Order Item's own per-line
 * `schedule_date` ("Required By") is a real, required field (confirmed via the live DocType
 * JSON), same shape MaterialRequestForm.tsx already established for Material Request Item.
 */
export function PurchaseOrderForm({
  action,
  itemOptions,
  suppliers,
  companies,
  currency,
  initial,
}: {
  action: (state: PurchaseOrderFormState, formData: FormData) => Promise<PurchaseOrderFormState>;
  itemOptions: ItemOption[];
  suppliers: string[] | null;
  companies: string[];
  currency: string;
  initial?: {
    supplier: string;
    transaction_date: string;
    schedule_date?: string;
    company: string;
    items: LineRow[];
  };
}) {
  const [state, formAction, isPending] = useActionState<PurchaseOrderFormState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);
  const [scheduleDate, setScheduleDate] = useState(initial?.schedule_date ?? "");

  return (
    <form id="purchase-order-form" action={formAction} className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="supplier" className="mb-1 block text-sm font-medium text-graphite-900">
            Supplier
          </label>
          {suppliers ? (
            <select
              id="supplier"
              name="supplier"
              required
              defaultValue={initial?.supplier ?? ""}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            >
              <option value="">Select…</option>
              {suppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="supplier"
              name="supplier"
              required
              defaultValue={initial?.supplier}
              placeholder="Must match an existing Supplier"
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

      <div className="grid grid-cols-2 gap-4">
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
          <label htmlFor="schedule_date" className="mb-1 block text-sm font-medium text-graphite-900">
            Required by
          </label>
          <input
            type="date"
            id="schedule_date"
            name="schedule_date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
          <p className="mt-1 text-xs text-graphite-500">Used as the default for new item rows below.</p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-graphite-900">Items</p>
        <LineItemsEditor
          fieldName="items"
          itemOptions={itemOptions}
          initialRows={initial?.items}
          currency={currency}
          showScheduleDate
          defaultScheduleDate={scheduleDate}
        />
      </div>

      <p className="text-xs text-graphite-500">
        Currency and conversion rate follow the selected company&apos;s own defaults automatically on save; warehouse
        is applied to every line from the company&apos;s own default the same way.
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

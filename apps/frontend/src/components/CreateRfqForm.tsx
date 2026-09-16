"use client";

import { useActionState } from "react";
import { SupplierMultiSelect } from "@/components/SupplierMultiSelect";

type FormState = { error?: string } | undefined;

type ItemForDisplay = { name: string; item_code: string; item_name: string; qty: number; uom: string };

/**
 * "Create RFQ" step, front of buying/material-requests/[name]/create-rfq/page.tsx — needs
 * its own useActionState (for inline error rendering, same as every other doc-creating
 * form in this app) but the page itself is a server component doing the data fetching, so
 * the interactive form is split out here the same way LineSelectionEditor is split out of
 * its own page.
 */
export function CreateRfqForm({
  action,
  materialRequestName,
  items,
  suppliers,
  companies,
  defaultCompany,
  defaultScheduleDate,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  materialRequestName: string;
  items: ItemForDisplay[];
  suppliers: string[] | null;
  companies: string[];
  defaultCompany?: string;
  defaultScheduleDate?: string;
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="max-w-3xl space-y-4">
      <div>
        <label htmlFor="company" className="mb-1 block text-sm font-medium text-graphite-900">
          Company
        </label>
        <select
          id="company"
          name="company"
          required
          defaultValue={defaultCompany ?? companies[0] ?? ""}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        >
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
            defaultValue={today}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div>
          <label htmlFor="schedule_date" className="mb-1 block text-sm font-medium text-graphite-900">
            Required date
          </label>
          <input
            type="date"
            id="schedule_date"
            name="schedule_date"
            defaultValue={defaultScheduleDate ?? ""}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-graphite-900">Suppliers to send to</p>
        <SupplierMultiSelect name="suppliers" suppliers={suppliers} />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-graphite-900">Items (copied from {materialRequestName})</p>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-canvas text-graphite-500">
                <th className="px-3 py-2 font-semibold">Item</th>
                <th className="px-3 py-2 text-right font-semibold">Qty</th>
                <th className="px-3 py-2 font-semibold">UOM</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.name} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-graphite-900">
                    {item.item_code} — {item.item_name}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{item.qty}</td>
                  <td className="px-3 py-2 font-mono text-graphite-500">{item.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {state?.error && <p className="text-sm text-alert">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create RFQ"}
      </button>
    </form>
  );
}

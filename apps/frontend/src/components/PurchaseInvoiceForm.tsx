"use client";

import { useActionState, useState } from "react";
import { LineItemsEditor, type LineRow } from "@/components/LineItemsEditor";
import type { ItemOption } from "@/lib/actions/itemLookup";

export type PurchaseInvoiceFormState = { error?: string } | undefined;

/**
 * Mirrors SalesInvoiceForm.tsx's shape. `credit_to`/expense_account/cost_center are
 * resolved server-side from getBuyingDefaults() and applied uniformly — not exposed as
 * fields here, same "resolved plumbing, not a user-facing field" treatment
 * SalesInvoiceForm already gives debit_to/income_account/cost_center (see
 * buyingDefaults.ts's own doc comment for why these are needed despite not being in the
 * Buying plan's own live-verified Purchase Invoice field list). `is_paid`/`update_stock`
 * are deliberately never exposed either, per the plan's explicit scope.
 */
export function PurchaseInvoiceForm({
  action,
  itemOptions,
  suppliers,
  companies,
  currency,
  payableAccount,
  initial,
}: {
  action: (state: PurchaseInvoiceFormState, formData: FormData) => Promise<PurchaseInvoiceFormState>;
  itemOptions: ItemOption[];
  suppliers: string[] | null;
  companies: string[];
  currency: string;
  payableAccount?: string;
  initial?: {
    supplier: string;
    posting_date: string;
    due_date?: string;
    bill_no?: string;
    bill_date?: string;
    company: string;
    items: LineRow[];
  };
}) {
  const [state, formAction, isPending] = useActionState<PurchaseInvoiceFormState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  const [supplier, setSupplier] = useState(initial?.supplier ?? "");
  const [company, setCompany] = useState(initial?.company ?? companies[0] ?? "");
  const [postingDate, setPostingDate] = useState(initial?.posting_date ?? today);

  return (
    <form id="purchase-invoice-form" action={formAction} className="max-w-3xl space-y-4">
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
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
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
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
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
            value={company}
            onChange={(e) => setCompany(e.target.value)}
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
          <label htmlFor="posting_date" className="mb-1 block text-sm font-medium text-graphite-900">
            Posting date
          </label>
          <input
            type="date"
            id="posting_date"
            name="posting_date"
            required
            value={postingDate}
            onChange={(e) => setPostingDate(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div>
          <label htmlFor="due_date" className="mb-1 block text-sm font-medium text-graphite-900">
            Due date
          </label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            defaultValue={initial?.due_date}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="bill_no" className="mb-1 block text-sm font-medium text-graphite-900">
            Supplier Invoice No.
          </label>
          <input
            id="bill_no"
            name="bill_no"
            defaultValue={initial?.bill_no}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div>
          <label htmlFor="bill_date" className="mb-1 block text-sm font-medium text-graphite-900">
            Supplier Invoice Date
          </label>
          <input
            type="date"
            id="bill_date"
            name="bill_date"
            defaultValue={initial?.bill_date}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-graphite-900">Items</p>
        <LineItemsEditor fieldName="items" itemOptions={itemOptions} initialRows={initial?.items} currency={currency} />
      </div>

      <p className="text-xs text-graphite-500">
        Payable account <span className="font-mono">{payableAccount ?? "not configured"}</span> · expense account and
        cost center are applied to every line from the company&apos;s own defaults automatically on save.
      </p>
      {!payableAccount && (
        <p className="text-sm text-alert">
          Company has no default payable account configured in ERPNext — set one before invoicing.
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

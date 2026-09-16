"use client";

import { useActionState, useState } from "react";
import { LineItemsEditor, type LineRow } from "@/components/LineItemsEditor";
import { DiscountFields } from "@/components/DiscountFields";
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
    apply_discount_on?: string;
    additional_discount_percentage?: number;
    discount_amount?: number;
  };
}) {
  const [state, formAction, isPending] = useActionState<QuotationFormState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  // Controlled so LineItemsEditor's pricingContext can re-resolve Pricing Rules whenever
  // any of these change (see LineItemsEditor's customer-change effect).
  const [party_name, setPartyName] = useState(initial?.party_name ?? "");
  const [company, setCompany] = useState(initial?.company ?? companies[0] ?? "");
  const [transactionDate, setTransactionDate] = useState(initial?.transaction_date ?? today);

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
              value={party_name}
              onChange={(e) => setPartyName(e.target.value)}
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
              value={party_name}
              onChange={(e) => setPartyName(e.target.value)}
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
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
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
        <LineItemsEditor
          fieldName="items"
          itemOptions={itemOptions}
          initialRows={initial?.items}
          currency={currency}
          pricingContext={{
            parentDoctype: "Quotation",
            childDoctype: "Quotation Item",
            customer: party_name,
            company,
            currency,
            priceList: sellingPriceList,
            transactionDate,
          }}
        />
      </div>

      <DiscountFields
        formId="quotation-form"
        currency={currency}
        initial={{
          apply_discount_on: initial?.apply_discount_on,
          additional_discount_percentage: initial?.additional_discount_percentage,
          discount_amount: initial?.discount_amount,
        }}
      />

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

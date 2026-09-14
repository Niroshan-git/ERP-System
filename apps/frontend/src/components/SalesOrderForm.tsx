"use client";

import { useActionState, useState } from "react";
import { LineItemsEditor, type LineRow } from "@/components/LineItemsEditor";
import { CopyFromQuotationPanel, type CopiedQuotationFields } from "@/components/CopyFromQuotationPanel";
import type { ItemOption } from "@/lib/actions/itemLookup";

export type SalesOrderFormState = { error?: string } | undefined;

const ORDER_TYPES = ["Sales", "Maintenance", "Shopping Cart"];

export function SalesOrderForm({
  action,
  itemOptions,
  customers,
  companies,
  currency,
  sellingPriceList,
  initial,
}: {
  action: (state: SalesOrderFormState, formData: FormData) => Promise<SalesOrderFormState>;
  itemOptions: ItemOption[];
  customers: string[] | null;
  companies: string[];
  currency: string;
  sellingPriceList: string;
  initial?: {
    customer: string;
    transaction_date: string;
    delivery_date?: string;
    order_type: string;
    company: string;
    items: LineRow[];
  };
}) {
  const [state, formAction, isPending] = useActionState<SalesOrderFormState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  // "Copy From Quotation" only applies to a brand-new order (the /sales/orders/new page
  // never passes `initial`) — not to editing an already-existing Draft, which reuses this
  // same form component with `initial` set.
  const isNewOrder = !initial;

  const [customer, setCustomer] = useState(initial?.customer ?? "");
  const [company, setCompany] = useState(initial?.company ?? companies[0] ?? "");
  const [copiedItems, setCopiedItems] = useState<LineRow[] | undefined>(initial?.items);
  const [copyVersion, setCopyVersion] = useState(0);
  const [copiedFields, setCopiedFields] = useState<CopiedQuotationFields | null>(null);

  function applyCopiedQuotation(fields: CopiedQuotationFields) {
    setCopiedItems(fields.items);
    setCopyVersion((v) => v + 1);
    setCopiedFields(fields);
  }

  return (
    <form id="sales-order-form" action={formAction} className="max-w-3xl space-y-4">
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
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
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
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
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
            defaultValue={initial?.transaction_date ?? today}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div>
          <label htmlFor="delivery_date" className="mb-1 block text-sm font-medium text-graphite-900">
            Delivery date
          </label>
          <input
            type="date"
            id="delivery_date"
            name="delivery_date"
            required
            defaultValue={initial?.delivery_date ?? today}
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

      {isNewOrder && (
        <div>
          {/* Keyed on both Customer and Company — CopyFromQuotationPanel's own quotation list
              is filtered by Company (ERPNext rejects a Sales Order linked to a Quotation under
              a different Company at save time), so a stale list must reset on either change,
              not just Customer. */}
          <CopyFromQuotationPanel
            key={`${customer}::${company}`}
            customer={customer}
            company={company}
            currency={currency}
            onApply={applyCopiedQuotation}
          />
        </div>
      )}

      {/* Address & Contact / Terms / More Info fields carried over from a copied Quotation —
          this page has no interactive UI for them itself (unlike the edit-existing-order
          detail page's tabs), so they only ever get a value here, via a Copy From apply. */}
      {copiedFields && (
        <>
          <input type="hidden" name="customer_address" value={copiedFields.customer_address ?? ""} />
          <input type="hidden" name="contact_person" value={copiedFields.contact_person ?? ""} />
          <input type="hidden" name="shipping_address_name" value={copiedFields.shipping_address_name ?? ""} />
          <input type="hidden" name="territory" value={copiedFields.territory ?? ""} />
          <input type="hidden" name="customer_group" value={copiedFields.customer_group ?? ""} />
          <input type="hidden" name="tc_name" value={copiedFields.tc_name ?? ""} />
          <input type="hidden" name="terms" value={copiedFields.terms ?? ""} />
          <input type="hidden" name="title" value={copiedFields.title ?? ""} />
        </>
      )}

      <div>
        <p className="mb-1 text-sm font-medium text-graphite-900">Items</p>
        {/* key={copyVersion} forces a remount on every "Copy From Quotation" apply — LineItemsEditor
            owns its row state internally via useState(initialRows), so a changing key is what makes
            it actually pick up newly-copied rows rather than keeping its first-mount state forever. */}
        <LineItemsEditor
          key={copyVersion}
          fieldName="items"
          itemOptions={itemOptions}
          initialRows={copiedItems}
          currency={currency}
        />
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

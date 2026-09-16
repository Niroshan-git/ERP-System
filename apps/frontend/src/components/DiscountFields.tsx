/**
 * Document-level discount fields, shared across Quotation/Sales Order/Sales Invoice — same
 * `form={formId}` convention as AddressContactFields.tsx/TermsFields.tsx (see those files'
 * comments for why), though here it's typically rendered directly inside the Details tab's
 * own <form> (right after the line items, near the totals a user would expect a discount
 * to affect) rather than a separate sibling tab.
 *
 * `apply_discount_on`/`additional_discount_percentage`/`discount_amount` are real, live
 * stored fields on all three doctypes (confirmed via their live DocType JSON — identical
 * shape on all three). ERPNext's own `set_discount_amount()`
 * (erpnext/controllers/taxes_and_totals.py) always overwrites `discount_amount` from
 * `additional_discount_percentage` whenever the latter is non-zero, so a percentage takes
 * priority — both fields are still submitted as-is and ERPNext itself resolves which one
 * actually applies. Leave the percentage at 0 to enter a flat amount directly instead.
 */
export function DiscountFields({
  formId,
  currency,
  initial,
}: {
  formId: string;
  currency: string;
  initial?: {
    apply_discount_on?: string;
    additional_discount_percentage?: number;
    discount_amount?: number;
  };
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-graphite-900">Discount</p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="apply_discount_on" className="mb-1 block text-sm font-medium text-graphite-900">
            Apply discount on
          </label>
          <select
            id="apply_discount_on"
            name="apply_discount_on"
            form={formId}
            defaultValue={initial?.apply_discount_on ?? "Grand Total"}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          >
            <option value="Grand Total">Grand Total</option>
            <option value="Net Total">Net Total</option>
          </select>
        </div>
        <div>
          <label htmlFor="additional_discount_percentage" className="mb-1 block text-sm font-medium text-graphite-900">
            Additional discount %
          </label>
          <input
            type="number"
            id="additional_discount_percentage"
            name="additional_discount_percentage"
            form={formId}
            min="0"
            max="100"
            step="any"
            defaultValue={initial?.additional_discount_percentage ?? ""}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div>
          <label htmlFor="discount_amount" className="mb-1 block text-sm font-medium text-graphite-900">
            Discount amount ({currency})
          </label>
          <input
            type="number"
            id="discount_amount"
            name="discount_amount"
            form={formId}
            min="0"
            step="any"
            defaultValue={initial?.discount_amount ?? ""}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
      </div>
      <p className="mt-1 text-xs text-graphite-500">
        A percentage takes priority — ERPNext recalculates the flat discount amount from it automatically against the
        selected total on save. Leave the percentage at 0 to enter a flat amount directly instead.
      </p>
    </div>
  );
}

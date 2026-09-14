/**
 * Terms tab fields, shared across Quotation/Sales Order/Sales Invoice.
 * Same `form={formId}` convention as AddressContactFields.tsx — see that file's
 * comment for why.
 *
 * `terms` is a Text Editor field in ERPNext; a plain textarea submitting
 * HTML-free plain text is an intentional simplification here, not a rich text
 * editor.
 */
export function TermsFields({
  formId,
  paymentTermsTemplates,
  termsTemplates,
  initial,
}: {
  formId: string;
  paymentTermsTemplates: string[] | null;
  termsTemplates: string[] | null;
  initial?: {
    payment_terms_template?: string;
    tc_name?: string;
    terms?: string;
  };
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <LinkField
          formId={formId}
          id="payment_terms_template"
          label="Payment terms template"
          options={paymentTermsTemplates}
          defaultValue={initial?.payment_terms_template}
        />
        <LinkField
          formId={formId}
          id="tc_name"
          label="Terms and conditions template"
          options={termsTemplates}
          defaultValue={initial?.tc_name}
        />
      </div>

      <div>
        <label htmlFor="terms" className="mb-1 block text-sm font-medium text-graphite-900">
          Terms
        </label>
        <textarea
          id="terms"
          name="terms"
          form={formId}
          rows={6}
          defaultValue={initial?.terms}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
        <p className="mt-1 text-xs text-graphite-500">
          Plain text only — ERPNext&apos;s own Terms field supports rich text; this is a simplified plain-text
          version.
        </p>
      </div>
    </div>
  );
}

function LinkField({
  formId,
  id,
  label,
  options,
  defaultValue,
}: {
  formId: string;
  id: string;
  label: string;
  options: string[] | null;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-graphite-900">
        {label}
      </label>
      {options ? (
        <select
          id={id}
          name={id}
          form={formId}
          defaultValue={defaultValue ?? ""}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        >
          <option value="">— none —</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={id}
          form={formId}
          defaultValue={defaultValue}
          placeholder="Must match an existing value"
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      )}
    </div>
  );
}

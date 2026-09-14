/**
 * Address & Contact tab fields, shared across Quotation/Sales Order/Sales Invoice.
 * Rendered as plain fields (not a <form> of its own) — each input carries a
 * `form` attribute pointing at the id of the doctype's own <form> element
 * (see QuotationForm.tsx etc.) so it submits as part of that single form even
 * though DocTabs renders this tab's content in a separate, sibling <div>.
 *
 * address_display/contact_display are intentionally NOT editable here — ERPNext
 * derives them server-side from the linked Address/Contact record on save.
 */
export function AddressContactFields({
  formId,
  addresses,
  contacts,
  territories,
  customerGroups,
  initial,
}: {
  formId: string;
  addresses: string[] | null;
  contacts: string[] | null;
  territories: string[] | null;
  customerGroups: string[] | null;
  initial?: {
    customer_address?: string;
    contact_person?: string;
    shipping_address_name?: string;
    territory?: string;
    customer_group?: string;
  };
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <LinkField
          formId={formId}
          id="customer_address"
          label="Customer address"
          options={addresses}
          defaultValue={initial?.customer_address}
        />
        <LinkField
          formId={formId}
          id="contact_person"
          label="Contact person"
          options={contacts}
          defaultValue={initial?.contact_person}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <LinkField
          formId={formId}
          id="shipping_address_name"
          label="Shipping address"
          options={addresses}
          defaultValue={initial?.shipping_address_name}
        />
        <LinkField
          formId={formId}
          id="territory"
          label="Territory"
          options={territories}
          defaultValue={initial?.territory}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <LinkField
          formId={formId}
          id="customer_group"
          label="Customer group"
          options={customerGroups}
          defaultValue={initial?.customer_group}
        />
      </div>

      <p className="text-xs text-graphite-500">
        Address and contact display text is filled in by ERPNext automatically from the linked records above once
        saved — not editable directly here.
      </p>
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

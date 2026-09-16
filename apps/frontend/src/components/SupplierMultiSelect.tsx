"use client";

/**
 * Plain checkbox multi-select over a Supplier list, submitted as repeated same-name form
 * fields (`formData.getAll(name)`, same technique setQuotationAsLostAction already uses for
 * its lost-reasons checkboxes). Nothing in the existing component library does
 * multi-select-from-a-doctype yet — this is a deliberately lean internal tool (no search,
 * no combobox), not a fork of anything: LinkOrTextField-style checkbox styling, just
 * repeated for a list of options instead of one link field.
 */
export function SupplierMultiSelect({
  name,
  suppliers,
  initial,
}: {
  name: string;
  suppliers: string[] | null;
  initial?: string[];
}) {
  if (!suppliers) {
    return <p className="text-sm text-alert">Could not load the Supplier list.</p>;
  }

  return (
    <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-surface p-2">
      {suppliers.length === 0 && <p className="px-2 py-1 text-sm text-graphite-500">No suppliers found.</p>}
      {suppliers.map((s) => (
        <label key={s} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-canvas">
          <input type="checkbox" name={name} value={s} defaultChecked={initial?.includes(s)} />
          <span className="text-graphite-900">{s}</span>
        </label>
      ))}
    </div>
  );
}

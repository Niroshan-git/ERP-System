import { SavedBanner } from "@/components/SavedBanner";
import { MasterForm, type FieldSpec, type FormState } from "@/components/MasterForm";

/**
 * Shared "Accounting" tab content for the `FIN-1G-D` inheritance UX — used identically by the
 * Item, Item Group, Customer, Customer Group, and Supplier detail pages to surface + edit one
 * company's `Item Default`/`Party Account` child-table row. A plain GET company switcher (a
 * Server Component page can't attach a client-side onChange handler — same pattern
 * `chart-of-accounts/page.tsx`/`account-determination/page.tsx` already established), then
 * `MasterForm` for the row itself.
 */
export function AccountingDefaultsPanel({
  basePath,
  company,
  companies,
  saved,
  fields,
  initial,
  action,
  note,
}: {
  basePath: string;
  company: string;
  companies: string[];
  saved: boolean;
  fields: FieldSpec[];
  initial: Record<string, unknown>;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  note: string;
}) {
  return (
    <div>
      {companies.length > 1 && (
        <form className="mb-4 flex items-center gap-2 text-sm" action={basePath} method="get">
          <input type="hidden" name="tab" value="accounting" />
          <label htmlFor="company" className="text-graphite-500">
            Company
          </label>
          <select
            id="company"
            name="company"
            defaultValue={company}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          >
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-canvas/60">
            Go
          </button>
        </form>
      )}

      <SavedBanner show={saved} />

      <MasterForm action={action} fields={fields} initial={initial} />

      <p className="mt-3 text-xs text-graphite-500">{note}</p>
    </div>
  );
}

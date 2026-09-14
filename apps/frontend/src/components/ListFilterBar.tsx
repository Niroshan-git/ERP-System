/**
 * Filter row above a document list, matching ERPNext's own Desk list view (per-field
 * inputs pinned above the table, plus a Sort dropdown) — read from a screenshot of the
 * real Sales Order list and cross-checked against that doctype's actual filterable
 * fields on the live server. Plain GET `<form>` so it works with no client JS: submitting
 * navigates to the same page with the field values as query params, which each list
 * page's server component reads back via `searchParams` to build the ERPNext filter.
 *
 * Deliberately scoped down from Desk's full filter bar: this only exposes the fixed set
 * of fields each list page configures (matching what's actually useful for that
 * doctype), not Desk's generic "add a filter on any field/any operator" builder — that's
 * a much bigger, mostly power-user feature this headless frontend doesn't need yet.
 */
export type FilterFieldConfig =
  | { type: "text"; name: string; label: string }
  | { type: "date"; name: string; label: string }
  | { type: "select"; name: string; label: string; options: string[] };

export type SortOption = { value: string; label: string };

export function ListFilterBar({
  fields,
  sortOptions,
  values,
}: {
  fields: FilterFieldConfig[];
  sortOptions: SortOption[];
  values: Record<string, string | undefined>;
}) {
  const inputClass =
    "rounded-md border border-border bg-canvas px-2.5 py-1.5 text-sm text-graphite-900 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";

  return (
    <form className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-3">
      {fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-1">
          <span className="text-xs font-medium text-graphite-500">{f.label}</span>
          {f.type === "select" ? (
            <select name={f.name} defaultValue={values[f.name] ?? ""} className={inputClass}>
              <option value="">Any</option>
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type}
              name={f.name}
              defaultValue={values[f.name] ?? ""}
              className={`${inputClass} w-36`}
            />
          )}
        </label>
      ))}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-graphite-500">Sort</span>
        <select name="sort" defaultValue={values.sort ?? sortOptions[0]?.value} className={inputClass}>
          {sortOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white hover:bg-signal/90"
      >
        Filter
      </button>
      <a href="?" className="px-1 py-1.5 text-sm text-graphite-500 hover:underline">
        Clear
      </a>
    </form>
  );
}

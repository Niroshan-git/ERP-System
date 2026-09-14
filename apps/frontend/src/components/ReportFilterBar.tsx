/**
 * Filter row above a report — same GET-`<form>`-no-client-JS pattern as ListFilterBar,
 * but without its Sort dropdown (reports don't sort the same way document lists do) and
 * labeled "Run Report" to match ERPNext Desk's own report toolbar button.
 */
export type ReportFilterFieldConfig =
  | { type: "text"; name: string; label: string }
  | { type: "date"; name: string; label: string }
  | { type: "number"; name: string; label: string }
  | { type: "select"; name: string; label: string; options: string[]; allowAny?: boolean };

export function ReportFilterBar({
  fields,
  values,
}: {
  fields: ReportFilterFieldConfig[];
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
              {f.allowAny !== false && <option value="">Any</option>}
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
      <button
        type="submit"
        className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white hover:bg-signal/90"
      >
        Run Report
      </button>
    </form>
  );
}

/**
 * Renders one tab's worth of Selling Settings fields. Plain (no "use client", no <form>
 * of its own) — every input carries a `form` attribute pointing at the settings page's
 * single <form id> (see SellingSettingsFormShell.tsx) so it submits as one document even
 * though each tab is a separate sibling <div> under DocTabs — same trick already
 * established by AddressContactFields.tsx/TermsFields.tsx for the sales doctypes.
 */
export type SettingsFieldSpec =
  | { kind: "text"; name: string; label: string }
  | { kind: "number"; name: string; label: string }
  | { kind: "select"; name: string; label: string; options: string[] }
  | { kind: "link"; name: string; label: string; options: string[] | null }
  | { kind: "checkbox"; name: string; label: string; bold?: boolean; description?: string };

export function SettingsFieldGroup({
  formId,
  fields,
  initial,
}: {
  formId: string;
  fields: SettingsFieldSpec[];
  initial: Record<string, unknown>;
}) {
  const plainFields = fields.filter((f) => f.kind !== "checkbox");
  const checkboxFields = fields.filter(
    (f): f is Extract<SettingsFieldSpec, { kind: "checkbox" }> => f.kind === "checkbox",
  );

  return (
    <div className="max-w-3xl space-y-6">
      {plainFields.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {plainFields.map((field) => (
            <PlainField key={field.name} field={field} formId={formId} initial={initial} />
          ))}
        </div>
      )}

      {checkboxFields.length > 0 && (
        <div className="space-y-3 border-t border-border pt-4">
          {checkboxFields.map((field) => (
            <label key={field.name} className="flex items-start gap-2 text-sm text-graphite-900">
              <input
                type="checkbox"
                name={field.name}
                form={formId}
                defaultChecked={Boolean(initial[field.name])}
                className="mt-0.5"
              />
              <span>
                <span className={field.bold ? "font-semibold" : ""}>{field.label}</span>
                {field.description && <span className="block text-xs text-graphite-500">{field.description}</span>}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function PlainField({
  field,
  formId,
  initial,
}: {
  field: Exclude<SettingsFieldSpec, { kind: "checkbox" }>;
  formId: string;
  initial: Record<string, unknown>;
}) {
  const raw = initial[field.name];
  const defaultValue = raw !== null && raw !== undefined ? String(raw) : "";
  const inputClass =
    "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";

  return (
    <div>
      <label htmlFor={field.name} className="mb-1 block text-sm font-medium text-graphite-900">
        {field.label}
      </label>

      {field.kind === "text" && (
        <input id={field.name} name={field.name} form={formId} defaultValue={defaultValue} className={inputClass} />
      )}

      {field.kind === "number" && (
        <input
          type="number"
          step="any"
          id={field.name}
          name={field.name}
          form={formId}
          defaultValue={defaultValue}
          className={inputClass}
        />
      )}

      {field.kind === "select" && (
        <select id={field.name} name={field.name} form={formId} defaultValue={defaultValue} className={inputClass}>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {field.kind === "link" &&
        (field.options ? (
          <select id={field.name} name={field.name} form={formId} defaultValue={defaultValue} className={inputClass}>
            <option value="">— none —</option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={field.name}
            name={field.name}
            form={formId}
            defaultValue={defaultValue}
            placeholder="Must match an existing value"
            className={inputClass}
          />
        ))}
    </div>
  );
}

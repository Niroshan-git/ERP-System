"use client";

import { useActionState } from "react";

export type FormState = { error?: string } | undefined;

export type FieldSpec =
  | { kind: "text"; id: string; label: string; required?: boolean; placeholder?: string }
  | { kind: "textarea"; id: string; label: string; required?: boolean }
  | { kind: "number"; id: string; label: string; required?: boolean }
  | { kind: "checkbox"; id: string; label: string; defaultChecked?: boolean }
  | { kind: "select"; id: string; label: string; options: string[]; required?: boolean }
  | { kind: "link"; id: string; label: string; options: string[] | null; required?: boolean }
  | { kind: "date"; id: string; label: string; required?: boolean };

/**
 * Generic create/edit form driven by a FieldSpec[], for the flat/self-referencing
 * master data doctypes (Customer Group, Territory, Price List, Contact, Address,
 * etc.). Mirrors the markup/behavior CustomerForm.tsx established — that component
 * stays hand-rolled since Customer has bespoke layout (two-column group, and the
 * checkbox only shows on edit), but every other master screen should use this.
 */
export function MasterForm({
  action,
  fields,
  initial,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: FieldSpec[];
  initial?: Record<string, unknown>;
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {fields.map((field) => (
        <FieldInput key={field.id} field={field} initial={initial} />
      ))}

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

function FieldInput({ field, initial }: { field: FieldSpec; initial?: Record<string, unknown> }) {
  const hasInitial = Boolean(initial && field.id in initial);
  const initialValue = initial?.[field.id];

  if (field.kind === "checkbox") {
    const defaultChecked = hasInitial ? Boolean(initialValue) : Boolean(field.defaultChecked);
    return (
      <label className="flex items-center gap-2 text-sm text-graphite-900">
        <input type="checkbox" id={field.id} name={field.id} defaultChecked={defaultChecked} />
        {field.label}
      </label>
    );
  }

  const defaultValue = hasInitial && initialValue !== null && initialValue !== undefined ? String(initialValue) : "";

  return (
    <div>
      <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-graphite-900">
        {field.label}
      </label>

      {field.kind === "textarea" && (
        <textarea
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={defaultValue}
          rows={3}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      )}

      {field.kind === "text" && (
        <input
          id={field.id}
          name={field.id}
          required={field.required}
          placeholder={field.placeholder}
          defaultValue={defaultValue}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      )}

      {field.kind === "date" && (
        <input
          type="date"
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={defaultValue}
          className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      )}

      {field.kind === "number" && (
        <input
          type="number"
          step="any"
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={defaultValue}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      )}

      {field.kind === "select" && (
        <select
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={defaultValue}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        >
          {!field.required && <option value="">— none —</option>}
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.kind === "link" &&
        (field.options ? (
          <select
            id={field.id}
            name={field.id}
            required={field.required}
            defaultValue={defaultValue}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          >
            <option value="">— none —</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={field.id}
            name={field.id}
            required={field.required}
            defaultValue={defaultValue}
            placeholder="Must match an existing value"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        ))}
    </div>
  );
}

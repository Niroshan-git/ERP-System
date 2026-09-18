"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(app)/master-data/customers/actions";

const CUSTOMER_TYPES = ["Company", "Individual", "Partnership"];

export function CustomerForm({
  action,
  groups,
  territories,
  initial,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  groups: string[] | null;
  territories: string[] | null;
  initial?: {
    customer_name: string;
    customer_type: string;
    customer_group?: string;
    territory?: string;
    disabled?: number;
  };
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="customer_name" className="mb-1 block text-sm font-medium text-graphite-900">
          Customer name
        </label>
        <input
          id="customer_name"
          name="customer_name"
          required
          defaultValue={initial?.customer_name}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      <div>
        <label htmlFor="customer_type" className="mb-1 block text-sm font-medium text-graphite-900">
          Customer type
        </label>
        <select
          id="customer_type"
          name="customer_type"
          required
          defaultValue={initial?.customer_type ?? CUSTOMER_TYPES[0]}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        >
          {CUSTOMER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <LinkOrTextField id="customer_group" label="Customer group" options={groups} defaultValue={initial?.customer_group} />
        <LinkOrTextField id="territory" label="Territory" options={territories} defaultValue={initial?.territory} />
      </div>

      {initial && (
        <label className="flex items-center gap-2 text-sm text-graphite-900">
          <input type="checkbox" name="disabled" defaultChecked={Boolean(initial.disabled)} />
          Disabled
        </label>
      )}

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

function LinkOrTextField({
  id,
  label,
  options,
  defaultValue,
}: {
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
          defaultValue={defaultValue}
          placeholder="Must match an existing value"
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      )}
    </div>
  );
}

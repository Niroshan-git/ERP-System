"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(app)/master-data/suppliers/actions";

const SUPPLIER_TYPES = ["Company", "Individual", "Partnership"];

export function SupplierForm({
  action,
  groups,
  countries,
  initial,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  groups: string[] | null;
  countries: string[] | null;
  initial?: {
    supplier_name: string;
    supplier_type: string;
    supplier_group?: string;
    country?: string;
    disabled?: number;
  };
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="supplier_name" className="mb-1 block text-sm font-medium text-graphite-900">
          Supplier name
        </label>
        <input
          id="supplier_name"
          name="supplier_name"
          required
          defaultValue={initial?.supplier_name}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      <div>
        <label htmlFor="supplier_type" className="mb-1 block text-sm font-medium text-graphite-900">
          Supplier type
        </label>
        <select
          id="supplier_type"
          name="supplier_type"
          required
          defaultValue={initial?.supplier_type ?? SUPPLIER_TYPES[0]}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        >
          {SUPPLIER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <LinkOrTextField id="supplier_group" label="Supplier group" options={groups} defaultValue={initial?.supplier_group} />
        <LinkOrTextField id="country" label="Country" options={countries} defaultValue={initial?.country} />
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

"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(app)/sales/items/actions";

export function ItemForm({
  action,
  groups,
  uoms,
  initial,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  groups: string[] | null;
  uoms: string[] | null;
  initial?: {
    item_code: string;
    item_name?: string;
    item_group: string;
    stock_uom: string;
    is_stock_item?: 0 | 1;
    disabled?: 0 | 1;
    standard_rate?: number;
    description?: string;
  };
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, undefined);
  const isEdit = Boolean(initial);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="item_code" className="mb-1 block text-sm font-medium text-graphite-900">
          Item code
        </label>
        <input
          id="item_code"
          name="item_code"
          required
          disabled={isEdit}
          defaultValue={initial?.item_code}
          className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal disabled:bg-canvas disabled:text-graphite-500"
        />
      </div>

      <div>
        <label htmlFor="item_name" className="mb-1 block text-sm font-medium text-graphite-900">
          Item name
        </label>
        <input
          id="item_name"
          name="item_name"
          defaultValue={initial?.item_name}
          placeholder={initial?.item_code}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectOrTextField id="item_group" label="Item group" required options={groups} defaultValue={initial?.item_group} />
        <SelectOrTextField id="stock_uom" label="Unit of measure" required options={uoms} defaultValue={initial?.stock_uom} />
      </div>

      <div>
        <label htmlFor="standard_rate" className="mb-1 block text-sm font-medium text-graphite-900">
          Standard selling rate
        </label>
        <input
          id="standard_rate"
          name="standard_rate"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initial?.standard_rate}
          className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm tabular-nums focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-graphite-900">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-graphite-900">
          <input type="checkbox" name="is_stock_item" defaultChecked={initial ? Boolean(initial.is_stock_item) : true} />
          Maintain stock
        </label>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-graphite-900">
            <input type="checkbox" name="disabled" defaultChecked={Boolean(initial?.disabled)} />
            Disabled
          </label>
        )}
      </div>

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

function SelectOrTextField({
  id,
  label,
  required,
  options,
  defaultValue,
}: {
  id: string;
  label: string;
  required?: boolean;
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
          required={required}
          defaultValue={defaultValue ?? ""}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        >
          <option value="" disabled>
            Select…
          </option>
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
          required={required}
          defaultValue={defaultValue}
          placeholder="Must match an existing value"
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      )}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { LineItemsEditor, type LineRow } from "@/components/LineItemsEditor";
import type { ItemOption } from "@/lib/actions/itemLookup";

export type MaterialRequestFormState = { error?: string } | undefined;

/**
 * `material_request_type` is always hard-coded to "Purchase" server-side (see
 * buying/material-requests/actions.ts) — this module is Purchase-only, so the field is
 * never exposed here at all, per the plan's explicit instruction.
 */
export function MaterialRequestForm({
  action,
  itemOptions,
  companies,
  initial,
}: {
  action: (state: MaterialRequestFormState, formData: FormData) => Promise<MaterialRequestFormState>;
  itemOptions: ItemOption[];
  companies: string[];
  initial?: {
    company: string;
    transaction_date: string;
    schedule_date?: string;
    items: LineRow[];
  };
}) {
  const [state, formAction, isPending] = useActionState<MaterialRequestFormState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);
  const [scheduleDate, setScheduleDate] = useState(initial?.schedule_date ?? "");

  return (
    <form id="material-request-form" action={formAction} className="max-w-3xl space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="company" className="mb-1 block text-sm font-medium text-graphite-900">
            Company
          </label>
          <select
            id="company"
            name="company"
            required
            defaultValue={initial?.company ?? companies[0] ?? ""}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          >
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="transaction_date" className="mb-1 block text-sm font-medium text-graphite-900">
            Date
          </label>
          <input
            type="date"
            id="transaction_date"
            name="transaction_date"
            required
            defaultValue={initial?.transaction_date ?? today}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div>
          <label htmlFor="schedule_date" className="mb-1 block text-sm font-medium text-graphite-900">
            Required by
          </label>
          <input
            type="date"
            id="schedule_date"
            name="schedule_date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
          <p className="mt-1 text-xs text-graphite-500">Used as the default for new item rows below.</p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-graphite-900">Items</p>
        <LineItemsEditor
          fieldName="items"
          itemOptions={itemOptions}
          initialRows={initial?.items}
          currency=""
          showRate={false}
          showScheduleDate
          defaultScheduleDate={scheduleDate}
        />
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

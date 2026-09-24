"use client";

import { useActionState } from "react";
import { MANUAL_LEAD_STATUS_OPTIONS } from "@/lib/leadStatusOptions";

type ActionState = { error?: string } | undefined;

/**
 * Small "Change status" dropdown + confirm control for the Lead detail header — reused
 * shape from `DocActionBar` (bound server action + inline error via `useActionState`), but
 * with a `<select>` instead of a single submit button, since Lead's status change isn't a
 * one-way Submit/Cancel transition. Only offers `MANUAL_LEAD_STATUS_OPTIONS` — see
 * `crm/leads/actions.ts`'s `updateLeadStatusAction` doc comment for why
 * Opportunity/Quotation/Converted are excluded (conversion-actions-only).
 */
export function LeadStatusControl({
  action,
  currentStatus,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  currentStatus: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, undefined);
  const isManual = MANUAL_LEAD_STATUS_OPTIONS.includes(currentStatus);

  if (!isManual) {
    // currentStatus is Opportunity/Quotation/Converted — set only by the conversion actions,
    // never manually. Rendering a <select> here would silently default to
    // MANUAL_LEAD_STATUS_OPTIONS[0] ("Lead"), and a stray "Update status" click would then
    // revert an already-converted Lead back to "Lead" — show status as read-only instead.
    return <span className="text-sm text-graphite-500">Status is set automatically by conversion — no manual change available.</span>;
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <select
        name="status"
        defaultValue={currentStatus}
        className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-graphite-900 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
      >
        {MANUAL_LEAD_STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-graphite-900 hover:bg-surface disabled:opacity-60"
      >
        {isPending ? "Updating…" : "Update status"}
      </button>
      {state?.error && <span className="text-sm text-alert">{state.error}</span>}
    </form>
  );
}

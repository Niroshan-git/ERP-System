"use client";

import { useActionState } from "react";

type FormState = { error?: string } | undefined;

/**
 * Mirrors `SetQuotationLostForm` — same "Table MultiSelect" Lost Reasons (required) +
 * "Small Text" Detailed Reason (optional) shape, calling ERPNext's real
 * `Opportunity.declare_enquiry_lost(lost_reasons_list, competitors, detailed_reason)`
 * (source-verified, `docs/backend/16-crm/crm-architecture.md` §6 — the same underlying
 * mechanism Quotation's own "Lost" transition uses). Competitors is intentionally not built
 * here either — see `setQuotationAsLostAction`'s doc comment for why an empty list is fine.
 */
export function SetOpportunityLostForm({
  action,
  lostReasons,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  lostReasons: string[] | null;
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <span className="mb-1 block text-sm font-medium text-graphite-900">Lost reasons</span>
        {lostReasons && lostReasons.length > 0 ? (
          <div className="space-y-2 rounded-md border border-border p-3">
            {lostReasons.map((reason) => (
              <label key={reason} className="flex items-center gap-2 text-sm text-graphite-900">
                <input type="checkbox" name="lost_reasons" value={reason} />
                {reason}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-alert">
            No Opportunity Lost Reason records exist yet — create at least one in ERPNext before this opportunity can
            be marked Lost.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="detailed_reason" className="mb-1 block text-sm font-medium text-graphite-900">
          Detailed reason (optional)
        </label>
        <textarea
          id="detailed_reason"
          name="detailed_reason"
          rows={3}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      {state?.error && <p className="text-sm text-alert">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending || !lostReasons || lostReasons.length === 0}
        className="rounded-md border border-alert px-4 py-2 text-sm font-medium text-alert hover:bg-alert/10 disabled:opacity-60"
      >
        {isPending ? "Marking…" : "Mark Lost"}
      </button>
    </form>
  );
}

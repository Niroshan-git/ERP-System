"use client";

import { useActionState } from "react";

type FormState = { error?: string } | undefined;

/**
 * Mirrors ERPNext's own "Set as Lost" dialog (`erpnext/public/js/utils/sales_common.js`'s
 * `pre_sales.set_as_lost`, confirmed on the live server) as a dedicated page instead of a
 * modal — same "Table MultiSelect" Lost Reasons (required) + "Small Text" Detailed Reason
 * (optional) fields, just rendered as plain checkboxes since this app has no Table
 * MultiSelect widget. The real dialog's third field, Competitors, is intentionally not
 * built here (see setQuotationAsLostAction's doc comment) — declare_enquiry_lost accepts
 * an empty competitors list fine, matching real ERPNext behavior when that field is left
 * blank.
 */
export function SetQuotationLostForm({
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
            No Quotation Lost Reason records exist yet — create at least one in ERPNext before this quotation can be
            set as Lost.
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
        {isPending ? "Declaring…" : "Declare Lost"}
      </button>
    </form>
  );
}

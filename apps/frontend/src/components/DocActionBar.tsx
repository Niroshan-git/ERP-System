"use client";

import { useActionState } from "react";

type DocActionState = { error?: string } | undefined;

/**
 * Submit/Cancel button bound to a server action, with inline error rendering —
 * same FormState pattern as CustomerForm.tsx, just without any other fields.
 * Used on Quotation/Sales Order/Sales Invoice detail views (see docStatus.ts).
 */
export function DocActionBar({
  action,
  label,
  pendingLabel,
  variant = "primary",
}: {
  action: (state: DocActionState, formData: FormData) => Promise<DocActionState>;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "danger";
}) {
  const [state, formAction, isPending] = useActionState<DocActionState, FormData>(action, undefined);

  const buttonClass =
    variant === "danger"
      ? "rounded-md border border-alert px-4 py-2 text-sm font-medium text-alert hover:bg-alert/10 disabled:opacity-60"
      : "rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60";

  return (
    <form action={formAction} className="flex items-center gap-3">
      <button type="submit" disabled={isPending} className={buttonClass}>
        {isPending ? pendingLabel : label}
      </button>
      {state?.error && <span className="text-sm text-alert">{state.error}</span>}
    </form>
  );
}

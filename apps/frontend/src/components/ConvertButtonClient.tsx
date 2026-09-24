"use client";

import { useActionState } from "react";

type ActionState = { error?: string } | undefined;

/**
 * Same shape as `DocActionBar` (bound zero-argument-beyond-`name` server action, inline
 * error via `useActionState`) — a separate component only because the Lead conversion
 * actions (`lib/actions/leadConversion.ts`) live in `lib/actions/`, not a per-doctype
 * `actions.ts`, and this button's copy/semantics ("Convert to X") don't fit
 * `DocActionBar`'s Submit/Cancel-flavored `variant` prop.
 */
export function ConvertButtonClient({
  action,
  label,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-signal px-3 py-1.5 text-sm font-medium text-signal hover:bg-signal/10 disabled:opacity-60"
      >
        {isPending ? "Converting…" : label}
      </button>
      {state?.error && <span className="text-sm text-alert">{state.error}</span>}
    </form>
  );
}

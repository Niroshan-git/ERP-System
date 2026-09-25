"use client";

import { useActionState } from "react";
import { DocTabs, type DocTab } from "@/components/DocTabs";

export type SettingsFormState = { error?: string } | undefined;

const DEFAULT_FORM_ID = "selling-settings-form";

/**
 * Owns the single <form> for the whole settings doc plus a Save button that stays
 * visible across every tab (unlike the sales doctypes' forms, which only show Save while
 * the tab holding the literal <form> element is active). The <form> here has no fields
 * of its own — every field lives in a SettingsFieldGroup elsewhere in the tab tree and
 * points back at it via `form={formId}` (see that component's doc comment), and the
 * button below does the same via its own `form` attribute so it can submit from outside
 * the <form>'s DOM subtree too.
 *
 * `formId` defaults to `DEFAULT_FORM_ID` (`"selling-settings-form"`) so existing callers that
 * don't pass it keep working unchanged, but any caller whose `SettingsFieldGroup` fields carry
 * a different `formId` (e.g. Account Determination's `"account-determination-form"`) MUST pass
 * the matching `formId` prop here — otherwise the fields' `form=` attribute points at a
 * `<form id>` that doesn't exist in the DOM, and Save silently submits an empty FormData.
 */
export function SellingSettingsFormShell({
  action,
  tabs,
  formId = DEFAULT_FORM_ID,
}: {
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  tabs: DocTab[];
  formId?: string;
}) {
  const [state, formAction, isPending] = useActionState<SettingsFormState, FormData>(action, undefined);

  return (
    <div>
      <form id={formId} action={formAction} />
      <DocTabs tabs={tabs} />
      {state?.error && <p className="mt-4 text-sm text-alert">{state.error}</p>}
      <button
        type="submit"
        form={formId}
        disabled={isPending}
        className="mt-6 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

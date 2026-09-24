"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(app)/accounting/bank-accounts/actions";

export type BankAccountFormInitial = {
  account_name: string;
  bank: string;
  company?: string;
  account?: string;
  branch_code?: string;
  bank_account_no?: string;
  iban?: string;
  is_default?: 0 | 1;
  is_company_account?: 0 | 1;
  is_credit_card?: 0 | 1;
  disabled?: 0 | 1;
};

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";
const selectClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";
const labelClass = "mb-1 block text-sm font-medium text-graphite-900";

/**
 * Bespoke form (not the generic `MasterForm`) — same precedent `CustomerForm.tsx` set for a
 * doctype with layout/behavior generic `FieldSpec`s don't cover: the "Bank" field needs
 * get-or-create autocomplete (a `<datalist>`, not a plain Link `<select>`, since the live
 * tenant has zero `Bank` records and `MasterForm`'s "link" kind only ever renders a required
 * dropdown or a bare "must match an existing value" text input — neither fits "type a new
 * bank name and it gets created"), and the two sensitive fields need explicit on-screen
 * disclosure that they're shown in full here but masked everywhere else in this app.
 */
export function BankAccountForm({
  action,
  companies,
  accountOptions,
  bankOptions,
  initial,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  companies: string[];
  accountOptions: string[];
  bankOptions: string[];
  initial?: BankAccountFormInitial;
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="account_name" className={labelClass}>
          Account name
        </label>
        <input
          id="account_name"
          name="account_name"
          required
          defaultValue={initial?.account_name}
          placeholder="e.g. Main Operating Account"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="bank" className={labelClass}>
          Bank
        </label>
        <input
          id="bank"
          name="bank"
          required
          list="bank-options"
          defaultValue={initial?.bank}
          placeholder="e.g. Commercial Bank of Ceylon"
          className={inputClass}
        />
        <datalist id="bank-options">
          {bankOptions.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-graphite-500">
          {bankOptions.length > 0
            ? "Pick an existing bank or type a new one — a new Bank record is created automatically the first time a name is used."
            : "No Bank records exist yet on this tenant — type a bank name and one will be created automatically."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="company" className={labelClass}>
            Company
          </label>
          <select id="company" name="company" defaultValue={initial?.company ?? ""} className={selectClass}>
            <option value="">— none —</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="account" className={labelClass}>
            Linked Account (GL)
          </label>
          <select id="account" name="account" defaultValue={initial?.account ?? ""} className={selectClass}>
            <option value="">— none —</option>
            {accountOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="space-y-2 rounded-md border border-border p-3">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-graphite-500">
          Sensitive details — shown in full here, masked in the list view
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="bank_account_no" className={labelClass}>
              Account number
            </label>
            <input id="bank_account_no" name="bank_account_no" defaultValue={initial?.bank_account_no} className={inputClass} />
          </div>
          <div>
            <label htmlFor="iban" className={labelClass}>
              IBAN
            </label>
            <input id="iban" name="iban" defaultValue={initial?.iban} className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="branch_code" className={labelClass}>
            Branch code
          </label>
          <input id="branch_code" name="branch_code" defaultValue={initial?.branch_code} className={inputClass} />
        </div>
      </fieldset>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-graphite-900">
          <input type="checkbox" name="is_company_account" defaultChecked={Boolean(initial?.is_company_account)} />
          Company account (requires Company and Linked Account above)
        </label>
        <label className="flex items-center gap-2 text-sm text-graphite-900">
          <input type="checkbox" name="is_default" defaultChecked={Boolean(initial?.is_default)} />
          Default account
        </label>
        <label className="flex items-center gap-2 text-sm text-graphite-900">
          <input type="checkbox" name="is_credit_card" defaultChecked={Boolean(initial?.is_credit_card)} />
          Credit card
        </label>
        <label className="flex items-center gap-2 text-sm text-graphite-900">
          <input type="checkbox" name="disabled" defaultChecked={Boolean(initial?.disabled)} />
          Disabled
        </label>
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

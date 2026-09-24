"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import type { FormState } from "@/app/(app)/accounting/chart-of-accounts/actions";
import { ACCOUNT_TYPE_OPTIONS, BALANCE_MUST_BE_OPTIONS } from "@/lib/accountConstants";
import { indentedLabel, type AccountOption } from "@/lib/accountHierarchy";

export type AccountFormInitial = {
  account_name: string;
  account_number?: string;
  parent_account?: string;
  is_group?: 0 | 1;
  account_type?: string;
  account_category?: string;
  account_currency?: string;
  balance_must_be?: string;
  freeze_account?: string;
  tax_rate?: number;
  disabled?: 0 | 1;
};

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";
const selectClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";
const disabledSelectClass =
  "w-full rounded-md border border-border bg-canvas/60 px-3 py-2 text-sm text-graphite-500";
const labelClass = "mb-1 block text-sm font-medium text-graphite-900";
const helpClass = "mt-1 text-xs text-graphite-500";

/**
 * Bespoke form (not the generic `MasterForm`) — same precedent `BankAccountForm.tsx`/
 * `CustomerForm.tsx` set: `Account` needs contextual behavior generic `FieldSpec`s don't
 * cover — a hierarchical Parent Account selector whose choice drives a live Root/Report Type
 * preview, and Group-vs-Ledger fields that only make sense for one or the other. Every field
 * choice and validation note below is live-verified against ERPNext 16.34.2's real `Account`
 * controller, 2026-09-24 — see `docs/backend/06-accounting/chart-of-accounts-bank-account.md`.
 */
export function AccountForm({
  action,
  mode,
  company,
  companyLocked,
  accountOptions,
  parentLocked,
  categoryOptions,
  currencyOptions,
  currentName,
  initial,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  mode: "create" | "edit";
  company: string;
  companyLocked: boolean;
  /** This company's Account tree, depth-first — used both for the Parent Account select and the live Root/Report Type preview. */
  accountOptions: AccountOption[];
  /** True when navigated from "+ Add child account" on the tree — Parent Account is preselected and shown read-only. */
  parentLocked: boolean;
  categoryOptions: string[];
  currencyOptions: string[];
  /** Edit mode only — excludes the account being edited from its own Parent Account options. */
  currentName?: string;
  initial?: AccountFormInitial;
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, undefined);
  const [isGroup, setIsGroup] = useState(Boolean(initial?.is_group));
  const [parentAccount, setParentAccount] = useState(initial?.parent_account ?? "");

  const groupOptions = useMemo(
    () => accountOptions.filter((o) => o.is_group && o.name !== currentName),
    [accountOptions, currentName],
  );
  const selectedParent = useMemo(
    () => accountOptions.find((o) => o.name === parentAccount),
    [accountOptions, parentAccount],
  );

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
          placeholder="e.g. Marketing Expenses"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="account_number" className={labelClass}>
            Account number
          </label>
          <input id="account_number" name="account_number" defaultValue={initial?.account_number} className={inputClass} />
        </div>
        <div>
          <label htmlFor="company" className={labelClass}>
            Company
          </label>
          <input id="company_display" value={company} disabled readOnly className={disabledSelectClass} />
          <input type="hidden" name="company" value={company} />
          {!companyLocked && (
            <p className={helpClass}>Set by the Chart of Accounts page you came from.</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="parent_account" className={labelClass}>
          Parent account (Group)
        </label>
        {parentLocked ? (
          <>
            <input value={indentedLabel(selectedParent ?? { name: parentAccount, account_name: parentAccount, is_group: 1, parent_account: null, depth: 0 })} disabled readOnly className={disabledSelectClass} />
            <input type="hidden" name="parent_account" value={parentAccount} />
          </>
        ) : (
          <select
            id="parent_account"
            name="parent_account"
            required
            value={parentAccount}
            onChange={(e) => setParentAccount(e.target.value)}
            className={selectClass}
          >
            <option value="">— choose a group account —</option>
            {groupOptions.map((o) => (
              <option key={o.name} value={o.name}>
                {indentedLabel(o)}
              </option>
            ))}
          </select>
        )}
        <p className={helpClass}>
          {selectedParent
            ? `Root Type: ${selectedParent.root_type || "—"} · Report Type: ${selectedParent.report_type || "—"} (inherited from the parent — ERPNext recomputes these automatically, they can't be set directly).`
            : "Every account is created under an existing group — ERPNext doesn't support adding new root-level accounts here."}
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-graphite-900">
          <input
            type="checkbox"
            name="is_group"
            checked={isGroup}
            onChange={(e) => setIsGroup(e.target.checked)}
          />
          Group account (a folder for other accounts, not postable itself)
        </label>
      </div>

      {!isGroup && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="account_type" className={labelClass}>
              Account type
            </label>
            <select id="account_type" name="account_type" defaultValue={initial?.account_type ?? ""} className={selectClass}>
              <option value="">— none —</option>
              {ACCOUNT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="account_currency" className={labelClass}>
              Account currency
            </label>
            <select
              id="account_currency"
              name="account_currency"
              defaultValue={initial?.account_currency ?? ""}
              className={selectClass}
            >
              <option value="">— company default —</option>
              {currencyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {isGroup && (
        <p className="text-xs text-graphite-500">
          Account type and currency only apply to ledger (non-group) accounts — ERPNext blocks converting a group with an
          account type back to a ledger.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="account_category" className={labelClass}>
            Account category
          </label>
          <select id="account_category" name="account_category" defaultValue={initial?.account_category ?? ""} className={selectClass}>
            <option value="">— none —</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="balance_must_be" className={labelClass}>
            Balance must be
          </label>
          <select id="balance_must_be" name="balance_must_be" defaultValue={initial?.balance_must_be ?? ""} className={selectClass}>
            <option value="">— either —</option>
            {BALANCE_MUST_BE_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="tax_rate" className={labelClass}>
            Tax rate (%)
          </label>
          <input
            type="number"
            step="any"
            id="tax_rate"
            name="tax_rate"
            defaultValue={initial?.tax_rate}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="freeze_account" className={labelClass}>
            Freeze account
          </label>
          {mode === "create" ? (
            <select id="freeze_account" name="freeze_account" defaultValue={initial?.freeze_account ?? "No"} className={selectClass}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          ) : (
            <>
              <input value={initial?.freeze_account ?? "No"} disabled readOnly className={disabledSelectClass} />
              <p className={helpClass}>
                Can&apos;t be changed here — ERPNext requires a Company &quot;Role allowed for frozen entries&quot; to be
                configured first, which neither company has set up yet.
              </p>
            </>
          )}
        </div>
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

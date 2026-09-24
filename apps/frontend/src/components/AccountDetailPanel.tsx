import Link from "next/link";
import { CLASSIFICATION_BADGE_CLASS, CLASSIFICATION_LABEL, type AccountClassification } from "@/lib/accountHierarchy";

export type AccountDetailDoc = {
  name: string;
  account_name: string;
  account_number?: string | null;
  parent_account?: string | null;
  account_type?: string | null;
  account_currency?: string | null;
  disabled?: 0 | 1;
};

const CLASSIFICATION_HINT: Record<AccountClassification, string> = {
  TITLE: "Groups accounts below it — cannot be posted to directly.",
  ACTIVE: "Postable ledger account.",
  CONTROL: "Postable — consolidates Customer/Supplier sub-ledger balances, posted to automatically.",
};

/**
 * FIN-1F-2 inline account detail panel — shows the selected tree row's details in place,
 * left-docked next to the tree (per Niroshan's SAP B1 reference screenshot), instead of
 * navigating to a separate route to merely look at an account. Read-only in this package;
 * FIN-1F-3 converts this into a live inline edit form matching SAP B1's own behavior. The
 * [Edit] link below still goes to the existing, already-accepted full-page form
 * (`/accounting/chart-of-accounts/[name]`) until then.
 */
export function AccountDetailPanel({
  account,
  classification,
  level,
  drawerLabel,
  companyCurrency,
}: {
  account: AccountDetailDoc | null;
  classification: AccountClassification;
  level: number;
  drawerLabel: string;
  companyCurrency: string;
}) {
  if (!account) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-graphite-500 lg:w-72 lg:shrink-0">
        Select an account in the tree to view its details here.
      </div>
    );
  }

  const isRoot = !account.parent_account;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4 lg:w-72 lg:shrink-0">
      <div>
        <p className="font-mono text-xs text-graphite-500">{account.name}</p>
        <h2 className="text-lg font-medium text-graphite-900">{account.account_name}</h2>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${CLASSIFICATION_BADGE_CLASS[classification]}`}>
          {CLASSIFICATION_LABEL[classification]}
        </span>
        <span className="rounded bg-graphite-500/10 px-1.5 py-0.5 text-[11px] font-medium text-graphite-500">Level {level}</span>
        {account.disabled ? (
          <span className="rounded bg-alert/10 px-1.5 py-0.5 text-[11px] font-medium text-alert">Status: Disabled</span>
        ) : (
          <span className="rounded bg-graphite-500/10 px-1.5 py-0.5 text-[11px] font-medium text-graphite-500">Status: Enabled</span>
        )}
      </div>
      <p className="text-xs text-graphite-500">{CLASSIFICATION_HINT[classification]}</p>

      <dl className="space-y-1.5 text-sm">
        <Field label="Drawer" value={drawerLabel} />
        <Field label="Parent" value={account.parent_account ?? "— (root account)"} />
        {account.account_number && <Field label="Account No." value={account.account_number} />}
        {account.account_type && <Field label="Account Type" value={account.account_type} />}
        <Field label="Currency" value={account.account_currency || companyCurrency} />
      </dl>

      {isRoot ? (
        <p className="rounded-md border border-border bg-canvas/60 px-2.5 py-2 text-xs text-graphite-500">
          Root account — protected from editing, disabling, and deletion. Manage sub-accounts underneath it instead.
        </p>
      ) : (
        <Link
          href={`/accounting/chart-of-accounts/${encodeURIComponent(account.name)}`}
          className="inline-block rounded-md bg-signal px-3 py-1.5 text-xs font-medium text-white hover:bg-signal/90"
        >
          Edit
        </Link>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-graphite-500">{label}</dt>
      <dd className="truncate text-right font-medium text-graphite-900">{value}</dd>
    </div>
  );
}

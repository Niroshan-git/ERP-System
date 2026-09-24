import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type AccountTreeRow = {
  name: string;
  account_name: string;
  parent_account: string | null;
  is_group: 0 | 1;
  root_type?: string | null;
  report_type?: string | null;
  account_type?: string | null;
  account_currency?: string | null;
  account_number?: string | null;
  disabled: 0 | 1;
};

const ROOT_KEY = "__root__";
const MAX_INDENT_DEPTH = 6;
const INDENT_PX = 16;

/**
 * Chart of Accounts tree. Server-rendered, no client JS for the tree itself: expand/collapse
 * uses the native `<details>/<summary>` element plus Tailwind's `group-open:` CSS variant (an
 * attribute selector on `[open]`, not a JS listener), so it works before hydration and on
 * very narrow widths without a bundled interaction library. Each row links to the account's
 * own detail/edit page (`FIN-1E`, `/accounting/chart-of-accounts/[name]`) — FIN-1 originally
 * shipped this read-only with every field inline instead of a click-through; FIN-1E adds real
 * maintenance, so a detail route now exists and every account name is a link to it. Group
 * rows additionally carry a small "+" to `.../new?parent=<name>` for contextual child-account
 * creation directly from the tree, per the FIN-1E brief.
 *
 * Root groups (Asset/Liability/Income/Expense/Equity, 5 on the live tenant) default open;
 * everything below stays collapsed by default given the tree is ~96 accounts deep on the real
 * company — showing all of it open at once would be a wall of text on a phone.
 */
export function ChartOfAccountsTree({
  accounts,
  companyCurrency,
  company,
}: {
  accounts: AccountTreeRow[];
  companyCurrency: string;
  /** Carried into each "+ Add child account" link so the create form's Company stays locked to this tree's company. */
  company: string;
}) {
  const byParent = new Map<string, AccountTreeRow[]>();
  for (const account of accounts) {
    const key = account.parent_account || ROOT_KEY;
    const list = byParent.get(key);
    if (list) list.push(account);
    else byParent.set(key, [account]);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.account_name.localeCompare(b.account_name));
  }
  const roots = byParent.get(ROOT_KEY) ?? [];

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface p-2 sm:p-3">
      {roots.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-graphite-500">No accounts found for this company.</p>
      ) : (
        <ul className="space-y-0.5">
          {roots.map((account) => (
            <AccountNode
              key={account.name}
              account={account}
              byParent={byParent}
              companyCurrency={companyCurrency}
              company={company}
              depth={0}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AccountBadges({ account, companyCurrency }: { account: AccountTreeRow; companyCurrency: string }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {account.account_number && (
        <span className="font-mono text-xs text-graphite-500">{account.account_number}</span>
      )}
      {account.account_type && (
        <span className="rounded bg-graphite-500/10 px-1.5 py-0.5 text-[11px] font-medium text-graphite-500">
          {account.account_type}
        </span>
      )}
      {account.account_currency && account.account_currency !== companyCurrency && (
        <span className="rounded bg-signal/10 px-1.5 py-0.5 text-[11px] font-medium text-signal">
          {account.account_currency}
        </span>
      )}
      {account.disabled ? (
        <span className="rounded bg-alert/10 px-1.5 py-0.5 text-[11px] font-medium text-alert">Disabled</span>
      ) : null}
    </span>
  );
}

function AccountLink({ account }: { account: AccountTreeRow }) {
  return (
    <Link
      href={`/accounting/chart-of-accounts/${encodeURIComponent(account.name)}`}
      className="font-medium text-graphite-900 hover:text-signal hover:underline"
    >
      {account.account_name}
    </Link>
  );
}

function AddChildLink({ account, company }: { account: AccountTreeRow; company: string }) {
  return (
    <Link
      href={`/accounting/chart-of-accounts/new?company=${encodeURIComponent(company)}&parent=${encodeURIComponent(account.name)}`}
      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-signal hover:bg-signal/10"
      title={`Add a child account under ${account.account_name}`}
    >
      + Add
    </Link>
  );
}

function AccountNode({
  account,
  byParent,
  companyCurrency,
  company,
  depth,
}: {
  account: AccountTreeRow;
  byParent: Map<string, AccountTreeRow[]>;
  companyCurrency: string;
  company: string;
  depth: number;
}) {
  const children = byParent.get(account.name) ?? [];
  const indent = Math.min(depth, MAX_INDENT_DEPTH) * INDENT_PX;

  if (account.is_group && children.length > 0) {
    return (
      <li>
        <details className="group" open={depth < 1}>
          <summary
            className="flex cursor-pointer list-none items-center gap-2 rounded py-1.5 pr-2 hover:bg-canvas/60"
            style={{ paddingLeft: indent }}
          >
            <ChevronRight size={14} className="shrink-0 text-graphite-400 transition-transform group-open:rotate-90" />
            <span className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <AccountLink account={account} />
              <AccountBadges account={account} companyCurrency={companyCurrency} />
              <AddChildLink account={account} company={company} />
            </span>
          </summary>
          <ul className="space-y-0.5">
            {children.map((child) => (
              <AccountNode
                key={child.name}
                account={child}
                byParent={byParent}
                companyCurrency={companyCurrency}
                company={company}
                depth={depth + 1}
              />
            ))}
          </ul>
        </details>
      </li>
    );
  }

  return (
    <li
      className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5 pr-2 text-sm"
      style={{ paddingLeft: account.is_group ? indent : indent + 20 }}
    >
      <AccountLink account={account} />
      <AccountBadges account={account} companyCurrency={companyCurrency} />
      {account.is_group && <AddChildLink account={account} company={company} />}
    </li>
  );
}

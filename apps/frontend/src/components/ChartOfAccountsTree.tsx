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
 * Read-only Chart of Accounts tree — FIN-1. Server-rendered, no client JS: expand/collapse
 * uses the native `<details>/<summary>` element plus Tailwind's `group-open:` CSS variant
 * (an attribute selector on `[open]`, not a JS listener), so it works before hydration and on
 * very narrow widths without a bundled interaction library. No per-account detail route or
 * edit affordance exists here — FIN-1 is read-only per its authorized scope (see
 * `docs/backend/06-accounting/chart-of-accounts-bank-account.md`); every field a user might
 * want is already shown inline on each row instead of behind a click-through.
 *
 * Root groups (Asset/Liability/Income/Expense/Equity, 5 on the live tenant) default open;
 * everything below stays collapsed by default given the tree is ~96 accounts deep on the real
 * company — showing all of it open at once would be a wall of text on a phone.
 */
export function ChartOfAccountsTree({
  accounts,
  companyCurrency,
}: {
  accounts: AccountTreeRow[];
  companyCurrency: string;
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

function AccountNode({
  account,
  byParent,
  companyCurrency,
  depth,
}: {
  account: AccountTreeRow;
  byParent: Map<string, AccountTreeRow[]>;
  companyCurrency: string;
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
              <span className="font-medium text-graphite-900">{account.account_name}</span>
              <AccountBadges account={account} companyCurrency={companyCurrency} />
            </span>
          </summary>
          <ul className="space-y-0.5">
            {children.map((child) => (
              <AccountNode
                key={child.name}
                account={child}
                byParent={byParent}
                companyCurrency={companyCurrency}
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
      style={{ paddingLeft: indent + 20 }}
    >
      <span className="text-graphite-900">{account.account_name}</span>
      <AccountBadges account={account} companyCurrency={companyCurrency} />
    </li>
  );
}

export type AccountHierarchyRow = {
  name: string;
  account_name: string;
  parent_account: string | null;
  is_group: 0 | 1;
  root_type?: string | null;
  report_type?: string | null;
};

export type AccountOption = AccountHierarchyRow & { depth: number };

/**
 * Flattens a company's Account list into depth-first tree order with an indent `depth`, for
 * a hierarchical Parent Account `<select>` (indentation shown via leading dashes in the
 * rendered label). Deliberately a native `<select>` with indented labels rather than a new
 * tree-picker widget — same "no bundled tree-widget library" call FIN-1's
 * `ChartOfAccountsTree` already made for the read-only tree view (see that component's own
 * doc comment); a native select is still keyboard/type-ahead searchable and renders as the
 * OS's own picker on mobile, matching this app's mobile-first bar without a new dependency.
 */
export function buildAccountOptions(accounts: AccountHierarchyRow[]): AccountOption[] {
  const ROOT_KEY = "__root__";
  const byParent = new Map<string, AccountHierarchyRow[]>();
  for (const a of accounts) {
    const key = a.parent_account || ROOT_KEY;
    const list = byParent.get(key);
    if (list) list.push(a);
    else byParent.set(key, [a]);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.account_name.localeCompare(b.account_name));
  }

  const result: AccountOption[] = [];
  function walk(node: AccountHierarchyRow, depth: number) {
    result.push({ ...node, depth });
    for (const child of byParent.get(node.name) ?? []) walk(child, depth + 1);
  }
  for (const root of byParent.get(ROOT_KEY) ?? []) walk(root, 0);
  return result;
}

/** Indented option label, e.g. depth 2 -> "— — Stock Expenses - CS". */
export function indentedLabel(option: AccountOption): string {
  return `${"— ".repeat(option.depth)}${option.account_name}`;
}

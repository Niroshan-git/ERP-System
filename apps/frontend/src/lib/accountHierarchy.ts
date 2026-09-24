export type AccountHierarchyRow = {
  name: string;
  account_name: string;
  parent_account: string | null;
  is_group: 0 | 1;
  root_type?: string | null;
  report_type?: string | null;
  disabled?: 0 | 1;
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

/**
 * FIN-1F: SAP Business One-inspired presentation concepts (Drawer / Title / Active / Level),
 * derived entirely from existing ERPNext Account fields — `is_group`, `parent_account`, the
 * root account itself — never persisted as new fields, per the FIN-1F owner brief's "Data
 * Model Rule" (`docs/backend/06-accounting/chart-of-accounts-sap-b1-architecture.md`).
 *
 * `level` is 1-indexed (root/drawer = Level 1) to match SAP B1's own "Level 1..N" convention,
 * unlike `AccountOption.depth` above (0-indexed, indent-only, pre-existing FIN-1E contract —
 * left alone rather than renumbered, to avoid touching the working Parent Account selector).
 */
export type AccountClassification = "TITLE" | "ACTIVE";

export type AccountPresentation = AccountHierarchyRow & {
  depth: number;
  level: number;
  classification: AccountClassification;
  /** The top ancestor's `name` — every account in a tree shares one drawer with its root. */
  drawer: string;
  drawerLabel: string;
};

export function buildAccountPresentation(accounts: AccountHierarchyRow[]): AccountPresentation[] {
  const options = buildAccountOptions(accounts);
  const drawerLabelByName = new Map<string, string>();
  for (const option of options) {
    if (option.depth === 0) drawerLabelByName.set(option.name, option.account_name);
  }

  const byName = new Map(accounts.map((a) => [a.name, a]));
  const drawerOf = new Map<string, string>();
  function resolveDrawer(name: string): string {
    const cached = drawerOf.get(name);
    if (cached) return cached;
    const account = byName.get(name);
    const parent = account?.parent_account;
    const drawer = parent ? resolveDrawer(parent) : name;
    drawerOf.set(name, drawer);
    return drawer;
  }

  return options.map((option) => {
    const drawer = resolveDrawer(option.name);
    return {
      ...option,
      level: option.depth + 1,
      classification: option.is_group ? "TITLE" : "ACTIVE",
      drawer,
      drawerLabel: drawerLabelByName.get(drawer) ?? drawer,
    };
  });
}

export type DrawerSummary = {
  drawer: string;
  drawerLabel: string;
  rootType?: string | null;
  total: number;
  titles: number;
  actives: number;
  disabled: number;
};

/** One summary row per drawer (root account), for drawer-navigation cards — counts only, no report/GL calls. */
export function summarizeDrawers(presentation: AccountPresentation[]): DrawerSummary[] {
  const summaries = new Map<string, DrawerSummary>();
  for (const account of presentation) {
    let summary = summaries.get(account.drawer);
    if (!summary) {
      summary = {
        drawer: account.drawer,
        drawerLabel: account.drawerLabel,
        rootType: account.root_type,
        total: 0,
        titles: 0,
        actives: 0,
        disabled: 0,
      };
      summaries.set(account.drawer, summary);
    }
    summary.total += 1;
    if (account.classification === "TITLE") summary.titles += 1;
    else summary.actives += 1;
    if (account.disabled) summary.disabled += 1;
  }
  return Array.from(summaries.values()).sort((a, b) => a.drawerLabel.localeCompare(b.drawerLabel));
}

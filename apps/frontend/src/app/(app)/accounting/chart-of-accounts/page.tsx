import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AccountDetailPanel, type AccountDetailDoc } from "@/components/AccountDetailPanel";
import { AccountDrawerRail } from "@/components/AccountDrawerRail";
import { AccountLevelControl } from "@/components/AccountLevelControl";
import { ChartOfAccountsTree, type AccountTreeRow } from "@/components/ChartOfAccountsTree";
import { buildAccountPresentation, maxLevel, summarizeDrawers } from "@/lib/accountHierarchy";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import { getCompanyOptions } from "@/lib/financeDefaults";

/**
 * Chart of Accounts. `Account` is a real Frappe tree doctype (`is_tree: true`, `lft`/`rgt`/
 * `parent_account`), 96 Account records on "Ceylon Stack" (192 across both companies), 5 root
 * groups (Asset/Liability/Income/Expense/Equity), no `amended_from` field — matches
 * Warehouse's own "tree doctype with no submit lifecycle" shape
 * (`docs/backend/01-master-data/warehouse.md`), not a submittable document.
 *
 * FIN-1 (2026-09-24) shipped this read-only. FIN-1E (same day) adds real maintenance —
 * Create/Edit/Disable/Delete via `/accounting/chart-of-accounts/[name]` and
 * `/accounting/chart-of-accounts/new`.
 *
 * Fetches the full per-company Account set in one call (a page size of 200 comfortably covers
 * the live 96/company count with real headroom) rather than paginating — a tree view can't be
 * split across pages without breaking parent/child continuity.
 *
 * FIN-1F-2 reworks this into a three-pane SAP B1-style layout, per Niroshan's reference
 * screenshot: an inline account detail panel (left), the tree with a "Display Level" control
 * (middle), and a vertical drawer rail (right) — superseding FIN-1F-1's horizontal drawer cards
 * (unreviewed, so replacing rather than layering was safe). `?account=`, `?level=`, and
 * `?drawer=` are independent display filters over the one Account fetch above — no new API
 * calls, no accounting data touched. See
 * `docs/backend/06-accounting/chart-of-accounts-sap-b1-architecture.md` for the Drawer/Title/
 * Active/Control/Level concept mapping. Editing still happens on the existing full-page
 * `[name]` route via the panel's [Edit] link — FIN-1F-3 turns the panel itself into a live
 * inline edit form.
 */
export default async function ChartOfAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; drawer?: string; level?: string; account?: string }>;
}) {
  const {
    company: requestedCompany,
    drawer: requestedDrawer,
    level: requestedLevel,
    account: requestedAccount,
  } = await searchParams;
  const { companies, company } = await getCompanyOptions(requestedCompany);

  const [accounts, companyDoc] = await Promise.all([
    listDocs<AccountTreeRow>("Account", {
      fields: [
        "name",
        "account_name",
        "parent_account",
        "is_group",
        "root_type",
        "report_type",
        "account_type",
        "account_currency",
        "account_number",
        "disabled",
      ],
      filters: [["company", "=", company]],
      limit: 200,
      orderBy: "lft asc",
    }),
    getDoc<{ default_currency?: string }>("Company", company),
  ]);

  const presentation = buildAccountPresentation(accounts);
  const presentationByName = new Map(presentation.map((p) => [p.name, p]));
  const drawerSummaries = summarizeDrawers(presentation);

  const validDrawer = requestedDrawer && drawerSummaries.some((s) => s.drawer === requestedDrawer) ? requestedDrawer : null;
  // Scoped to the active drawer (not the whole tenant) so the Level control never offers pills
  // deeper than what that drawer's own subtree actually has.
  const treeMaxLevel = maxLevel(validDrawer ? presentation.filter((p) => p.drawer === validDrawer) : presentation);
  const parsedLevel = requestedLevel ? Number.parseInt(requestedLevel, 10) : NaN;
  const validLevel = Number.isFinite(parsedLevel) && parsedLevel >= 1 ? parsedLevel : null;
  const validAccount = requestedAccount && presentationByName.has(requestedAccount) ? requestedAccount : null;

  const visiblePresentation = presentation.filter(
    (p) => (!validDrawer || p.drawer === validDrawer) && (!validLevel || p.level <= validLevel),
  );
  const visibleNames = new Set(visiblePresentation.map((p) => p.name));
  const treeRows: AccountTreeRow[] = accounts
    .filter((a) => visibleNames.has(a.name))
    .map((a) => {
      const p = presentationByName.get(a.name)!;
      return { ...a, classification: p.classification, level: p.level };
    });

  let selectedDoc: AccountDetailDoc | null = null;
  if (validAccount) {
    try {
      selectedDoc = await getDoc<AccountDetailDoc>("Account", validAccount);
    } catch (e) {
      if (!(e instanceof ErpNextError && e.status === 404)) throw e;
    }
  }
  const selectedPresentation = validAccount ? presentationByName.get(validAccount) : undefined;

  const buildHref = (overrides: { drawer?: string | null; level?: number | null; account?: string | null }) => {
    const params = new URLSearchParams({ company });
    const drawer = "drawer" in overrides ? overrides.drawer : validDrawer;
    const level = "level" in overrides ? overrides.level : validLevel;
    const account = "account" in overrides ? overrides.account : validAccount;
    if (drawer) params.set("drawer", drawer);
    if (level) params.set("level", String(level));
    if (account) params.set("account", account);
    return `/accounting/chart-of-accounts?${params.toString()}`;
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Finance", href: "/accounting" }, { label: "Chart of Accounts" }]} />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-graphite-900">Chart of Accounts</h1>
          <p className="mt-1 text-sm text-graphite-500">
            {treeRows.length} of {accounts.length} accounts for {company}
            {validDrawer ? ` in ${drawerSummaries.find((s) => s.drawer === validDrawer)?.drawerLabel}` : ""}.
            Click an account to view its details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/accounting/chart-of-accounts/new?company=${encodeURIComponent(company)}`}
            className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
          >
            + New account
          </Link>

          {companies.length > 1 && (
            // Plain GET form, no client JS — a Server Component page can't attach an
            // onChange auto-submit handler to a host element (event handlers can't cross the
            // server/client boundary here), so this is a deliberate explicit "Go" button
            // rather than an auto-submitting select.
            <form className="flex items-center gap-2 text-sm" action="/accounting/chart-of-accounts" method="get">
              <label htmlFor="company" className="text-graphite-500">
                Company
              </label>
              <select
                id="company"
                name="company"
                defaultValue={company}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
              >
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-canvas/60">
                Go
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="lg:order-1">
          <AccountDetailPanel
            account={selectedDoc}
            classification={selectedPresentation?.classification ?? "ACTIVE"}
            level={selectedPresentation?.level ?? 1}
            drawerLabel={selectedPresentation?.drawerLabel ?? ""}
            companyCurrency={companyDoc.default_currency ?? ""}
          />
        </div>

        <div className="min-w-0 flex-1 lg:order-2">
          <div className="mb-3">
            <AccountLevelControl
              maxLevel={treeMaxLevel}
              activeLevel={validLevel}
              buildHref={(level) => buildHref({ level, account: null })}
            />
          </div>
          <ChartOfAccountsTree
            accounts={treeRows}
            companyCurrency={companyDoc.default_currency ?? ""}
            company={company}
            buildAccountHref={(name) => buildHref({ account: name })}
            selectedAccount={validAccount}
          />
        </div>

        <div className="lg:order-3">
          <AccountDrawerRail
            summaries={drawerSummaries}
            activeDrawer={validDrawer}
            buildHref={(drawer) => buildHref({ drawer, level: null, account: null })}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-graphite-500">
        Need Cost Centers, Journal Entries, or financial statements?{" "}
        <Link href="/accounting" className="text-signal hover:underline">
          Back to Finance home
        </Link>{" "}
        — those ship in later Finance V1 packages.
      </p>
    </div>
  );
}

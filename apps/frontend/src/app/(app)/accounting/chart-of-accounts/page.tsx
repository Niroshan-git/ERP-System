import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AccountDrawerNav } from "@/components/AccountDrawerNav";
import { ChartOfAccountsTree, type AccountTreeRow } from "@/components/ChartOfAccountsTree";
import { buildAccountPresentation, summarizeDrawers } from "@/lib/accountHierarchy";
import { getDoc, listDocs } from "@/lib/erpnext";
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
 * `/accounting/chart-of-accounts/new` — while this page itself stays the read-oriented tree
 * view, now with a "New account" entry point and each row linking to its own detail page.
 *
 * Fetches the full per-company Account set in one call (a page size of 200 comfortably covers
 * the live 96/company count with real headroom) rather than paginating — a tree view can't be
 * split across pages without breaking parent/child continuity, the same reasoning
 * `ChartOfAccountsTree`'s own doc comment gives for rendering everything server-side.
 *
 * FIN-1F-1 adds the SAP B1-inspired drawer navigation (`AccountDrawerNav`) above the tree —
 * `?drawer=<root account>` filters the same in-memory fetch to one root's subtree, a display
 * concern only (no new API call, no accounting data touched). See
 * `docs/backend/06-accounting/chart-of-accounts-sap-b1-architecture.md` for the full Drawer/
 * Title/Active/Level concept mapping; the tree row redesign, detail inspector, contextual
 * same/sub-level creation, search, and level filtering are later FIN-1F sub-packages.
 */
export default async function ChartOfAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; drawer?: string }>;
}) {
  const { company: requestedCompany, drawer: requestedDrawer } = await searchParams;
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
  const drawerSummaries = summarizeDrawers(presentation);
  const validDrawer = requestedDrawer && drawerSummaries.some((s) => s.drawer === requestedDrawer) ? requestedDrawer : null;
  const visibleNames = validDrawer
    ? new Set(presentation.filter((p) => p.drawer === validDrawer).map((p) => p.name))
    : null;
  const visibleAccounts = visibleNames ? accounts.filter((a) => visibleNames.has(a.name)) : accounts;

  const buildDrawerHref = (drawer: string | null) => {
    const params = new URLSearchParams({ company });
    if (drawer) params.set("drawer", drawer);
    return `/accounting/chart-of-accounts?${params.toString()}`;
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Finance", href: "/accounting" }, { label: "Chart of Accounts" }]} />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-graphite-900">Chart of Accounts</h1>
          <p className="mt-1 text-sm text-graphite-500">
            {visibleAccounts.length} of {accounts.length} accounts for {company}
            {validDrawer ? ` in ${drawerSummaries.find((s) => s.drawer === validDrawer)?.drawerLabel}` : ""}.
            Click an account to view, edit, disable, or delete it.
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

      <AccountDrawerNav summaries={drawerSummaries} activeDrawer={validDrawer} buildHref={buildDrawerHref} />

      <ChartOfAccountsTree accounts={visibleAccounts} companyCurrency={companyDoc.default_currency ?? ""} company={company} />

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

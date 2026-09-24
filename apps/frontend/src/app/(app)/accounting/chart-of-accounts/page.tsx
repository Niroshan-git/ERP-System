import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ChartOfAccountsTree, type AccountTreeRow } from "@/components/ChartOfAccountsTree";
import { getDoc, listDocs } from "@/lib/erpnext";
import { getCompanyOptions } from "@/lib/financeDefaults";

/**
 * FIN-1 — Chart of Accounts, read-only. Live-verified against ERPNext 16.34.2 on 2026-09-24:
 * `Account` is a real Frappe tree doctype (`is_tree: true`, `lft`/`rgt`/`parent_account`), 96
 * Account records on "Ceylon Stack" (192 across both companies), 5 root groups (Asset/
 * Liability/Income/Expense/Equity), no `amended_from` field — matches Warehouse's own
 * "tree doctype with no submit lifecycle" shape (`docs/backend/01-master-data/warehouse.md`),
 * not a submittable document. No create/edit/delete action anywhere on this page — Account
 * mutation is explicitly out of FIN-1 scope (a future, separately authorized package) per
 * `docs/backend/06-accounting/finance-architecture.md` §5.
 *
 * Fetches the full per-company Account set in one call (a page size of 200 comfortably covers
 * the live 96/company count with real headroom) rather than paginating — a tree view can't be
 * split across pages without breaking parent/child continuity, the same reasoning
 * `ChartOfAccountsTree`'s own doc comment gives for rendering everything server-side.
 */
export default async function ChartOfAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company: requestedCompany } = await searchParams;
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

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Finance", href: "/accounting" }, { label: "Chart of Accounts" }]} />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-graphite-900">Chart of Accounts</h1>
          <p className="mt-1 text-sm text-graphite-500">
            Read-only view of ERPNext&apos;s own Account tree ({accounts.length} accounts for {company}). Adding or
            editing accounts stays in ERPNext Desk for now.
          </p>
        </div>

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

      <ChartOfAccountsTree accounts={accounts} companyCurrency={companyDoc.default_currency ?? ""} />

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

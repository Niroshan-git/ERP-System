import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AccountForm } from "@/components/AccountForm";
import { listDocs } from "@/lib/erpnext";
import { getCompanyOptions } from "@/lib/financeDefaults";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { buildAccountOptions, type AccountHierarchyRow } from "@/lib/accountHierarchy";
import { createAccountAction } from "../actions";

/**
 * FIN-1E — Create Account. `parent`/`company` search params are set when this page is
 * reached via "+ Add child account" on the Chart of Accounts tree (`ChartOfAccountsTree.tsx`)
 * — when both are present, Company and Parent Account render locked/read-only in the form,
 * matching the brief's "preselect the parent, inherit company" requirement. Reached without
 * them (the page's own top-level "New account" link), the user must pick both explicitly —
 * every account still requires a real parent group (`parent_account` is `reqd: 1` on every
 * non-root Account, live-verified; this app never offers creating a 6th root).
 */
export default async function NewAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; parent?: string }>;
}) {
  const { company: requestedCompany, parent } = await searchParams;
  const { company } = await getCompanyOptions(requestedCompany);

  const [accounts, categoryOptions, currencyOptions] = await Promise.all([
    listDocs<AccountHierarchyRow>("Account", {
      fields: ["name", "account_name", "parent_account", "is_group", "root_type", "report_type"],
      filters: [["company", "=", company]],
      limit: 200,
      orderBy: "lft asc",
    }),
    fetchLinkOptions("Account Category"),
    fetchLinkOptions("Currency"),
  ]);

  const accountOptions = buildAccountOptions(accounts);
  const parentLocked = Boolean(parent && accountOptions.some((o) => o.name === parent && o.is_group));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Finance", href: "/accounting" },
          { label: "Chart of Accounts", href: "/accounting/chart-of-accounts" },
          { label: "New Account" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">New account</h1>
      <p className="mb-4 text-sm text-graphite-500">
        {parentLocked
          ? "Creating a child account — parent and company are set for you."
          : "Every account is created under an existing group account."}{" "}
        <Link href="/accounting/chart-of-accounts" className="text-signal hover:underline">
          Back to Chart of Accounts
        </Link>
      </p>
      <AccountForm
        action={createAccountAction}
        mode="create"
        company={company}
        companyLocked={parentLocked}
        accountOptions={accountOptions}
        parentLocked={parentLocked}
        categoryOptions={categoryOptions ?? []}
        currencyOptions={currencyOptions ?? []}
        initial={parentLocked ? { account_name: "", parent_account: parent } : undefined}
      />
    </div>
  );
}
